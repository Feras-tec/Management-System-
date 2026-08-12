import { z } from "zod";

export const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const openingHour = z.object({
  dayOfWeek: z.enum(days), isOpen: z.boolean(), openTime: time.nullable(), closeTime: time.nullable(),
}).superRefine((value, context) => {
  if (value.isOpen && (!value.openTime || !value.closeTime || value.openTime >= value.closeTime)) context.addIssue({ code: "custom", message: "Invalid opening interval." });
  if (!value.isOpen && (value.openTime !== null || value.closeTime !== null)) context.addIssue({ code: "custom", message: "Closed days cannot have opening times." });
});
export const updateSettingsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  locale: z.enum(["de", "en"]),
  timezone: z.literal("Europe/Berlin"),
  taxRateBps: z.number().int().min(0).max(10000),
  openingHours: z.array(openingHour).length(7),
}).superRefine((value, context) => {
  if (new Set(value.openingHours.map((item) => item.dayOfWeek)).size !== days.length) context.addIssue({ code: "custom", message: "Every weekday must occur exactly once." });
});
export type SettingsUpdate = z.infer<typeof updateSettingsSchema>;
