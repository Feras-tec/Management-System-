import type { BookingStatus } from "./booking.types.js";

const transitions: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};
export function canTransitionBookingStatus(from: BookingStatus, to: BookingStatus) { return transitions[from].includes(to); }
