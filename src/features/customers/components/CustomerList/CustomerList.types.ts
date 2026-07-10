import type { Customer } from "../../types";

export interface CustomerListProps {
  customers: Customer[];
  onDelete: (id: string) => void;
  onEdit: (customer: Customer) => void;
}
