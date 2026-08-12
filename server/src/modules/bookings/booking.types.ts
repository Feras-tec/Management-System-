export type VehicleType = "SEDAN" | "SUV" | "HATCHBACK" | "VAN" | "COUPE" | "WAGON" | "OTHER";
export type BookingStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export interface BookingServiceInfo { id: string; businessId: string; slug: string; nameDe: string; nameEn: string; durationMinutes: number; isActive: boolean; business: { timezone: string } }
export interface BookingSummary { id: string; bookingNumber: string; status: BookingStatus; startsAt: Date; endsAt: Date; notes: string | null; internalNotes: string | null; customer: { firstName: string; lastName: string; email: string; phone: string }; vehicle: { type: VehicleType }; service: { id: string; nameDe: string; nameEn: string } }
export interface CreateBookingRecord { businessId: string; serviceId: string; bookingNumber: string; startsAt: Date; endsAt: Date; firstName: string; lastName: string; email: string; phone: string; carType: VehicleType; notes: string | null }
export interface BookingListInput { businessId: string; page: number; limit: number; search?: string; status?: BookingStatus; serviceId?: string; dateFrom?: Date; dateTo?: Date; sort: "startsAt" | "createdAt"; order: "asc" | "desc" }
export interface CustomerListInput { businessId: string; page: number; limit: number; search?: string }
export interface BookingStore {
  findPublicService(reference: { serviceId?: string; serviceSlug?: string }): Promise<BookingServiceInfo | null>;
  findBlockingBookings(businessId: string, serviceId: string, from: Date, to: Date): Promise<Array<{ startsAt: Date; endsAt: Date }>>;
  findOpeningHour(businessId: string, weekday: number): Promise<{ isOpen: boolean; openTime: string | null; closeTime: string | null } | null>;
  createBooking(data: CreateBookingRecord): Promise<BookingSummary>;
  lookupBooking(bookingNumber: string, email: string): Promise<BookingSummary | null>;
  listBookings(input: BookingListInput): Promise<{ items: BookingSummary[]; total: number }>;
  findBooking(businessId: string, bookingId: string): Promise<BookingSummary | null>;
  updateBookingStatus(businessId: string, bookingId: string, status: BookingStatus): Promise<BookingSummary | null>;
  listCustomers(input: CustomerListInput): Promise<{ items: Array<{ id: string; firstName: string; lastName: string; email: string; phone: string; isActive: boolean; createdAt: Date }>; total: number }>;
  findCustomer(businessId: string, customerId: string): Promise<({ id: string; firstName: string; lastName: string; email: string; phone: string; notes: string | null; isActive: boolean; createdAt: Date; _count: { bookings: number } }) | null>;
  listCustomerVehicles(businessId: string, customerId: string): Promise<Array<{ id: string; type: VehicleType; brand: string | null; model: string | null; year: number | null; licensePlate: string | null; color: string | null }>>;
}
