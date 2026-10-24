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
  const url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/list/${useTag}.json?context=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Cloudinary list failed: ${res.status}`);
  const data: CloudinaryListResponse = await res.json();
  return (data.resources || []).map((r) => ({
    id: r.public_id,
    name: deriveName(r),
    image: cloudinaryImageUrl(r),
    price: parseFloat(getCustom(r, "price") || "12") || 12,
    inStock: (getCustom(r, "inStock") || "true").toLowerCase() !== "false",
    retro: isRetro(r),
  }));
}

// Fetch from multiple tags and de-duplicate by public_id, so the Jerseys page
// can show everything uploaded to Cloudinary across all tags.
export async function fetchAllCloudinaryKits(tags?: string[]): Promise<
  { id: string; name: string; image: string; price: number; inStock: boolean; retro: boolean }[]
> {
  if (!CLOUDINARY_CLOUD_NAME) return [];
  const list = tags && tags.length
    ? tags
    : [CLOUDINARY_TAG, "NewSeason2627", "retro"];
  const uniq = Array.from(new Set(list));
  const results = await Promise.allSettled(uniq.map((t) => fetchCloudinaryKits(t)));
  const byId = new Map<string, { id: string; name: string; image: string; price: number; inStock: boolean; retro: boolean }>();
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const k of r.value) {
      if (!byId.has(k.id)) byId.set(k.id, k);
    }
  }
  return Array.from(byId.values());
}