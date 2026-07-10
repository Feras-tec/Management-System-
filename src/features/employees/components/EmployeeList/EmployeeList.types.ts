import type { Employee } from "../../types";

export interface EmployeeListProps {
  employees: Employee[];
  onDelete: (id: string) => void;
  onEdit: (employee: Employee) => void;
}
