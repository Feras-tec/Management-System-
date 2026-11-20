import { z } from "zod";

const plainText = (minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .min(minimum)
    .max(maximum)
    .transform((value) => value.replaceAll(String.fromCharCode(0), ""));

export const contactSubmissionSchema = z.strictObject({
  name: plainText(2, 120),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((value) => value || undefined),
  subject: plainText(3, 160),
  message: plainText(10, 4000),
  website: z.string().trim().max(200).optional(),
});

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;
