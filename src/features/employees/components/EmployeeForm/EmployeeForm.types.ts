import type { EmployeeFormData } from "../../schemas";
import type { Employee } from "../../types";

export interface EmployeeFormProps {
  onSubmit: (employee: EmployeeFormData) => void;
  selectedEmployee?: Employee;
}
