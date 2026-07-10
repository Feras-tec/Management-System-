import { z } from "zod";

export const employeeSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.email("Invalid email"),
  position: z.string().min(2),
  salary: z.number().min(1),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;
