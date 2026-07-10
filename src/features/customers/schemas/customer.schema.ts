import { z } from "zod";

export const customerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  company: z.string().min(2),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
