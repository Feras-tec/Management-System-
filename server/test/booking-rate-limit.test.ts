import Fastify from "fastify";
import { afterEach, expect, it, vi } from "vitest";
import { registerPublicBookingRoutes } from "../src/modules/bookings/booking.route.js";
import type { BookingStore } from "../src/modules/bookings/booking.types.js";
import { registerErrorHandling } from "../src/plugins/error-handler.plugin.js";

const app = Fastify({ trustProxy: false });
afterEach(() => app.close());

it("limits create and lookup separately before store work, ignoring forwarded IPs", async () => {
  let now = 10_000;
  const findPublicService = vi.fn().mockResolvedValue(null);
  const lookupBooking = vi.fn().mockResolvedValue(null);
  const store: BookingStore = {
    findPublicService, lookupBooking,
    findOpeningHour: () => Promise.resolve(null),
    findBlockingBookings: () => Promise.resolve([]),
    createBooking: () => Promise.reject(new Error("Should not create")),
    listBookings: () => Promise.resolve({ items: [], total: 0 }),
    findBooking: () => Promise.resolve(null),
    updateBookingStatus: () => Promise.resolve(null),
    listCustomers: () => Promise.resolve({ items: [], total: 0 }),
    findCustomer: () => Promise.resolve(null),
    listCustomerVehicles: () => Promise.resolve([]),
  };
  registerErrorHandling(app);
  registerPublicBookingRoutes(app, store, () => now);
  const post = (lookup: boolean, forwarded = "192.0.2.1", ip = "198.51.100.1") => app.inject({
    method: "POST",
    url: "/api/v1/public/bookings" + (lookup ? "/lookup" : ""),
    remoteAddress: ip,
    headers: { "x-forwarded-for": forwarded },
    payload: lookup ? { bookingNumber: "BK-SYNTHETIC", email: "qa@example.test" } : {
      serviceSlug: "car-detailing", date: "2099-01-03", time: "09:00", carType: "SEDAN",
      firstName: "Test", lastName: "Customer", email: "qa@example.test", phone: "5550101234",
    },
  });
  for (let n = 0; n < 12; n++) expect((await post(false)).statusCode).toBe(404);
  const blockedCreate = await post(false, "192.0.2.2");
  expect(blockedCreate.statusCode).toBe(429);
  expect(blockedCreate.headers["retry-after"]).toBe("900");
  expect(blockedCreate.json<{ error: { code: string } }>().error.code).toBe("RATE_LIMITED");
  expect(findPublicService).toHaveBeenCalledTimes(12);
  expect((await post(false, undefined, "198.51.100.2")).statusCode).toBe(404);

  for (let n = 0; n < 30; n++) expect((await post(true)).statusCode).toBe(404);
  const blockedLookup = await post(true, "192.0.2.3");
  expect(blockedLookup.statusCode).toBe(429);
  expect(blockedLookup.headers["retry-after"]).toBe("300");
  expect(lookupBooking).toHaveBeenCalledTimes(30);

  now += 5 * 60_000 - 1;
  expect((await post(true)).statusCode).toBe(429);
  now++;
  expect((await post(true)).statusCode).toBe(404);
  expect((await post(false)).statusCode).toBe(429);
  now += 10 * 60_000;
  expect((await post(false)).statusCode).toBe(404);
});
