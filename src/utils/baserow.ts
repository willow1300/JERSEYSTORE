// BaseRow kit loader — the source of truth for NEW ARRIVAL, ALL-KITS and RETRO.
//
// Configure in .env.local:
//   VITE_BASEROW_URL=https://api.baserow.io      (the API host, NOT the baserow.io app)
//   VITE_BASEROW_API_KEY=xxx                     (BaseRow -> avatar -> Menu -> API)
//   VITE_BASEROW_TABLE_ID=1300934                (number in .../database/{db}/table/{ID})
//
// Rows are requested with user_field_names=true, so they arrive keyed by column
// name. Names are matched loosely (case/spaces/underscores ignored), so
// "In Stock", "in_stock" and "INSTOCK" all resolve to the same column.
//
// NOTE: the API key ships in the client bundle. BaseRow sends it as an
// `Authorization: Token` header, so it is not visible in image URLs, but anyone
// can still read it from the JS — scope the key to this table only.

import { CLOUDINARY_CLOUD_NAME } from './cloudinary'
import type { Product } from '../data/types'

/* ---------- Types ---------- */
export interface Kit extends Product {
  inStock: boolean
  isNew?: boolean
  /** Optional so the local placeholder lists in the pages stay valid Kit objects. */
  sizes?: string[]
  gallery?: string[]
}

interface BaserowFile {
  url?: string
  name?: string
  visible_name?: string
  mime_type?: string
  size?: number
  thumbnails?: Record<string, { url?: string; width?: number | null; height?: number | null }>
}

export type RawValue = string | number | boolean | null | BaserowFile[] | { id?: number; value?: string; choice?: string }[]
export type RawRow = Record<string, RawValue>

/* ---------- Config ---------- */
const ENV = (import.meta as any).env || {}

// The baserow.io domain serves the web app, which 404s on /api/* — the REST API
// lives on its own host, so quietly correct it if the app URL was pasted in.
function normalizeBase(raw: string): string {
  let url = (raw || 'https://api.baserow.io').trim().replace(/\/+$/, '')
  try {
    const u = new URL(url)
    if (u.hostname === 'baserow.io' || u.hostname === 'www.baserow.io') {
      u.hostname = 'api.baserow.io'
      u.protocol = 'https:'
      u.pathname = ''
      url = u.toString().replace(/\/+$/, '')
    }
  } catch {
    /* keep whatever was given; the request will fail loudly */
  }
  return url
}

export const BASEROW_API_URL = normalizeBase(String(ENV.VITE_BASEROW_URL || ''))
export const BASEROW_API_KEY = String(ENV.VITE_BASEROW_API_KEY || '')
export const BASEROW_TABLE_ID = String(ENV.VITE_BASEROW_TABLE_ID || '')

export const BASEROW_ENABLED = Boolean(BASEROW_API_KEY && BASEROW_TABLE_ID)

// BaseRow stores originals; kits here are 4 MB HEIC, which Chrome/Firefox cannot
// decode. Routing through Cloudinary's remote fetch converts to WebP/AVIF and
// resizes (4.3 MB -> ~120 KB). Disable with VITE_BASEROW_CDN=off.
const IMAGE_PROXY = String(ENV.VITE_BASEROW_CDN || 'cloudinary').toLowerCase()

/* ---------- Column resolution ---------- */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

const ALIASES: Record<string, string[]> = {
  name: ['name', 'jerseyname', 'kitname', 'shirtname', 'product', 'productname', 'title', 'jersey', 'kit'],
  price: ['price', 'amount', 'cost', 'sellprice', 'priceksh', 'ksh', 'rate'],
  sizes: ['sizes', 'size', 'availablesizes', 'options', 'variants'],
  inStock: ['instock', 'stock', 'instockstatus', 'available', 'availability', 'quantity', 'qty', 'status'],
  isNew: ['new', 'isnew', 'newarrival', 'newin', 'latest', 'arrival', 'justin', 'featured'],
  retro: ['retro', 'isretro', 'retropick', 'vintage', 'isvintage'],
  club: ['club', 'team', 'clubteam', 'side'],
  image: ['image', 'images', 'photo', 'photos', 'picture', 'pictures', 'front', 'mainimage', 'kitimage', 'file', 'files'],
}

