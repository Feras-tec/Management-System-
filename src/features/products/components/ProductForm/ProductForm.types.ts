import type { ProductFormData } from "../../schemas";
import type { Product } from "../../types";

export interface ProductFormProps {
  onSubmit: (product: ProductFormData) => void;
  selectedProduct?: Product;
}
