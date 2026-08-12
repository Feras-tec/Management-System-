import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const name = z.string().trim().min(2).max(120);
const shortDescription = z.string().trim().min(5).max(300);
const description = z.string().trim().min(5).max(4_000);

export const serviceIdParamsSchema = z.strictObject({
  serviceId: z.string().trim().min(1).max(64),
});

export const serviceSlugParamsSchema = z.strictObject({ slug });

export const createServiceSchema = z.strictObject({
  slug,
  nameDe: name,
  nameEn: name,
  shortDescriptionDe: shortDescription,
  shortDescriptionEn: shortDescription,
  descriptionDe: description,
  descriptionEn: description,
  priceFrom: z.number().int().min(0).max(100_000_000),
  durationMinutes: z.number().int().positive().max(10_080),
  imageUrl: z.url().max(2_048).nullable().optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).max(1_000_000).optional().default(0),
});

export const updateServiceSchema = z
  .strictObject({
    slug: slug.optional(),
    nameDe: name.optional(),
    nameEn: name.optional(),
    shortDescriptionDe: shortDescription.optional(),
    shortDescriptionEn: shortDescription.optional(),
    descriptionDe: description.optional(),
    descriptionEn: description.optional(),
    priceFrom: z.number().int().min(0).max(100_000_000).optional(),
    durationMinutes: z.number().int().positive().max(10_080).optional(),
    imageUrl: z.url().max(2_048).nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(1_000_000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });
