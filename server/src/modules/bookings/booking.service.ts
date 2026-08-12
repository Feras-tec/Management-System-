import { randomBytes } from "node:crypto";
import { DateTime } from "luxon";
import { AppError } from "../../shared/errors/app-error.js";
import type { BookingStatus, BookingStore, VehicleType } from "./booking.types.js";
import { canTransitionBookingStatus } from "./booking.status.js";

export function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
export function normalizePhone(value: string) { const normalized=value.trim().replace(/[^+\d]/g, "").replace(/(?!^)\+/g, ""); if(normalized.replace(/\D/g, "").length < 6) throw new AppError(400, "VALIDATION_ERROR", "The request is invalid."); return normalized; }
function bookingNumber() { return "BK-" + DateTime.utc().year + "-" + randomBytes(8).toString("base64url").slice(0, 10).toUpperCase(); }
function parseLocal(date: string, time: string, timezone: string) { const value=DateTime.fromISO(date + "T" + time, { zone: timezone }); if(!value.isValid) throw new AppError(400, "INVALID_BOOKING_TIME", "The booking time is invalid."); return value; }
function publicDto(booking: Awaited<ReturnType<BookingStore["lookupBooking"]>> & {}) { if(!booking) return null; return { bookingNumber: booking.bookingNumber, status: booking.status, service: booking.service, vehicleType: booking.vehicle.type, startsAt: booking.startsAt.toISOString(), timezone: "Europe/Berlin" }; }

export class BookingApplicationService {
  constructor(private readonly store: BookingStore) {}
  async availability(reference: { serviceId?: string; serviceSlug?: string }, date: string) {
    const service=await this.store.findPublicService(reference); if(!service) throw new AppError(404,"SERVICE_NOT_AVAILABLE","Service is not available.");
    const zone=service.business.timezone; const day=DateTime.fromISO(date,{zone}).startOf("day"); if(!day.isValid || day.endOf("day") <= DateTime.now().setZone(zone)) throw new AppError(400,"INVALID_BOOKING_DATE","Booking date must be in the future.");
    const hours=await this.store.findOpeningHour(service.businessId,day.weekday); if(!hours?.isOpen || !hours.openTime || !hours.closeTime) return { date, timezone: zone, slots: [] };
    const open=parseLocal(date,hours.openTime,zone); const close=parseLocal(date,hours.closeTime,zone); const bookings=await this.store.findBlockingBookings(service.businessId,service.id,open.toUTC().toJSDate(),close.toUTC().toJSDate());
    const slots: Array<{time:string;available:true}>=[]; for(let cursor=open; cursor.plus({minutes:service.durationMinutes})<=close; cursor=cursor.plus({minutes:30})){ const end=cursor.plus({minutes:service.durationMinutes}); const future=cursor>DateTime.now(); const overlap=bookings.some(b=>DateTime.fromJSDate(b.startsAt)<end&&DateTime.fromJSDate(b.endsAt)>cursor); if(future&&!overlap) slots.push({time:cursor.toFormat("HH:mm"),available:true}); }
    return { date, timezone: zone, slots };
  }
  async create(input: { serviceId?: string; serviceSlug?: string; carType: VehicleType; date: string; time: string; firstName: string; lastName: string; email: string; phone: string; notes?: string }) {
    const service=await this.store.findPublicService({...(input.serviceId ? {serviceId:input.serviceId} : {}),...(input.serviceSlug ? {serviceSlug:input.serviceSlug} : {})}); if(!service) throw new AppError(404,"SERVICE_NOT_AVAILABLE","Service is not available.");
    const available=await this.availability({serviceId:service.id},input.date); if(!available.slots.some(slot=>slot.time===input.time)) throw new AppError(409,"BOOKING_SLOT_UNAVAILABLE","The selected booking slot is unavailable.");
    const start=parseLocal(input.date,input.time,service.business.timezone); const end=start.plus({minutes:service.durationMinutes});
    try { const booking=await this.store.createBooking({ businessId:service.businessId,serviceId:service.id,bookingNumber:bookingNumber(),startsAt:start.toUTC().toJSDate(),endsAt:end.toUTC().toJSDate(),firstName:input.firstName,lastName:input.lastName,email:normalizeEmail(input.email),phone:normalizePhone(input.phone),carType:input.carType,notes:input.notes?.trim()||null }); return { bookingNumber:booking.bookingNumber,status:booking.status,service:booking.service,startsAt:booking.startsAt.toISOString(),timezone:service.business.timezone }; } catch(error) { const code=typeof error==="object"&&error&&"code" in error?String(error.code):""; if(code==="BOOKING_SLOT_UNAVAILABLE"||code==="P2004"||code==="P2034") throw new AppError(409,"BOOKING_SLOT_UNAVAILABLE","The selected booking slot is unavailable."); throw error; }
  }
  async lookup(bookingNumberValue:string,email:string){ const booking=await this.store.lookupBooking(bookingNumberValue,normalizeEmail(email)); if(!booking) throw new AppError(404,"BOOKING_NOT_FOUND","Booking could not be found."); return publicDto(booking); }
  async updateStatus(businessId:string,bookingId:string,status:BookingStatus){ const current=await this.store.findBooking(businessId,bookingId); if(!current) throw new AppError(404,"BOOKING_NOT_FOUND","Booking not found."); if(!canTransitionBookingStatus(current.status,status)) throw new AppError(409,"INVALID_STATUS_TRANSITION","The booking status transition is not allowed."); const updated=await this.store.updateBookingStatus(businessId,bookingId,status); if(!updated) throw new AppError(404,"BOOKING_NOT_FOUND","Booking not found."); return updated; }
}
