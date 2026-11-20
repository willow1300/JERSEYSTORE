// Netlify function: create an IntaSend hosted checkout for one order.
//
// POST body (JSON):
//   { name, phone, items, amount, fulfillment, area, note?, account? }
//
// 1. Validates every field strictly (types, lengths, ranges) — nothing from
//    the client is trusted or echoed back.
// 2. Saves the order row to BaseRow (Order Ref / Status columns matched by
//    the same loose aliases as the client-side orders util) with status
//    PENDING.
// 3. Creates the IntaSend checkout and returns { url, orderRef }.
//
// Env (set in the Netlify dashboard):
//   INTASEND_PUBLIC_KEY      — publishable key from the IntaSend dashboard.
//                              Test (ISPubKey_test_) and live (ISPubKey_live_)
//                              keys both hit the same unified API host; the key
//                              prefix alone selects sandbox vs live.
//   BASEROW_ORDERS_TABLE_ID  — same table as VITE_ORDERS_TABLE_ID
//   BASEROW_ORDERS_TOKEN     — same token as VITE_ORDERS_TOKEN
//   SITE_URL                 — optional base for the post-payment redirect
//
// Per IntaSend's docs, hosted checkout is authenticated with the PUBLISHABLE
// key (X-IntaSend-Public-API-Key header), so the secret key is not needed here.

const INTASEND_BASE = 'https://api.intasend.com/api/v1'
const BASEROW_BASE = 'https://api.baserow.io'
const FALLBACK_EMAIL = 'orders@mjerseyss.co.ke'
const FALLBACK_SITE = 'https://mjerseyss.com'

// The post-payment redirect target is server-controlled ONLY — client request
// headers never influence it, so a forged Host/Origin header cannot turn the
// payment page into an open redirect. SITE_URL is validated to be a plain
// https URL — or plain http on localhost/127.0.0.1 so the sandbox checkout
// can redirect back to the local dev server — otherwise the fixed fallback
// is used.
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
function siteOrigin() {
  const configured = String(process.env.SITE_URL || '').trim()
  try {
    const u = new URL(configured)
    const clean = u.origin === configured.replace(/\/+$/, '')
    const httpsOk = u.protocol === 'https:' && clean
    const localOk = u.protocol === 'http:' && clean && LOCAL_HOSTS.has(u.hostname)
    if (httpsOk || localOk) return u.origin
  } catch { /* fall through */ }
  return FALLBACK_SITE
}

const clamp = (s, max) => String(s ?? '').trim().slice(0, max)

/** Validate the client payload; returns { ok, error } with safe values. */
function parseOrder(body) {
  if (!body || typeof body !== 'object') return { error: 'Invalid payload' }
  const name = clamp(body.name, 80)
  const rawPhone = clamp(body.phone, 20)
  const phone = rawPhone.replace(/[^\d]/g, '')
  const items = clamp(body.items, 1000)
  const area = clamp(body.area, 120)
  const note = clamp(body.note, 500)
  const account = clamp(body.account, 120)
  const amount = Number(body.amount)

  if (name.length < 2) return { error: 'Name is required' }
  if (phone.length < 9 || phone.length > 15) return { error: 'Phone number is invalid' }
  if (items.length < 2) return { error: 'Cart items are required' }
  if (!Number.isFinite(amount) || amount < 1 || amount > 500000) return { error: 'Amount is invalid' }

  return {
    order: {
      name,
      phone,
      items,
      amount: Math.round(amount),
      fulfillment: body.fulfillment === 'Pickup' ? 'Pickup' : 'Delivery',
      area,
      note,
      account,
    },
  }
}

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '')

