// Delivery Prices table, read from a second BaseRow table. The table prices
// specific areas (currently the Nairobi neighborhoods); the checkout dropdown
// offers those priced areas PLUS every Kenyan county, so delivery stays
// country-wide even where no price exists yet.
//
//   Location | Price
//   Westlands | 300
//   Kileleshwa | 300
//
// A separate County table holds flat per-county fees (near-Nairobi 250,
// western/northern/coastal 350, ...) keyed by the county name:
//
//   Name    | Price
//   Kiambu  | 250
//   Mombasa | 350
//
// A priced area or county is charged at checkout; anything without a price is
// agreed on WhatsApp after the order is placed. Column names are matched
// loosely through the same alias logic as the kits table, so "Fee",
// "delivery_fee" and "Delivery Fee (Ksh)" all work.

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
export const COUNTY_PRICES_TABLE_ID = String(ENV.VITE_COUNTY_PRICES_TABLE_ID || '')
export const COUNTY_PRICES_ENABLED = Boolean(COUNTY_PRICES_TABLE_ID && BASEROW_ENABLED)

// A BaseRow token can be scoped to a single table. If the kits token 401s on the
// delivery table, issue a second token for it (or a database-wide one) and put it
// here; unset reuses the kits token.
const DELIVERY_TOKEN = String(ENV.VITE_DELIVERY_TOKEN || '') || BASEROW_API_KEY

/** Charged when a table row has no price column. */
export const FALLBACK_DELIVERY_FEE = (() => {
  const n = parseFloat(String(ENV.VITE_DELIVERY_FEE ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : 0
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
        (skipped ? ` · ${skipped} row(s) skipped for a missing location` : ''),
    )
    return zones
  })()

  zonePromise.catch(() => { zonePromise = null })
  return zonePromise
}

/* ---------- County flat fees ---------- */

// Per-county fees (near-Nairobi 250, western/northern/coastal 350, ...) read
// from the County table with the same token as the Delivery Prices table.
// Keyed by the normalised county name so "Kiambu" and "Kiambu County" match.
let countyCache: Map<string, number> | null = null
let countyPromise: Promise<Map<string, number>> | null = null

export function getCachedCountyPrices(): Map<string, number> | null {
  return countyCache
}

export async function fetchCountyPrices(): Promise<Map<string, number>> {
  if (countyCache) return countyCache
  if (countyPromise) return countyPromise
  if (!COUNTY_PRICES_ENABLED) return Promise.resolve(new Map())

  countyPromise = (async () => {
    const rows = await fetchTableRows(COUNTY_PRICES_TABLE_ID, DELIVERY_TOKEN)
    const fees = new Map<string, number>()
    for (const row of rows) {
      const z = mapDeliveryRow(row)
      if (z && z.fee > 0) fees.set(norm(z.location), z.fee)
    }
    countyCache = fees
    console.info(`[Delivery] ${fees.size}/${rows.length} county prices loaded`)
    return fees
  })()

  countyPromise.catch(() => { countyPromise = null })
  return countyPromise
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

/* ---------- Counties + picker options ---------- */

// Every Kenyan county. Priced areas from the table are offered alongside these
// so delivery is country-wide even before every county has a price.
export const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos',
  'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', "Murang'a",
  'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
  'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans-Nzoia',
  'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
]

export interface DeliveryOption {
  id: string
  label: string
  /** Null for counties that have no price in the table yet. */
  fee: number | null
  kind: 'county' | 'zone'
}

/**
 * Picker options: every Kenyan county followed by the priced table areas.
 * Counties carry a flat fee from the County table (250 / 350); choosing one
 * whose name appears in the Delivery Prices table opens a second picker for
 * its priced areas, which are more specific than the flat fee.
 */
export function deliveryOptions(zones: DeliveryZone[], countyFees?: Map<string, number>): DeliveryOption[] {
  const fees = countyFees ?? new Map<string, number>()
  const feeFor = (county: string): number | null => {
    const c = norm(county)
    const exact = fees.get(c)
    if (exact != null) return exact
    // Lenient fallback so "Kiambu County" still matches "Kiambu".
    for (const [k, v] of fees) {
      if (k.includes(c) || c.includes(k)) return v
    }
    return null
  }

  const counties: DeliveryOption[] = KENYA_COUNTIES.map((c) => ({
    id: `county-${norm(c)}`,
    label: c,
    // Priced areas beat a flat county fee.
    fee: countyHasAreas(zones, c) ? null : feeFor(c),
    kind: 'county',
  }))

  const areas: DeliveryOption[] = zones.map((z) => ({
    id: z.id,
    label: z.location,
    fee: z.fee,
    kind: 'zone',
  }))

  return [...counties, ...areas]
}

/** True when the table has priced rows for a county (matched by name). */
export function countyHasAreas(zones: DeliveryZone[], county: string): boolean {
  const c = norm(county)
  return zones.some((z) => norm(z.location).includes(c))
}
