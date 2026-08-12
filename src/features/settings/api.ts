import { z } from "zod";
import type { AccessTokenProvider } from "../../auth/auth";

export const weekdays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
const hour = z.object({
  dayOfWeek: z.enum(weekdays),
  isOpen: z.boolean(),
  openTime: z.string().nullable(),
  closeTime: z.string().nullable(),
});
export const settingsSchema = z.object({
  name: z.string(),
  currency: z.literal("EUR"),
  locale: z.enum(["de", "en"]),
  timezone: z.literal("Europe/Berlin"),
  taxRateBps: z.number().int(),
  openingHours: z.array(hour),
  canEdit: z.boolean(),
});
export type BusinessSettings = z.infer<typeof settingsSchema>;
export type SettingsInput = Omit<BusinessSettings, "currency" | "canEdit">;
const base = import.meta.env.VITE_API_BASE_URL;
async function request(
  token: AccessTokenProvider,
  method: "GET" | "PATCH",
  body?: SettingsInput,
) {
  const accessToken = await token();
  if (!accessToken) throw new Error("AUTH_REQUIRED");
  const response = await fetch(new URL("/api/v1/settings", base), {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok)
    throw new Error(
      response.status === 403
        ? "SETTINGS_FORBIDDEN"
        : `SETTINGS_${response.status}`,
    );
  return settingsSchema.parse(await response.json());
}
export const settingsApi = {
  get: (token: AccessTokenProvider) => request(token, "GET"),
  update: (token: AccessTokenProvider, body: SettingsInput) =>
    request(token, "PATCH", body),
};
export function percentToBps(value: string) {
  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(value)) return null;
  const bps = Math.round(Number(value) * 100);
  return bps <= 10000 ? bps : null;
}
