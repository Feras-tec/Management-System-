import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  category: z.string().min(2),
  price: z.number().min(0),
  stock: z.number().min(0),
});

export type ProductFormData = z.infer<typeof productSchema>;
