import type { DayOfWeek, PrismaClient } from "../../generated/prisma/client.js";
import { days, type SettingsUpdate } from "./settings.schema.js";

const defaults = new Map<DayOfWeek, { isOpen: boolean; openTime: string | null; closeTime: string | null }>([
  ["MONDAY", { isOpen: true, openTime: "08:00", closeTime: "18:00" }], ["TUESDAY", { isOpen: true, openTime: "08:00", closeTime: "18:00" }],
  ["WEDNESDAY", { isOpen: true, openTime: "08:00", closeTime: "18:00" }], ["THURSDAY", { isOpen: true, openTime: "08:00", closeTime: "18:00" }],
  ["FRIDAY", { isOpen: true, openTime: "08:00", closeTime: "18:00" }], ["SATURDAY", { isOpen: true, openTime: "09:00", closeTime: "14:00" }],
  ["SUNDAY", { isOpen: false, openTime: null, closeTime: null }],
]);
export class PrismaSettingsStore {
  constructor(private readonly prisma: PrismaClient) {}
  private async ensureHours(businessId: string) {
    await this.prisma.businessOpeningHour.createMany({ data: days.map((dayOfWeek) => ({ businessId, dayOfWeek, ...defaults.get(dayOfWeek)! })), skipDuplicates: true });
  }
  async get(businessId: string) {
    await this.ensureHours(businessId);
    return this.prisma.business.findUniqueOrThrow({ where: { id: businessId }, select: { name: true, currency: true, locale: true, timezone: true, taxRateBps: true, openingHours: { select: { dayOfWeek: true, isOpen: true, openTime: true, closeTime: true }, orderBy: { dayOfWeek: "asc" } } } });
  }
  async update(businessId: string, input: SettingsUpdate) {
    await this.prisma.$transaction(async (tx) => {
      await tx.business.update({ where: { id: businessId }, data: { name: input.name, locale: input.locale, timezone: input.timezone, taxRateBps: input.taxRateBps } });
      for (const hour of input.openingHours) await tx.businessOpeningHour.upsert({ where: { businessId_dayOfWeek: { businessId, dayOfWeek: hour.dayOfWeek } }, update: { isOpen: hour.isOpen, openTime: hour.openTime, closeTime: hour.closeTime }, create: { businessId, ...hour } });
    });
    return this.get(businessId);
  }
}
