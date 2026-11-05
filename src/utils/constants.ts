/* WhatsApp enquiries — set VITE_WHATSAPP_NUMBER (country code + number, no '+' or spaces) in .env.local */
export const WHATSAPP_NUMBER = (import.meta as any).env?.VITE_WHATSAPP_NUMBER || '254700000000'
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi MJ Erseys! I have an enquiry about your kits.')}`

/* localStorage cache key for the persisted cart */
export const CART_STORAGE_KEY = 'mj_cart'
export const CART_EXPIRY_HOURS = 72
