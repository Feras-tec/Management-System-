export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  salary: number;
}

export const EmployeePosition = {
  Manager: "Manager",
  Developer: "Developer",
  Designer: "Designer",
  HR: "HR",
} as const;

export type EmployeePosition =
  (typeof EmployeePosition)[keyof typeof EmployeePosition];
