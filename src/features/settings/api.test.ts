import { describe, expect, it } from "vitest";
import { percentToBps, settingsSchema } from "./api";

describe("settings contract helpers", () => {
  it("converts percent text to integer basis points without floating drift", () => { expect(percentToBps("19.00")).toBe(1900); expect(percentToBps("7")).toBe(700); expect(percentToBps("0")).toBe(0); expect(percentToBps("100")).toBe(10000); });
  it("rejects invalid or over-precise rates", () => { expect(percentToBps("19.999")).toBeNull(); expect(percentToBps("100.01")).toBeNull(); expect(percentToBps("-1")).toBeNull(); });
  it("validates a complete seven-day response", () => { const openingHours = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map((dayOfWeek, index) => ({ dayOfWeek, isOpen: index < 6, openTime: index < 6 ? "08:00" : null, closeTime: index < 6 ? "18:00" : null })); expect(settingsSchema.safeParse({ name: "AutoCare", currency: "EUR", locale: "de", timezone: "Europe/Berlin", taxRateBps: 1900, openingHours, canEdit: true }).success).toBe(true); });
});
