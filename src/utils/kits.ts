// Single data source for the kit sections (NEW ARRIVAL, ALL-KITS, RETRO, BEST-SELLERS).
// BaseRow is the primary source; Cloudinary stays as a fallback so the site keeps
// working if BaseRow env vars are missing or the request fails.

import {
  fetchAllCloudinaryKits,
  getCachedAllCloudinaryKits,
  CLOUDINARY_CLOUD_NAME,
} from './cloudinary'
import { fetchBaserowKits, getCachedBaserowKits, BASEROW_ENABLED, type Kit } from './baserow'

export type { Kit } from './baserow'

/** Is at least one remote source configured? */
export const REMOTE_ENABLED = BASEROW_ENABLED || Boolean(CLOUDINARY_CLOUD_NAME)

function cloudinaryToKits(
  list: { id: string; name: string; image: string; price: number; inStock: boolean; retro: boolean }[],
): Kit[] {
  return list.map((k) => ({ ...k, sizes: [], gallery: [k.image], isNew: false }))
}

export function getCachedKits(): Kit[] | null {
  if (BASEROW_ENABLED) {
    const br = getCachedBaserowKits()
    if (br) return br
  }
  const cloud = getCachedAllCloudinaryKits()
  return cloud ? cloudinaryToKits(cloud) : null
}

export async function fetchKits(): Promise<Kit[]> {
  if (BASEROW_ENABLED) {
    try {
      const kits = await fetchBaserowKits()
      if (kits.length) return kits
      console.warn('[kits] BaseRow returned no rows — falling back to Cloudinary')
    } catch (e) {
      console.warn('[kits] BaseRow fetch failed — falling back to Cloudinary', e)
    }
  }
  if (CLOUDINARY_CLOUD_NAME) {
    try {
      return cloudinaryToKits(await fetchAllCloudinaryKits())
    } catch {
      return []
    }
  }
  return []
}
