import { z } from "zod";

export const saleSchema = z.object({
  customerId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().min(1),
  total: z.number().min(0),
  date: z.string(),
});

export type SaleFormData = z.infer<typeof saleSchema>;
