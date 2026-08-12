import type { PrismaClient } from "../../generated/prisma/client.js";
import type { BookingListInput, BookingServiceInfo, BookingStore, CreateBookingRecord, CustomerListInput } from "./booking.types.js";

const bookingInclude = { customer: { select: { firstName: true, lastName: true, email: true, phone: true } }, vehicle: { select: { type: true } }, service: { select: { id: true, nameDe: true, nameEn: true } } } as const;
const blockingStatuses = ["PENDING", "CONFIRMED", "IN_PROGRESS"] as const;
const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

export class PrismaBookingStore implements BookingStore {
  constructor(private readonly prisma: PrismaClient) {}

  async findPublicService(reference: { serviceId?: string; serviceSlug?: string }): Promise<BookingServiceInfo | null> {
    const selector = reference.serviceId ? { id: reference.serviceId } : { slug: reference.serviceSlug! };
    return this.prisma.service.findFirst({ where: { isActive: true, ...selector }, orderBy: { business: { createdAt: "asc" } }, select: { id: true, businessId: true, slug: true, nameDe: true, nameEn: true, durationMinutes: true, isActive: true, business: { select: { timezone: true } } } });
  }

  findBlockingBookings(businessId: string, serviceId: string, from: Date, to: Date) {
    return this.prisma.booking.findMany({ where: { businessId, serviceId, status: { in: [...blockingStatuses] }, startsAt: { lt: to }, endsAt: { gt: from } }, select: { startsAt: true, endsAt: true } });
  }

  async findOpeningHour(businessId: string, weekday: number) {
    const dayOfWeek = weekdays[weekday - 1]!;
    const saturday = dayOfWeek === "SATURDAY";
    const sunday = dayOfWeek === "SUNDAY";
    return this.prisma.businessOpeningHour.upsert({ where: { businessId_dayOfWeek: { businessId, dayOfWeek } }, update: {}, create: { businessId, dayOfWeek, isOpen: !sunday, openTime: sunday ? null : saturday ? "09:00" : "08:00", closeTime: sunday ? null : saturday ? "14:00" : "18:00" }, select: { isOpen: true, openTime: true, closeTime: true } });
  }

  async createBooking(data: CreateBookingRecord) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", data.businessId + ":" + data.serviceId);
      const overlap = await tx.booking.findFirst({ where: { businessId: data.businessId, serviceId: data.serviceId, status: { in: [...blockingStatuses] }, startsAt: { lt: data.endsAt }, endsAt: { gt: data.startsAt } }, select: { id: true } });
      if (overlap) throw Object.assign(new Error("Booking slot unavailable"), { code: "BOOKING_SLOT_UNAVAILABLE" });
      const customer = await tx.customer.upsert({
        where: { businessId_email_phone: { businessId: data.businessId, email: data.email, phone: data.phone } },
        update: { firstName: data.firstName, lastName: data.lastName, isActive: true },
        create: { businessId: data.businessId, firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone },
      });
      const vehicle = await tx.vehicle.create({ data: { businessId: data.businessId, customerId: customer.id, type: data.carType } });
      return tx.booking.create({ data: { businessId: data.businessId, serviceId: data.serviceId, customerId: customer.id, vehicleId: vehicle.id, bookingNumber: data.bookingNumber, startsAt: data.startsAt, endsAt: data.endsAt, notes: data.notes }, include: bookingInclude });
    }, { isolationLevel: "Serializable" });
  }

  lookupBooking(bookingNumber: string, email: string) { return this.prisma.booking.findFirst({ where: { bookingNumber, customer: { email } }, include: bookingInclude }); }

  async listBookings(input: BookingListInput) {
    const where = { businessId: input.businessId, ...(input.status ? { status: input.status } : {}), ...(input.serviceId ? { serviceId: input.serviceId } : {}), ...(input.dateFrom || input.dateTo ? { startsAt: { ...(input.dateFrom ? { gte: input.dateFrom } : {}), ...(input.dateTo ? { lt: input.dateTo } : {}) } } : {}), ...(input.search ? { OR: [{ bookingNumber: { contains: input.search, mode: "insensitive" as const } }, { customer: { firstName: { contains: input.search, mode: "insensitive" as const } } }, { customer: { lastName: { contains: input.search, mode: "insensitive" as const } } }, { customer: { email: { contains: input.search, mode: "insensitive" as const } } }] } : {}) };
    const [items, total] = await Promise.all([this.prisma.booking.findMany({ where, include: bookingInclude, orderBy: { [input.sort]: input.order }, skip: (input.page - 1) * input.limit, take: input.limit }), this.prisma.booking.count({ where })]);
    return { items, total };
  }
  findBooking(businessId: string, bookingId: string) { return this.prisma.booking.findFirst({ where: { id: bookingId, businessId }, include: bookingInclude }); }
  async updateBookingStatus(businessId: string, bookingId: string, status: Parameters<BookingStore["updateBookingStatus"]>[2]) { const result = await this.prisma.booking.updateMany({ where: { id: bookingId, businessId }, data: { status } }); return result.count ? this.findBooking(businessId, bookingId) : null; }

  async listCustomers(input: CustomerListInput) {
    const where = { businessId: input.businessId, ...(input.search ? { OR: [{ firstName: { contains: input.search, mode: "insensitive" as const } }, { lastName: { contains: input.search, mode: "insensitive" as const } }, { email: { contains: input.search, mode: "insensitive" as const } }, { phone: { contains: input.search } }] } : {}) };
    const [items, total] = await Promise.all([this.prisma.customer.findMany({ where, select: { id: true, firstName: true, lastName: true, email: true, phone: true, isActive: true, createdAt: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }], skip: (input.page - 1) * input.limit, take: input.limit }), this.prisma.customer.count({ where })]);
    return { items, total };
  }
  findCustomer(businessId: string, customerId: string) { return this.prisma.customer.findFirst({ where: { id: customerId, businessId }, select: { id: true, firstName: true, lastName: true, email: true, phone: true, notes: true, isActive: true, createdAt: true, _count: { select: { bookings: true } } } }); }
  listCustomerVehicles(businessId: string, customerId: string) { return this.prisma.vehicle.findMany({ where: { businessId, customerId }, select: { id: true, type: true, brand: true, model: true, year: true, licensePlate: true, color: true }, orderBy: { createdAt: "desc" } }); }
}
