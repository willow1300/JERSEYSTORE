// Order saving — every checkout is POSTed to a BaseRow table so the shop has a
// record of it (customer, phone, items, amount, fulfillment). Configure in .env.local:
//
//   VITE_ORDERS_TABLE_ID=xxxxx     (table id in .../database/{db}/table/{ID})
//   VITE_ORDERS_TOKEN=xxxxx        (optional; defaults to VITE_BASEROW_API_KEY)
//
// Create the table in the SAME database as the kits with any of these columns
// (matched case/space/underscore insensitively):
//
//   Order Ref | Ref | Reference | Order No          (text)
//   Name | Full Name | Customer Name                (text)
//   Phone | Mobile | M-PESA Number                  (text or number)
//   Items | Order Items | Kits | Products           (long text)
//   Amount | Total | Paid                           (number)
//   Fulfillment | Delivery Method | Type            (text; "Delivery" / "Pickup")
//   Area | Location | Town | Zone                   (text)
//   Note | Notes | Comment | Landmark               (text, optional)
//   Account | Email                                 (text, optional)
//   Placed At | Date | Created                      (date, optional)
//
// The row is matched against the table's real column names by listing the
// table fields once and reusing the mapping for the session. Saving is
// fire-and-forget: a failure never blocks the customer's checkout.
//
// WARNING: like the kits token, this token ships in the client bundle. Use a
// separate token scoped to this one table (write access needed here).

import { BASEROW_API_KEY, BASEROW_API_URL } from './baserow'

const ENV = (import.meta as any).env || {}

export const ORDERS_TABLE_ID = String(ENV.VITE_ORDERS_TABLE_ID || '')
const ORDERS_TOKEN = String(ENV.VITE_ORDERS_TOKEN || '') || BASEROW_API_KEY
export const ORDERS_ENABLED = Boolean(ORDERS_TABLE_ID && ORDERS_TOKEN)

export interface OrderPayload {
  orderRef: string
  name: string
  phone: string
  items: string
  amount: number
  fulfillment: 'Delivery' | 'Pickup'
  area: string
  note?: string
  account?: string
  placedAt?: string
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Loose aliases for each order field, mirroring the kits/delivery tables. */
const FIELD_ALIASES: Record<string, string[]> = {
  orderRef: ['orderref', 'ref', 'reference', 'orderid', 'orderno', 'ordernumber', 'receipt'],
  name: ['name', 'fullname', 'customername', 'buyer', 'client', 'clientname', 'contactname'],
  phone: ['phone', 'phonenumber', 'mobile', 'mpesa', 'tel', 'telephone', 'contact', 'number'],
  items: ['items', 'orderitems', 'kits', 'products', 'cart', 'itemdetails', 'details', 'order'],
  amount: ['amount', 'total', 'totalpaid', 'paid', 'price', 'cost', 'orderamount'],
  fulfillment: ['fulfillment', 'fulfilment', 'deliverymethod', 'method', 'shipping', 'deliverytype', 'type'],
  area: ['area', 'location', 'zone', 'deliveryarea', 'town', 'county', 'region', 'place'],
  note: ['note', 'notes', 'comment', 'comments', 'landmark', 'instructions', 'request'],
  account: ['account', 'email', 'customeremail', 'useremail', 'buyeremail'],
  placedAt: ['placedat', 'date', 'created', 'createdat', 'timestamp', 'orderdate', 'placedon', 'when'],
}

interface BaserowField {
  id: number
  name: string
  type: string
}

let fieldsPromise: Promise<BaserowField[]> | null = null

async function fetchOrderFields(): Promise<BaserowField[]> {
  const res = await fetch(`${BASEROW_API_URL}/api/database/fields/table/${ORDERS_TABLE_ID}/`, {
    headers: { Authorization: `Token ${ORDERS_TOKEN}` },
  })
  if (!res.ok) throw new Error(`BaseRow ${res.status} listing order fields`)
  return (await res.json()) as BaserowField[]
}

/** Numbers keep the number column happy; everything else is sent as text. */
function coerce(field: BaserowField, value: string | number): string | number {
  if (field.type === 'number') {
    const n = Number(String(value).replace(/[^0-9.-]/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  // BaseRow date-only columns reject full ISO timestamps — send YYYY-MM-DD.
  if (field.type === 'date') return String(value).slice(0, 10)
  return String(value)
}

/**
 * Save one order row. Never throws — returns true when the row was created.
 */
export async function submitOrder(order: OrderPayload): Promise<boolean> {
  if (!ORDERS_ENABLED) return false
  try {
    if (!fieldsPromise) {
      fieldsPromise = fetchOrderFields()
      fieldsPromise.catch(() => { fieldsPromise = null })
    }
    const fields = await fieldsPromise

    const values: Record<string, string | number | undefined> = {
      orderRef: order.orderRef,
      name: order.name,
      phone: order.phone,
      items: order.items,
      amount: order.amount,
      fulfillment: order.fulfillment,
      area: order.area,
      note: order.note,
      account: order.account,
      placedAt: order.placedAt,
    }

    const used = new Set<number>()
    const payload: Record<string, string | number> = {}
    for (const [target, value] of Object.entries(values)) {
      if (value === undefined || value === '') continue
      const wanted = FIELD_ALIASES[target] || []
      const field = fields.find((f) => !used.has(f.id) && wanted.includes(norm(f.name)))
      if (!field) continue
      used.add(field.id)
      payload[field.name] = coerce(field, value)
    }

    if (Object.keys(payload).length === 0) {
      console.warn('[Orders] no matching columns in the orders table — check column names')
      return false
    }

    const res = await fetch(`${BASEROW_API_URL}/api/database/rows/table/${ORDERS_TABLE_ID}/?user_field_names=true`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${ORDERS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`BaseRow ${res.status} creating order row`)
    console.info(`[Orders] saved ${order.orderRef}`)
    return true
  } catch (e) {
    console.warn('[Orders] could not save the order:', e)
    return false
  }
}
