import { z } from "zod";

const text = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum).transform((value) => value.replaceAll(String.fromCharCode(0), ""));

export const createReviewSchema = z.strictObject({
  customerName: text(2, 80),
  rating: z.number().int().min(1).max(5),
  message: text(10, 2000),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional(),
  website: z.string().trim().max(200).optional(),
});

export const reviewStatusSchema = z.strictObject({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const reviewIdSchema = z.strictObject({
  reviewId: z.string().min(1).max(64),
});

export const adminReviewListSchema = z.strictObject({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
