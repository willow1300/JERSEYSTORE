// IntaSend checkout — the browser hands the order to the create-checkout
// Netlify function, which validates it, saves it to BaseRow and returns the
// hosted payment URL. The site then redirects the shopper there.
//
// Turned off by default: set VITE_INTASEND_ENABLED=1 to route the checkout
// button through IntaSend (needs INTASEND_SECRET_KEY etc. on the Netlify
// side). While disabled, checkout keeps the previous flow (order saved
// locally + delivery fee agreed on WhatsApp).

const ENV = (import.meta as any).env || {}

export const INTASEND_ENABLED = String(ENV.VITE_INTASEND_ENABLED || '') === '1'

export interface PaymentOrder {
  name: string
  phone: string
  items: string
  amount: number
  fulfillment: 'Delivery' | 'Pickup'
  area: string
  note?: string
  account?: string
}

/**
 * Start the hosted checkout. Resolves with the IntaSend payment URL, throws
 * with a human-readable message when the gateway is unavailable.
 */
export async function startIntaSendCheckout(order: PaymentOrder): Promise<string> {
  const res = await fetch('/.netlify/functions/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  })
  const data = await res.json().catch(() => ({} as any))
  if (!res.ok || typeof data?.url !== 'string' || !/^https:\/\//.test(data.url)) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Payment service unavailable')
  }
  return data.url
}