/** Find the row key that matches one of a field's aliases, skipping used keys. */
function pickKey(row: RawRow, key: string, used: string[]): string | undefined {
  const wanted = ALIASES[key] || []
  const keys = Object.keys(row).filter((k) => !used.includes(k) && k !== 'id' && k !== 'order')
  return keys.find((k) => wanted.includes(norm(k)))
}

const isFileList = (v: RawValue): v is BaserowFile[] =>
  Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && 'url' in (v[0] as BaserowFile)

/* ---------- Value coercion ---------- */
function toBool(v: RawValue, fallback = true): boolean {
  if (v === null || v === undefined || v === '') return fallback
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v > 0
  if (Array.isArray(v)) return v.length > 0
  const s = String(v).trim().toLowerCase()
  if (['true', '1', 'yes', 'y', 'in stock', 'instock', 'available', 'stocked', 'on'].includes(s)) return true
  if (['false', '0', 'no', 'n', 'out of stock', 'out', 'sold out', 'unavailable', 'oos'].includes(s)) return false
  return fallback
}
export { toBool }

function toPrice(v: RawValue): number {
  if (typeof v === 'number') return v
  // BaseRow hands numbers back as strings like "1500.00".
  const n = parseFloat(String(v ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}
export { toPrice }

function toSizes(v: RawValue): string[] {
  if (Array.isArray(v)) {
    return v
      .map((x) => (x && typeof x === 'object' ? String((x as any).value ?? (x as any).choice ?? '') : String(x)))
      .map((s) => s.trim())
      .filter(Boolean)
  }
  const s = String(v ?? '').trim()
  if (!s) return []
  return s.split(/[,/|]|\s{2,}|\s+/).map((x) => x.trim().toUpperCase()).filter((x) => x && x !== '-')
}

/* ---------- Image URL ---------- */
function optimizeImage(raw: string): string {
  if (!raw) return ''
  if (IMAGE_PROXY === 'off' || IMAGE_PROXY === 'none' || !CLOUDINARY_CLOUD_NAME) return raw
  if (raw.includes('res.cloudinary.com')) return raw
  const w = String(ENV.VITE_BASEROW_IMAGE_WIDTH || 800)
  // One transform for card, detail and gallery so each kit is downloaded once.
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch/q_auto,f_auto,w_${w}/${raw}`
}

function filesOf(v: RawValue): string[] {
  if (!isFileList(v)) return []
  return v.map((f) => optimizeImage(f.url || '')).filter(Boolean)
}

/* ---------- Retro detection by season/year in the name ---------- */
// Recognises: 1998, 98/99, 98-99, 1996–97 (en dash), 2025/26, 2025/2027, (2005), '98
const YEAR_RE = /\b(\d{2}|\d{4})\b/g

function expandYear(token: string): number | null {
  const n = Number(token)
  if (!Number.isFinite(n)) return null
  if (token.length === 4) return n >= 1900 && n <= 2100 ? n : null
  // Two digit season codes: 00-40 are 2000s, anything above is 1900s.
  return n <= 40 ? 2000 + n : 1900 + n
}

/** Every year/season found in a kit name. */
export function yearsInName(name: string): number[] {
  const out: number[] = []
  for (const m of name.matchAll(YEAR_RE)) {
    const y = expandYear(m[1])
    if (y) out.push(y)
  }
  return out
}

/**
 * A kit is retro when its latest season year is older than the current year.
 * "Chelsea 25/26" stays current; "Liverpool 00/01" and "Barcelona 1998" are retro.
 */
export function isRetroByName(name: string, currentYear = new Date().getFullYear()): boolean {
  const years = yearsInName(name)
  if (!years.length) return false
  return Math.max(...years) < currentYear
}

/* ---------- Mapping ---------- */
export function mapRow(row: RawRow): Kit | null {
  const used: string[] = []
  const grab = (key: string): { k?: string; value: RawValue } => {
    const k = pickKey(row, key, used)
    if (k) used.push(k)
    return { k, value: k ? row[k] ?? null : null }
  }

  const name = grab('name')
  const price = grab('price')
  const sizes = grab('sizes')
  const stock = grab('inStock')
  const newFlag = grab('isNew')
  const retroFlag = grab('retro')
  const club = grab('club')

  // Image column by name first, otherwise the first file-shaped value in the row.
  let imageField = grab('image')
  if (!imageField.k || !isFileList(imageField.value)) {
    const found = Object.keys(row).find((k) => !used.includes(k) && k !== 'id' && k !== 'order' && isFileList(row[k]))
    imageField = found ? { k: found, value: row[found] } : { value: null }
  }
  if (imageField.k) used.push(imageField.k)

  const files = filesOf(imageField.value)
  const kitName = String(name.value ?? '').trim()
  if (!kitName) return null

  const explicitRetro = retroFlag.k ? toBool(retroFlag.value, false) : false

  return {
    id: `br-${row.id ?? kitName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: kitName,
    image: files[0] || '',
    price: toPrice(price.value),
    sizes: toSizes(sizes.value),
    // A file column can hold several shots; all of them become the gallery.
    gallery: files,
    inStock: toBool(stock.value, true),
    isNew: newFlag.k ? toBool(newFlag.value, false) : false,
    retro: explicitRetro || isRetroByName(kitName),
    club: club.k ? String(club.value ?? '').trim() || undefined : undefined,
  }
}

/* ---------- Fetch + cache ---------- */
let kitCache: Kit[] | null = null
let kitPromise: Promise<Kit[]> | null = null

async function api(url: string, token?: string): Promise<any> {
  const res = await fetch(url, { headers: { Authorization: `Token ${token || BASEROW_API_KEY}` } })
  if (!res.ok) throw new Error(`BaseRow ${res.status} on ${url.replace(/size=\d+/, 'size=N')}`)
  return res.json()
}

// Any table in the same database, using the same key. Rows arrive 100 at a time;
// `next` is a full URL (served as http://, so force https to avoid
// mixed-content blocking once the site is on Netlify).
export async function fetchTableRows(tableId: string | number, token?: string): Promise<RawRow[]> {
  const size = 100
  const rows: RawRow[] = []
  let url: string | null =
    `${BASEROW_API_URL}/api/database/rows/table/${tableId}/?user_field_names=true&size=${size}`
  let guard = 0
  while (url && guard++ < 100) {
    const res = await api(url, token)
    rows.push(...(Array.isArray(res?.results) ? res.results : []))
    url = res?.next ? String(res.next).replace(/^http:/, 'https:') : null
  }
  return rows
}

async function loadRows(): Promise<RawRow[]> {
  return fetchTableRows(BASEROW_TABLE_ID)
}

export function getCachedBaserowKits(): Kit[] | null {
  return kitCache
}

export async function fetchBaserowKits(): Promise<Kit[]> {
  if (kitCache) return kitCache
  if (kitPromise) return kitPromise
  if (!BASEROW_ENABLED) return Promise.resolve([])

  kitPromise = (async () => {
    const rows = await loadRows()
    const kits = rows.map(mapRow).filter((k): k is Kit => Boolean(k && k.image))
    kitCache = kits
    const skipped = rows.length - kits.length
    console.info(
      `[BaseRow] ${kits.length}/${rows.length} kits loaded` +
        (skipped ? ` · ${skipped} row(s) skipped for a missing name or image` : '') +
        ` · columns: ${Object.keys(rows[0] || {}).filter((k) => k !== 'order').join(', ')}`,
    )
    return kits
  })()

  kitPromise.catch(() => { kitPromise = null })
  return kitPromise
}
