import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import type { ServerEnvironment } from "../src/config/env.js";
import { PrismaDataStore } from "../src/database/prisma.js";
import type { AuthProvider } from "../src/shared/auth/auth-provider.js";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("TEST_DATABASE_URL is required; reports integration tests must not be skipped.");
const store = new PrismaDataStore(url);
const suffix = Date.now().toString(36);
const clerks = { admin: `report-admin-${suffix}`, manager: `report-manager-${suffix}`, employee: `report-employee-${suffix}`, other: `report-other-${suffix}` };
let app: Awaited<ReturnType<typeof buildApp>>;
let businessId = "";
let otherBusinessId = "";
const environment: ServerEnvironment = { NODE_ENV: "test", HOST: "127.0.0.1", PORT: 3997, LOG_LEVEL: "silent", FRONTEND_ORIGIN: "http://localhost:5173", CLERK_PUBLISHABLE_KEY: "pk_test_placeholder", CLERK_SECRET_KEY: "sk_test_placeholder", DATABASE_URL: url };
const auth: AuthProvider = { getIdentity(request) { const userId = request.headers["x-test-user-id"]; return typeof userId === "string" ? { userId, sessionId: "test", organizationId: null } : null; } };
const headers = (userId = clerks.admin) => ({ "x-test-user-id": userId });
const reportUrl = "/api/v1/reports/overview?range=custom&dateFrom=2026-08-11&dateTo=2026-08-11";

