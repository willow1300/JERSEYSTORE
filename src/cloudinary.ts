// Cloudinary dynamic kit loader.
// Set VITE_CLOUDINARY_CLOUD_NAME in .env (or .env.local) to enable.
// Images are fetched from: https://res.cloudinary.com/<cloud>/image/list/<tag>.json
// Tag them in Cloudinary (e.g. "retro") and optionally set context metadata:
//   name, price, inStock  (e.g. name=Arsenal 98 Retro|price=12|inStock=true)

export interface CloudinaryResource {
  public_id: string;
  version: number;
  format: string;
  width?: number;
  height?: number;
  context?: { custom?: Record<string, string> };
}

export interface CloudinaryListResponse {
  resources: CloudinaryResource[];
}

export const CLOUDINARY_CLOUD_NAME =
  (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_TAG =
  (import.meta as any).env?.VITE_CLOUDINARY_TAG || "retro";

// In-memory caches so repeated navigations don't re-fetch / flicker.
const kitCache = new Map<string, { id: string; name: string; image: string; price: number; inStock: boolean; retro: boolean }[]>();
const kitPromiseCache = new Map<string, Promise<{ id: string; name: string; image: string; price: number; inStock: boolean; retro: boolean }[]>>();

export function cloudinaryImageUrl(r: CloudinaryResource): string {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/v${r.version}/${r.public_id}`;
}

export function getCustom(r: CloudinaryResource, key: string): string | undefined {
  const custom = r.context?.custom || {};
  const k = Object.keys(custom).find((kk) => kk.toLowerCase() === key.toLowerCase());
  return k ? custom[k] : undefined;
}

export function deriveName(r: CloudinaryResource): string {
  const ctxName = getCustom(r, "name");
  if (ctxName) return ctxName;
  return r.public_id
    .split("/")
    .pop()!
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isRetro(r: CloudinaryResource): boolean {
  const custom = r.context?.custom || {};
  // Cloudinary metadata keys are case-sensitive; users may use "Retro" or "retro".
  const key = Object.keys(custom).find((k) => k.toLowerCase() === "retro");
  const v = key ? custom[key] : undefined;
  if (v === undefined) return false;
  return String(v).toLowerCase() === "true";
}

export async function fetchCloudinaryKits(tag?: string): Promise<
  { id: string; name: string; image: string; price: number; inStock: boolean; retro: boolean }[]
> {
  if (!CLOUDINARY_CLOUD_NAME) return [];
  const useTag = tag || CLOUDINARY_TAG;
  if (kitCache.has(useTag)) return kitCache.get(useTag)!;
  if (kitPromiseCache.has(useTag)) return kitPromiseCache.get(useTag)!;
  const p = (async () => {
    const url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/list/${useTag}.json?context=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Cloudinary list failed: ${res.status}`);
    const data: CloudinaryListResponse = await res.json();
    const mapped = (data.resources || []).map((r) => ({
      id: r.public_id,
      name: deriveName(r),
      image: cloudinaryImageUrl(r),
      price: parseFloat(getCustom(r, "price") || "12") || 12,
      inStock: (getCustom(r, "inStock") || "true").toLowerCase() !== "false",
      retro: isRetro(r),
    }));
    kitCache.set(useTag, mapped);
    return mapped;
  })();
  kitPromiseCache.set(useTag, p);
  p.catch(() => kitPromiseCache.delete(useTag));
  return p;
}

// Fetch from multiple tags and de-duplicate by public_id.
export function getCachedAllCloudinaryKits(tags?: string[]): { id: string; name: string; image: string; price: number; inStock: boolean; retro: boolean }[] | null {
  const base = CLOUDINARY_TAG.includes(",")
    ? CLOUDINARY_TAG.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [CLOUDINARY_TAG];
  const list = tags && tags.length
    ? tags
    : Array.from(new Set([...base, "NewSeason2627", "retro"]));
  const key = Array.from(new Set(list)).sort().join("|");
  return kitCache.get("__ALL__" + key) ?? null;
}

export async function fetchAllCloudinaryKits(tags?: string[]): Promise<
  { id: string; name: string; image: string; price: number; inStock: boolean; retro: boolean }[]
> {
  if (!CLOUDINARY_CLOUD_NAME) return [];
  const base = CLOUDINARY_TAG.includes(",")
    ? CLOUDINARY_TAG.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [CLOUDINARY_TAG];
  const list = tags && tags.length
    ? tags
    : Array.from(new Set([...base, "NewSeason2627", "retro"]));
  const key = Array.from(new Set(list)).sort().join("|");
  if (kitCache.has("__ALL__" + key)) return kitCache.get("__ALL__" + key)!;
  // promise-level cache
  // We'll store combined result under a special key in kitCache after fetch.
  const uniq = Array.from(new Set(list));
  const results = await Promise.allSettled(uniq.map((t) => fetchCloudinaryKits(t)));
  const byId = new Map<string, { id: string; name: string; image: string; price: number; inStock: boolean; retro: boolean }>();
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const k of r.value) {
      if (!byId.has(k.id)) byId.set(k.id, k);
    }
  }
  const combined = Array.from(byId.values());
  kitCache.set("__ALL__" + key, combined);
  return combined;
}