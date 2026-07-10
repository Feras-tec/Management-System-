import type { Product } from "../../types";

export interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onEdit: (product: Product) => void;
}
