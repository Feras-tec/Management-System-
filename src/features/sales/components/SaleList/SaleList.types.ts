import type { Sale } from "../../types";

export interface SaleListProps {
  sales: Sale[];
  onDelete: (id: string) => void;
  onEdit: (sale: Sale) => void;
}
