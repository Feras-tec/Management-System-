import { DateTime } from "luxon";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/build-app.js";
import type { ServerEnvironment } from "../src/config/env.js";
import { PrismaDataStore } from "../src/database/prisma.js";
import type { AuthProvider } from "../src/shared/auth/auth-provider.js";

const url = process.env.TEST_DATABASE_URL;
if (!url)
  throw new Error(
    "TEST_DATABASE_URL is required; booking integration tests must not be skipped.",
  );
const store = new PrismaDataStore(url);
const suffix = Date.now().toString(36);
const businessId = "booking-business-" + suffix;
const clerkUserId = "booking-user-" + suffix;
let serviceId = "";
let app: Awaited<ReturnType<typeof buildApp>>;
const environment: ServerEnvironment = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 3999,
  LOG_LEVEL: "silent",
  FRONTEND_ORIGIN: "http://localhost:5173",
  CLERK_PUBLISHABLE_KEY: "pk_test_placeholder",
  CLERK_SECRET_KEY: "sk_test_placeholder",
  DATABASE_URL: url,
};
const auth: AuthProvider = {
  getIdentity(request) {
    const userId = request.headers["x-test-user-id"];
    return typeof userId === "string"
      ? { userId, sessionId: "test", organizationId: null }
      : null;
  },
};
function futureWeekday(days = 7) {
  let value = DateTime.now()
    .setZone("Europe/Berlin")
    .plus({ days })
    .startOf("day");
  while (value.weekday > 5) value = value.plus({ days: 1 });
  return value;
}
const customer = (date: string, time: string, email: string) => ({
  serviceId,
  carType: "SEDAN",
  date,
  time,
  firstName: "Test",
  lastName: "Customer",
  email,
  phone: "+49 30 123456",
  notes: "Public note",
});
beforeAll(async () => {
  await store.client.business.create({
    data: {
      id: businessId,
      name: "Booking Test",
      slug: "booking-test-" + suffix,
    },
  });
  const user = await store.client.user.create({
    data: { businessId, clerkUserId, role: "ADMIN" },
  });
  void user;
  const service = await store.client.service.create({
    data: {
      businessId,
      slug: "booking-service",
      nameDe: "Testleistung",
      nameEn: "Test Service",
      shortDescriptionDe: "Testleistung Beschreibung",
      shortDescriptionEn: "Test service description",
      descriptionDe: "Ausführliche Testleistung",
      descriptionEn: "Detailed test service",
      priceFrom: 1000,
      durationMinutes: 60,
      sortOrder: 0,
    },
  });
  serviceId = service.id;
  app = await buildApp({
    environment,
    authProvider: auth,
    dataStore: store,
    logger: false,
  });
  it("reads a temporarily closed future weekday from database settings", async () => {
    const day = futureWeekday(35);
    const names = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ] as const;
    const dayOfWeek = names[day.weekday - 1]!;
    await store.client.businessOpeningHour.upsert({
      where: { businessId_dayOfWeek: { businessId, dayOfWeek } },
      update: { isOpen: false, openTime: null, closeTime: null },
      create: { businessId, dayOfWeek, isOpen: false },
    });
    const closed = await app.inject({
      method: "GET",
      url: `/api/v1/public/booking/availability?serviceId=${serviceId}&date=${day.toISODate()}`,
    });
    expect(closed.statusCode).toBe(200);
    expect(closed.json<{ slots: unknown[] }>().slots).toEqual([]);
    await store.client.businessOpeningHour.update({
      where: { businessId_dayOfWeek: { businessId, dayOfWeek } },
      data: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
    });
  });
});
afterAll(async () => {
  if (app) await app.close();
  await store.client.booking.deleteMany({ where: { businessId } });
  await store.client.vehicle.deleteMany({ where: { businessId } });
  await store.client.customer.deleteMany({ where: { businessId } });
  await store.client.service.deleteMany({ where: { businessId } });
  await store.client.user.deleteMany({ where: { businessId } });
  await store.client.business.deleteMany({ where: { id: businessId } });
  await store.disconnect();
});
describe("PostgreSQL booking workflow", () => {
  it("creates customer, vehicle and booking transactionally and supports lookup", async () => {
    const day = futureWeekday();
    const payload = customer(
      day.toISODate()!,
      "10:00",
      "TEST.Booking@Example.com",
    );
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/bookings",
      payload,
    });
    expect(response.statusCode).toBe(201);
    const confirmation = response.json<{ bookingNumber: string }>();
    const lookup = await app.inject({
      method: "POST",
      url: "/api/v1/public/bookings/lookup",
      payload: {
        bookingNumber: confirmation.bookingNumber,
        email: "test.booking@example.com",
      },
    });
    expect(lookup.statusCode).toBe(200);
    expect(lookup.json()).not.toHaveProperty("internalNotes");
    const wrong = await app.inject({
      method: "POST",
      url: "/api/v1/public/bookings/lookup",
      payload: {
        bookingNumber: confirmation.bookingNumber,
        email: "wrong@example.com",
      },
    });
    expect(wrong.statusCode).toBe(404);
    const customerRecord = await store.client.customer.findFirstOrThrow({
      where: { businessId, email: "test.booking@example.com" },
      include: { vehicles: true, bookings: true },
    });
    expect(customerRecord.vehicles).toHaveLength(1);
    expect(customerRecord.bookings).toHaveLength(1);
  });
  it("allows only one concurrent booking for a service slot", async () => {
    const day = futureWeekday(14).toISODate()!;
    const requests = ["one@example.com", "two@example.com"].map((email) =>
      app.inject({
        method: "POST",
        url: "/api/v1/public/bookings",
        payload: customer(day, "11:00", email),
      }),
    );
    const responses = await Promise.all(requests);
    expect(responses.map((r) => r.statusCode).sort()).toEqual([201, 409]);
  });
  it("rejects past and inactive services", async () => {
    const past = DateTime.now().minus({ days: 2 }).toISODate();
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/public/bookings",
          payload: customer(past, "10:00", "past@example.com"),
        })
      ).statusCode,
    ).toBe(400);
    await store.client.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/public/bookings",
          payload: customer(
            futureWeekday(21).toISODate()!,
            "10:00",
            "inactive@example.com",
          ),
        })
      ).statusCode,
    ).toBe(404);
    await store.client.service.update({
      where: { id: serviceId },
      data: { isActive: true },
    });
  });
  it("enforces status transitions and business-scoped admin access", async () => {
    const booking = await store.client.booking.findFirstOrThrow({
      where: { businessId },
    });
    const headers = { "x-test-user-id": clerkUserId };
    const confirmed = await app.inject({
      method: "PATCH",
      url: `/api/v1/bookings/${booking.id}/status`,
      headers,
      payload: { status: "CONFIRMED" },
    });
    expect(confirmed.statusCode).toBe(200);
    const invalid = await app.inject({
      method: "PATCH",
      url: `/api/v1/bookings/${booking.id}/status`,
      headers,
      payload: { status: "COMPLETED" },
    });
    expect(invalid.statusCode).toBe(409);
    const list = await app.inject({
      method: "GET",
      url: "/api/v1/bookings?limit=10",
      headers,
    });
    expect(list.statusCode).toBe(200);
    expect(list.json<{ total: number }>().total).toBeGreaterThan(0);
    const otherBusiness = await store.client.business.create({
      data: {
        name: "Other " + suffix,
        slug: "other-" + suffix,
        currency: "EUR",
        locale: "de",
        timezone: "Europe/Berlin",
      },
    });
    const otherUser = await store.client.user.create({
      data: {
        businessId: otherBusiness.id,
        clerkUserId: "other_" + suffix,
        role: "ADMIN",
        isActive: true,
      },
    });
    const denied = await app.inject({
      method: "GET",
      url: "/api/v1/bookings/" + booking.id,
      headers: { "x-test-user-id": otherUser.clerkUserId },
    });
    expect(denied.statusCode).toBe(404);
    await store.client.user.delete({ where: { id: otherUser.id } });
    await store.client.business.delete({ where: { id: otherBusiness.id } });
  });
  it("returns closed Sunday availability and blocks overlaps using duration", async () => {
    let sunday = futureWeekday(28);
    while (sunday.weekday !== 7) sunday = sunday.plus({ days: 1 });
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/public/booking/availability?serviceId=${serviceId}&date=${sunday.toISODate()}`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<{ slots: unknown[] }>().slots).toEqual([]);
    const existing = await store.client.booking.findFirstOrThrow({
      where: { businessId },
      orderBy: { startsAt: "asc" },
    });
    const local = DateTime.fromJSDate(existing.startsAt, {
      zone: "utc",
    }).setZone("Europe/Berlin");
    const overlap = await app.inject({
      method: "GET",
      url:
        "/api/v1/public/booking/availability?serviceId=" +
        serviceId +
        "&date=" +
        local.toISODate(),
    });
    expect(overlap.statusCode).toBe(200);
    const times = overlap
      .json<{ slots: Array<{ time: string }> }>()
      .slots.map((slot) => slot.time);
    expect(times).not.toContain(local.toFormat("HH:mm"));
  });
});