beforeAll(async () => {
  const business = await store.client.business.create({ data: { name: "Report Test", slug: `report-${suffix}`, timezone: "Europe/Berlin" } });
  const other = await store.client.business.create({ data: { name: "Other Report", slug: `report-other-${suffix}`, timezone: "Europe/Berlin" } });
  businessId = business.id; otherBusinessId = other.id;
  const [admin, manager, , otherAdmin] = await Promise.all([
    store.client.user.create({ data: { businessId, clerkUserId: clerks.admin, role: "ADMIN" } }),
    store.client.user.create({ data: { businessId, clerkUserId: clerks.manager, role: "MANAGER" } }),
    store.client.user.create({ data: { businessId, clerkUserId: clerks.employee, role: "EMPLOYEE" } }),
    store.client.user.create({ data: { businessId: otherBusinessId, clerkUserId: clerks.other, role: "ADMIN" } }),
  ]);
  const service = await store.client.service.create({ data: { businessId, slug: `service-${suffix}`, nameDe: "Service DE", nameEn: "Service EN", shortDescriptionDe: "D", shortDescriptionEn: "E", descriptionDe: "D", descriptionEn: "E", priceFrom: 1000, durationMinutes: 60 } });
  await store.client.service.create({ data: { businessId: otherBusinessId, slug: `other-service-${suffix}`, nameDe: "Andere", nameEn: "Other", shortDescriptionDe: "D", shortDescriptionEn: "E", descriptionDe: "D", descriptionEn: "E", priceFrom: 999999, durationMinutes: 60 } });
  const customer = await store.client.customer.create({ data: { businessId, firstName: "Ada", lastName: "Report", email: `ada-${suffix}@example.test`, phone: suffix, createdAt: new Date("2026-08-10T22:30:00Z") } });
  const otherCustomer = await store.client.customer.create({ data: { businessId: otherBusinessId, firstName: "Other", lastName: "Customer", email: `other-${suffix}@example.test`, phone: `o-${suffix}` } });
  const vehicle = await store.client.vehicle.create({ data: { businessId, customerId: customer.id, type: "SEDAN" } });
  await store.client.booking.createMany({ data: [
    { businessId, bookingNumber: `BK-P-${suffix}`, customerId: customer.id, vehicleId: vehicle.id, serviceId: service.id, status: "PENDING", startsAt: new Date("2026-08-11T08:00:00Z"), endsAt: new Date("2026-08-11T09:00:00Z") },
    { businessId, bookingNumber: `BK-C-${suffix}`, customerId: customer.id, vehicleId: vehicle.id, serviceId: service.id, status: "COMPLETED", startsAt: new Date("2026-08-11T10:00:00Z"), endsAt: new Date("2026-08-11T11:00:00Z") },
  ] });
  const productKnown = await store.client.product.create({ data: { businessId, sku: `KNOWN-${suffix}`, name: "Known cost", salePriceMinor: 1000, costPriceMinor: 400, stockQuantity: 2, minimumStock: 2 } });
  await store.client.product.create({ data: { businessId, sku: `NULL-${suffix}`, name: "Null cost", salePriceMinor: 0, costPriceMinor: null, stockQuantity: 0, minimumStock: 0 } });
  await store.client.inventoryMovement.create({ data: { businessId, productId: productKnown.id, type: "PURCHASE", quantityDelta: 2, quantityBefore: 0, quantityAfter: 2, createdByUserId: admin.id, createdAt: new Date("2026-08-11T07:00:00Z") } });
  const completed = await store.client.sale.create({ data: { businessId, saleNumber: `SALE-C-${suffix}`, customerId: customer.id, status: "COMPLETED", currency: "EUR", subtotalMinor: 3000, discountMinor: 300, taxMinor: 513, totalMinor: 3213, createdByUserId: admin.id, soldAt: new Date("2026-08-11T12:00:00Z"), items: { create: [{ type: "PRODUCT", productId: productKnown.id, description: "Known cost", quantity: 2, unitPriceMinor: 1000, lineTotalMinor: 2000 }, { type: "SERVICE", serviceId: service.id, description: "Service", quantity: 1, unitPriceMinor: 1000, lineTotalMinor: 1000 }] } } });
  await store.client.sale.createMany({ data: [
    { businessId, saleNumber: `SALE-D-${suffix}`, status: "DRAFT", currency: "EUR", subtotalMinor: 9000, discountMinor: 0, taxMinor: 1710, totalMinor: 10710, createdByUserId: admin.id, createdAt: new Date("2026-08-11T13:00:00Z") },
    { businessId, saleNumber: `SALE-X-${suffix}`, status: "CANCELLED", currency: "EUR", subtotalMinor: 5000, discountMinor: 0, taxMinor: 950, totalMinor: 5950, createdByUserId: admin.id, createdAt: new Date("2026-08-11T14:00:00Z") },
    { businessId: otherBusinessId, saleNumber: `SALE-O-${suffix}`, customerId: otherCustomer.id, status: "COMPLETED", currency: "EUR", subtotalMinor: 999999, discountMinor: 0, taxMinor: 0, totalMinor: 999999, createdByUserId: otherAdmin.id, soldAt: new Date("2026-08-11T12:00:00Z") },
  ] });
  await store.client.payment.createMany({ data: [
    { businessId, saleId: completed.id, method: "CASH", status: "COMPLETED", amountMinor: 1000, paidAt: new Date("2026-08-11T13:00:00Z"), createdByUserId: admin.id },
    { businessId, saleId: completed.id, method: "CARD", status: "PENDING", amountMinor: 2000, createdByUserId: admin.id },
    { businessId, saleId: completed.id, method: "OTHER", status: "FAILED", amountMinor: 500, createdByUserId: admin.id },
  ] });
  await store.client.employee.createMany({ data: [
    { businessId, userId: manager.id, employeeNumber: `EMP-M-${suffix}`, firstName: "M", lastName: "Manager", position: "Manager", status: "ACTIVE" },
    { businessId, employeeNumber: `EMP-L-${suffix}`, firstName: "L", lastName: "Leave", position: "Tech", status: "ON_LEAVE" },
  ] });
  app = await buildApp({ environment, authProvider: auth, dataStore: store, logger: false });
});

