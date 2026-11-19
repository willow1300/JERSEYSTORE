/* WhatsApp enquiries — set VITE_WHATSAPP_NUMBER (country code + number, no '+' or spaces) in .env.local */
export const WHATSAPP_NUMBER = (import.meta as any).env?.VITE_WHATSAPP_NUMBER || '254700000000'

/* Default WhatsApp chat texts — override in .env.local (VITE_WHATSAPP_ENQUIRY_TEXT /
   VITE_WHATSAPP_ORDER_TEXT) to change what the customer's chat opens with.
   {orderRef} in the order text is replaced with the actual order reference. */
export const WHATSAPP_ENQUIRY_TEXT = (import.meta as any).env?.VITE_WHATSAPP_ENQUIRY_TEXT || 'Hi mjerseyss! I have an enquiry about your kits.'
export const WHATSAPP_ORDER_TEXT = (import.meta as any).env?.VITE_WHATSAPP_ORDER_TEXT || 'Hi mjerseyss! I just placed order {orderRef}.'

export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_ENQUIRY_TEXT)}`

/* Footer socials / contact — set in .env.local. Empty = hidden in the footer.
   URLs are accepted with or without the https:// prefix. */
const asExternalUrl = (u: string) => (u && !/^https?:\/\//i.test(u) ? `https://${u}` : u)
export const TIKTOK_URL = asExternalUrl((import.meta as any).env?.VITE_TIKTOK_URL || '')
export const INSTAGRAM_URL = asExternalUrl((import.meta as any).env?.VITE_INSTAGRAM_URL || '')

/* localStorage cache key for the persisted cart */
export const CART_STORAGE_KEY = 'mj_cart'
export const CART_EXPIRY_HOURS = 72
