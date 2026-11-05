/* Shared product types used across pages */
export interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  sizes?: string[];
  gallery?: string[];
  retro?: boolean;
  club?: string;
  /** Driven by the BaseRow stock column; undefined means "assume available". */
  inStock?: boolean;
}