const FIELD_ALIASES = {
  orderRef: ['orderref', 'ref', 'reference', 'orderid', 'orderno', 'ordernumber', 'receipt'],
  name: ['name', 'fullname', 'customername', 'buyer', 'client', 'clientname', 'contactname'],
  phone: ['phone', 'phonenumber', 'mobile', 'mpesa', 'tel', 'telephone', 'contact', 'number'],
  items: ['items', 'orderitems', 'kits', 'products', 'cart', 'itemdetails', 'details', 'order'],
  amount: ['amount', 'total', 'totalpaid', 'paid', 'price', 'cost', 'orderamount'],
  fulfillment: ['fulfillment', 'fulfilment', 'deliverymethod', 'method', 'shipping', 'deliverytype', 'type'],
  area: ['area', 'location', 'zone', 'deliveryarea', 'town', 'county', 'region', 'place'],
  note: ['note', 'notes', 'comment', 'comments', 'landmark', 'instructions', 'request'],
  status: ['status', 'paymentstatus', 'paidstatus', 'state', 'paymentstate', 'orderstatus'],
  placedAt: ['placedat', 'date', 'created', 'createdat', 'timestamp', 'orderdate', 'placedon', 'when'],
}

const makeRef = () =>
  `MJ-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`

async function saveBaserowOrder(order, orderRef) {
  const tableId = process.env.BASEROW_ORDERS_TABLE_ID
  const token = process.env.BASEROW_ORDERS_TOKEN
  if (!tableId || !token) return // no orders table configured — payment still proceeds

  const fieldsRes = await fetch(`${BASEROW_BASE}/api/database/fields/table/${tableId}/`, {
    headers: { Authorization: `Token ${token}` },
  })
  if (!fieldsRes.ok) return
  const fields = await fieldsRes.json()

  const payload = {}
  const used = new Set()
  const want = {
    orderRef,
    name: order.name,
    phone: order.phone,
    items: order.items,
    amount: order.amount,
    fulfillment: order.fulfillment,
    area: order.area,
    note: order.note,
    status: 'PENDING',
    placedAt: new Date().toISOString().slice(0, 10),
  }
  for (const [key, value] of Object.entries(want)) {
    if (value === '' || value == null) continue
    const field = fields.find((f) => !used.has(f.id) && FIELD_ALIASES[key].includes(norm(f.name)))
    if (!field) continue
    used.add(field.id)
    payload[field.name] = field.type === 'number' ? Number(String(value).replace(/[^0-9.-]/g, '')) : String(value)
  }

  await fetch(`${BASEROW_BASE}/api/database/rows/table/${tableId}/?user_field_names=true`, {
    method: 'POST',
    headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export default async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const publicKey = process.env.INTASEND_PUBLIC_KEY
  if (!publicKey) {
    return { statusCode: 503, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Payments are not configured' }) }
  }

  let parsed
  try {
    parsed = parseOrder(JSON.parse(event.body || '{}'))
  } catch {
    parsed = { error: 'Invalid JSON body' }
  }
  if (parsed.error) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: parsed.error }) }
  }

  const order = parsed.order
  const orderRef = makeRef()
  const origin = siteOrigin()

  try {
    await saveBaserowOrder(order, orderRef)

    // Kenya number → 2547XXXXXXXX, the format IntaSend's STK push expects.
    let intlPhone = order.phone
    if (intlPhone.startsWith('0')) intlPhone = `254${intlPhone.slice(1)}`
    else if (!intlPhone.startsWith('254')) intlPhone = `254${intlPhone}`

    const res = await fetch(`${INTASEND_BASE}/checkout/`, {
      method: 'POST',
      headers: {
        'X-IntaSend-Public-API-Key': publicKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currency: 'KES',
        amount: order.amount,
        email: order.account ? clamp(order.account, 120) : FALLBACK_EMAIL,
        phone_number: intlPhone,
        api_ref: orderRef,
        first_name: order.name,
        redirect_url: `${origin}/`,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.url) {
      console.error('[intasend] checkout create failed', res.status, JSON.stringify(data).slice(0, 400))
      return { statusCode: 502, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Could not start payment, try again' }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: data.url, orderRef }),
    }
  } catch (e) {
    console.error('[intasend] unexpected error', e)
    return { statusCode: 502, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Payment service error' }) }
  }
}
