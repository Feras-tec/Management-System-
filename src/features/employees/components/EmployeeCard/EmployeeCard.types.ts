import type { Employee } from "../../types";

export interface EmployeeCardProps {
  employee: Employee;
  onDelete: (id: string) => void;
  onEdit: (employee: Employee) => void;
}
