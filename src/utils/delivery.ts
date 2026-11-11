// Delivery areas, read from a second BaseRow table. Fees are NOT charged at
// checkout anymore — after paying, shoppers are sent to WhatsApp to agree on
// the delivery fee there. This table now only drives the area picker labels.
// Create a table in the same database as the kits (one row per area):
//
//   Location / Area | Fee | Is Default
//   Nairobi         | 200 | true
//   Mombasa         | 450 | false
//   Kisumu          | 400 | false
//
// Only a location and a fee are required. The `Is Default` column is optional —
// without it the default comes from VITE_DELIVERY_FEE (or 200), and shoppers who
// do not appear in the list are charged that default.
//
// Column names are matched loosely through the same alias logic as the kits
// table, so "Fee", "delivery_fee" and "Delivery Fee (Ksh)" all work.

import {
  BASEROW_API_KEY,
  BASEROW_ENABLED,
  fetchTableRows,
  toBool,
  toPrice,
  type RawRow,
  type RawValue,
} from './baserow'

export interface DeliveryZone {
  id: string
  location: string
  fee: number
  isDefault: boolean
}

const ENV = (import.meta as any).env || {}

export const DELIVERY_TABLE_ID = String(ENV.VITE_DELIVERY_TABLE_ID || '')
export const DELIVERY_ENABLED = Boolean(DELIVERY_TABLE_ID && BASEROW_ENABLED)

// A BaseRow token can be scoped to a single table. If the kits token 401s on the
// delivery table, issue a second token for it (or a database-wide one) and put it
// here; unset reuses the kits token.
const DELIVERY_TOKEN = String(ENV.VITE_DELIVERY_TOKEN || '') || BASEROW_API_KEY

/** Charged when nothing is flagged default and no area matches. */
export const FALLBACK_DELIVERY_FEE = (() => {
  const n = parseFloat(String(ENV.VITE_DELIVERY_FEE ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : 200
})()

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

const LOCATION_KEYS = ['location', 'area', 'deliveryarea', 'town', 'city', 'county', 'region', 'place', 'zone', 'deliveryzone', 'name', 'title']
const FEE_KEYS = ['fee', 'deliveryfee', 'charge', 'charges', 'deliverycharge', 'price', 'amount', 'cost', 'rate', 'shipping', 'shippingfee', 'ksh']
const DEFAULT_KEYS = ['default', 'isdefault', 'defaultfee', 'isdefaultfee', 'fallback', 'basefee', 'basestate']

function findKey(row: RawRow, keys: string[], used: string[]): string | undefined {
  return Object.keys(row).find(
    (k) => !used.includes(k) && k !== 'id' && k !== 'order' && keys.includes(norm(k)),
  )
}

function stringValue(v: RawValue): string {
  if (v === null || v === undefined) return ''
  // A single-select comes back as { id, value }; a text column as a plain string.
  if (Array.isArray(v)) return String((v[0] as any)?.value ?? (v[0] as any)?.choice ?? '')
  if (typeof v === 'object') return String((v as any).value ?? (v as any).choice ?? '')
  return String(v)
}

function isTextish(v: RawValue): boolean {
  if (typeof v === 'string') return v.trim().length > 0
  if (Array.isArray(v)) return v.length > 0 && typeof v[0] === 'object'
  if (v && typeof v === 'object') return 'value' in (v as unknown as Record<string, unknown>)
  return false
}

const isNumericish = (v: RawValue): boolean =>
  typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && Number.isFinite(toPrice(v)))

export function mapDeliveryRow(row: RawRow): DeliveryZone | null {
  const dataKeys = Object.keys(row).filter((k) => k !== 'id' && k !== 'order')
  const used: string[] = []

  // Named column first, otherwise the first text-shaped value — the primary
  // field of a delivery table is nearly always the area name.
  let locationKey = findKey(row, LOCATION_KEYS, used)
  if (!locationKey) locationKey = dataKeys.find((k) => isTextish(row[k]))
  if (!locationKey) return null
  used.push(locationKey)
  const location = stringValue(row[locationKey]).trim()
  if (!location) return null

  let feeKey = findKey(row, FEE_KEYS, used)
  if (!feeKey) feeKey = dataKeys.find((k) => !used.includes(k) && isNumericish(row[k]))
  if (feeKey) used.push(feeKey)
  const fee = feeKey ? toPrice(row[feeKey]) : FALLBACK_DELIVERY_FEE

  const defaultKey = findKey(row, DEFAULT_KEYS, used)
  if (defaultKey) used.push(defaultKey)
  // A blank flag column means "not the default", not "unknown".
  const isDefault = defaultKey ? toBool(row[defaultKey], false) : false

  return {
    id: `dz-${row.id ?? norm(location)}`,
    location,
    fee,
    isDefault,
  }
}

/* ---------- Fetch + cache ---------- */
let zoneCache: DeliveryZone[] | null = null
let zonePromise: Promise<DeliveryZone[]> | null = null

export function getCachedDeliveryZones(): DeliveryZone[] | null {
  return zoneCache
}

export async function fetchDeliveryZones(): Promise<DeliveryZone[]> {
  if (zoneCache) return zoneCache
  if (zonePromise) return zonePromise
  if (!DELIVERY_ENABLED) return Promise.resolve([])

  zonePromise = (async () => {
    const rows = await fetchTableRows(DELIVERY_TABLE_ID, DELIVERY_TOKEN)
    const zones = rows.map(mapDeliveryRow).filter((z): z is DeliveryZone => Boolean(z))
    zoneCache = zones
    const skipped = rows.length - zones.length
    console.info(
      `[Delivery] ${zones.length}/${rows.length} areas loaded` +
        (skipped ? ` · ${skipped} row(s) skipped for a missing location` : '') +
        (zones.some((z) => z.isDefault) ? '' : ` · no row flagged default, using ${FALLBACK_DELIVERY_FEE}`),
    )
    return zones
  })()

  zonePromise.catch(() => { zonePromise = null })
  return zonePromise
}

/**
 * The area charged when the shopper makes no choice: the row marked default,
 * otherwise the env fallback.
 */
export function defaultZone(zones: DeliveryZone[]): DeliveryZone | null {
  return zones.find((z) => z.isDefault) || null
}

export function defaultDeliveryFee(zones: DeliveryZone[]): number {
  const d = defaultZone(zones)
  return d ? d.fee : FALLBACK_DELIVERY_FEE
}

/** Fee for a chosen zone id; falls back to the default when nothing matches. */
export function deliveryFeeFor(zones: DeliveryZone[], zoneId: string): number {
  const match = zoneId ? zones.find((z) => z.id === zoneId) : null
  return (match ?? defaultZone(zones))?.fee ?? FALLBACK_DELIVERY_FEE
}

/** Label shown in the totals block. */
export function deliveryLabel(zones: DeliveryZone[], zoneId: string): string {
  const match = zoneId ? zones.find((z) => z.id === zoneId) : null
  if (match) return match.location
  const d = defaultZone(zones)
  return d ? d.location : 'DEFAULT AREA'
}
