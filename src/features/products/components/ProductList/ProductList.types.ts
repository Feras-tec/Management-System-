import type { Product } from "../../types";

export interface ProductListProps {
  products: Product[];
  onDelete: (id: string) => void;
  onEdit: (product: Product) => void;
}
