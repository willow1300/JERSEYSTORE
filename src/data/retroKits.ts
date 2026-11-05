// Retro kit catalog.
// To add a new retro kit: drop the image into public/images/retro/
// and append an entry below. The Retro page renders them dynamically.
export interface RetroKit {
  id: string;
  name: string;
  image: string; // path under public/, e.g. "/images/retro/arsenal.jpg"
  price: number;
  inStock: boolean;
}

export const retroKits: RetroKit[] = [
  // Add retro kits here, e.g.:
  // { id: "retro-arsenal", name: "Arsenal 98 Retro", image: "/images/retro/arsenal.jpg", price: 12, inStock: true },
];