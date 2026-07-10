import type { Customer } from "../../types";

export interface CustomerCardProps {
  customer: Customer;
  onDelete: (id: string) => void;
  onEdit: (customer: Customer) => void;
}
