import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizePhone } from "../src/modules/bookings/booking.service.js";
import { canTransitionBookingStatus } from "../src/modules/bookings/booking.status.js";
describe("booking domain rules",()=>{it("normalizes customer identity fields",()=>{expect(normalizeEmail(" Test@Example.COM ")).toBe("test@example.com");expect(normalizePhone("+49 (157) 000-000")).toBe("+49157000000")});it("allows only declared status transitions",()=>{expect(canTransitionBookingStatus("PENDING","CONFIRMED")).toBe(true);expect(canTransitionBookingStatus("CONFIRMED","IN_PROGRESS")).toBe(true);expect(canTransitionBookingStatus("COMPLETED","PENDING")).toBe(false);expect(canTransitionBookingStatus("CANCELLED","CONFIRMED")).toBe(false)})});