afterAll(async () => {
  if (app) await app.close();
  const ids = [businessId, otherBusinessId];
  await store.client.payment.deleteMany({ where: { businessId: { in: ids } } });
  await store.client.saleItem.deleteMany({ where: { sale: { businessId: { in: ids } } } });
  await store.client.sale.deleteMany({ where: { businessId: { in: ids } } });
  await store.client.inventoryMovement.deleteMany({ where: { businessId: { in: ids } } });
  await store.client.booking.deleteMany({ where: { businessId: { in: ids } } });
  await store.client.employee.deleteMany({ where: { businessId: { in: ids } } });
  await store.client.vehicle.deleteMany({ where: { businessId: { in: ids } } });
  await store.client.product.deleteMany({ where: { businessId: { in: ids } } });
  await store.client.customer.deleteMany({ where: { businessId: { in: ids } } });
  await store.client.service.deleteMany({ where: { businessId: { in: ids } } });
  await store.client.user.deleteMany({ where: { businessId: { in: ids } } });
  await store.client.business.deleteMany({ where: { id: { in: ids } } });
  await store.disconnect();
});

describe("PostgreSQL reports analytics", () => {
  it("allows ADMIN and MANAGER but denies EMPLOYEE", async () => {
    expect((await app.inject({ method: "GET", url: reportUrl, headers: headers(clerks.admin) })).statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: reportUrl, headers: headers(clerks.manager) })).statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: reportUrl, headers: headers(clerks.employee) })).statusCode).toBe(403);
  });

  it("aggregates revenue, payments, bookings, inventory, customers, services and employees without cross-business leakage", async () => {
    const response = await app.inject({ method: "GET", url: reportUrl, headers: headers() });
    expect(response.statusCode).toBe(200);
    const body = response.json<{ payments: { byMethod: Record<string, number> }; bookings: { byStatus: Record<string, number> }; services: Array<Record<string, unknown>>; trends: Array<Record<string, unknown>>; customers: { newInRange: number } }>();
    expect(body).toMatchObject({ currency: "EUR", timezone: "Europe/Berlin", sales: { completedCount: 1, cancelledCount: 1, grossSubtotalMinor: 3000, discountsMinor: 300, taxMinor: 513, revenueMinor: 3213, paidMinor: 1000, outstandingMinor: 2213, productRevenueMinor: 2000, serviceRevenueMinor: 1000 }, payments: { collectedMinor: 1000 }, bookings: { total: 2 }, products: { active: 2, lowStock: 2, outOfStock: 1, knownCostValueMinor: 800, productsWithoutCost: 1 }, employees: { total: 2, linkedUsers: 1, unlinkedEmployees: 1, activeSystemAccess: 1 }, customers: { total: 1, newInRange: 1, withBookings: 1, withCompletedSales: 1 } });
    expect(body.payments.byMethod).toEqual({ CASH: 1000, CARD: 0, BANK_TRANSFER: 0, OTHER: 0 });
    expect(body.bookings.byStatus).toMatchObject({ PENDING: 1, COMPLETED: 1 });
    expect(body.services[0]).toMatchObject({ bookingCount: 2, completedBookingCount: 1, salesQuantity: 1, revenueMinor: 1000 });
    expect(body.trends).toEqual([{ date: "2026-08-11", revenueMinor: 3213, salesCount: 1, bookingsCount: 2 }]);
    expect(JSON.stringify(body)).not.toContain("999999");
  });

  it("uses Europe/Berlin local calendar boundaries and validates custom ranges", async () => {
    const body = (await app.inject({ method: "GET", url: reportUrl, headers: headers() })).json<{ customers: { newInRange: number } }>();
    expect(body.customers.newInRange).toBe(1);
    expect((await app.inject({ method: "GET", url: "/api/v1/reports/overview?range=custom&dateFrom=2026-08-12&dateTo=2026-08-11", headers: headers() })).statusCode).toBe(400);
  });
});
