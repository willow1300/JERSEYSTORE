// Netlify function: IntaSend payment webhook.
//
// IntaSend POSTs the payment result here. The request is only trusted when
// its HMAC-SHA256 signature (header X-IntaSend-Signature, hex digest of the
// raw body) matches the shared secret — everything else is rejected with 401.
//
// On state COMPLETE the matching BaseRow order row (Order Ref == api_ref) is
// updated to status PAID. The handler always answers 200 on verified events
// so IntaSend does not retry; row-update failures are logged, not replayed.
//
// Env:
//   INTASEND_WEBHOOK_SECRET   — the signing secret from the IntaSend dashboard
//   BASEROW_ORDERS_TABLE_ID   — same table as VITE_ORDERS_TABLE_ID
//   BASEROW_ORDERS_TOKEN      — same token as VITE_ORDERS_TOKEN

import { createHmac, timingSafeEqual } from 'node:crypto'

const BASEROW_BASE = 'https://api.baserow.io'
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '')

const REF_KEYS = ['orderref', 'ref', 'reference', 'orderid', 'orderno', 'ordernumber', 'receipt']
const STATUS_KEYS = ['status', 'paymentstatus', 'paidstatus', 'state', 'paymentstate', 'orderstatus']

function signatureValid(rawBody, header, secret) {
  if (!secret || !header || typeof header !== 'string') return false
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest()
  const received = Buffer.from(header, 'hex')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

async function markOrderPaid(apiRef) {
  const tableId = process.env.BASEROW_ORDERS_TABLE_ID
  const token = process.env.BASEROW_ORDERS_TOKEN
  if (!tableId || !token || !apiRef) return

  const fieldsRes = await fetch(`${BASEROW_BASE}/api/database/fields/table/${tableId}/`, {
    headers: { Authorization: `Token ${token}` },
  })
  if (!fieldsRes.ok) return
  const fields = await fieldsRes.json()
  const refField = fields.find((f) => REF_KEYS.includes(norm(f.name)))
  const statusField = fields.find((f) => STATUS_KEYS.includes(norm(f.name)))
  if (!refField) return

  const rowsRes = await fetch(
    `${BASEROW_BASE}/api/database/rows/table/${tableId}/?user_field_names=true&size=100&search=${encodeURIComponent(apiRef)}`,
    { headers: { Authorization: `Token ${token}` } },
  )
  if (!rowsRes.ok) return
  const rows = await rowsRes.json()
  const row = rows.results.find((r) => String(r[refField.name] ?? '') === apiRef)
  if (!row) return

  const patch = statusField ? { [statusField.name]: 'PAID' } : {}
  await fetch(`${BASEROW_BASE}/api/database/rows/table/${tableId}/${row.id}/?user_field_names=true`, {
    method: 'PATCH',
    headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

export default async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const secret = process.env.INTASEND_WEBHOOK_SECRET
  if (!secret) {
    return { statusCode: 503, body: JSON.stringify({ error: 'Webhook secret not configured' }) }
  }

  // event.body is the raw request body; event.isBase64Encoded marks base64.
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body
  if (!signatureValid(raw, event.headers['x-intasend-signature'], secret)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature' }) }
  }

  let payload = {}
  try {
    payload = JSON.parse(raw || '{}')
  } catch {
    payload = {}
  }

  if (payload.state === 'COMPLETE') {
    try {
      await markOrderPaid(String(payload.api_ref ?? ''))
    } catch (e) {
      console.error('[intasend-webhook] could not mark order paid', e)
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}
