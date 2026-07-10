import type { Sale } from "../../types";
import type { SaleFormData } from "../../schemas";

export interface SaleFormProps {
  onSubmit: (sale: SaleFormData) => void;
  selectedSale?: Sale;
}
