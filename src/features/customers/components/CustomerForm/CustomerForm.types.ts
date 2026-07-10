import type { CustomerFormData } from "../../schemas";
import type { Customer } from "../../types";

export interface CustomerFormProps {
  onSubmit: (customer: CustomerFormData) => void;
  selectedCustomer?: Customer;
}
