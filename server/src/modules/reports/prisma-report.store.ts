import { DateTime } from "luxon";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import { resolveReportRange } from "./report.range.js";
import type { ReportRangePreset, ReportStore } from "./report.types.js";

/**
 * Metric definitions: revenue is completed Sale.totalMinor in the selected
 * business-local range; collected is COMPLETED Payment.amountMinor; outstanding
 * is completed sale total minus its completed payments (never below zero).
 * Low stock is active stockQuantity <= minimumStock; out of stock is active
 * stockQuantity === 0. Null product cost is unknown and never treated as zero.
 */

const paymentMethods = ["CASH", "CARD", "BANK_TRANSFER", "OTHER"] as const;
const bookingStatuses = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
const employeeStatuses = ["ACTIVE", "INACTIVE", "ON_LEAVE"] as const;
const movementTypes = ["INITIAL", "PURCHASE", "SALE", "ADJUSTMENT", "RETURN", "DAMAGE", "CANCELLATION"] as const;

export class PrismaReportStore implements ReportStore {
  constructor(private readonly prisma: PrismaClient) {}

  async overview(businessId: string, input: { range: ReportRangePreset; dateFrom?: string | undefined; dateTo?: string | undefined }) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { currency: true, timezone: true },
    });
    if (!business) throw new AppError(404, "BUSINESS_NOT_FOUND", "Business not found.");
    const range = resolveReportRange(input.range, business.timezone, input.dateFrom, input.dateTo);
    const inRange = { gte: range.start, lt: range.endExclusive };
    const saleRange = { OR: [{ soldAt: inRange }, { soldAt: null, createdAt: inRange }] };

    const [sales, collectedPayments, bookings, upcomingBookings, products, movements, customerTotal, newCustomers, customerBookingGroups, topCustomerGroups, employees, services] = await Promise.all([
      this.prisma.sale.findMany({ where: { businessId, ...saleRange }, include: { items: true, payments: { where: { status: "COMPLETED" }, select: { amountMinor: true } } } }),
      this.prisma.payment.findMany({ where: { businessId, status: "COMPLETED", OR: [{ paidAt: inRange }, { paidAt: null, createdAt: inRange }] }, select: { method: true, amountMinor: true } }),
      this.prisma.booking.findMany({ where: { businessId, startsAt: inRange }, select: { status: true, startsAt: true, serviceId: true } }),
      this.prisma.booking.count({ where: { businessId, startsAt: { gte: new Date() }, status: { in: ["PENDING", "CONFIRMED"] } } }),
      this.prisma.product.findMany({ where: { businessId }, select: { isActive: true, stockQuantity: true, minimumStock: true, costPriceMinor: true } }),
      this.prisma.inventoryMovement.findMany({ where: { businessId, createdAt: inRange }, select: { type: true, quantityDelta: true } }),
      this.prisma.customer.count({ where: { businessId } }),
      this.prisma.customer.count({ where: { businessId, createdAt: inRange } }),
      this.prisma.booking.groupBy({ by: ["customerId"], where: { businessId }, _count: { _all: true } }),
      this.prisma.sale.groupBy({ by: ["customerId"], where: { businessId, status: "COMPLETED", customerId: { not: null }, ...saleRange }, _sum: { totalMinor: true }, orderBy: { _sum: { totalMinor: "desc" } }, take: 5 }),
      this.prisma.employee.findMany({ where: { businessId }, select: { status: true, userId: true, user: { select: { isActive: true } } } }),
      this.prisma.service.findMany({ where: { businessId }, select: { id: true, nameDe: true, nameEn: true } }),
    ]);

    const completed = sales.filter((sale) => sale.status === "COMPLETED");
    const cancelledCount = sales.filter((sale) => sale.status === "CANCELLED").length;
    const sum = (field: "subtotalMinor" | "discountMinor" | "taxMinor" | "totalMinor") => completed.reduce((total, sale) => total + sale[field], 0);
    const revenueMinor = sum("totalMinor");
    const paidAgainstSalesMinor = completed.reduce((total, sale) => total + sale.payments.reduce((paid, payment) => paid + payment.amountMinor, 0), 0);
    const productRevenueMinor = completed.flatMap((sale) => sale.items).filter((item) => item.type === "PRODUCT").reduce((total, item) => total + item.lineTotalMinor, 0);
    const serviceRevenueMinor = completed.flatMap((sale) => sale.items).filter((item) => item.type === "SERVICE").reduce((total, item) => total + item.lineTotalMinor, 0);

    const paymentByMethod = Object.fromEntries(paymentMethods.map((method) => [method, collectedPayments.filter((payment) => payment.method === method).reduce((total, payment) => total + payment.amountMinor, 0)]));
    const bookingByStatus = Object.fromEntries(bookingStatuses.map((status) => [status, bookings.filter((booking) => booking.status === status).length]));
    const employeeByStatus = Object.fromEntries(employeeStatuses.map((status) => [status, employees.filter((employee) => employee.status === status).length]));
    const movementSummary = Object.fromEntries(movementTypes.map((type) => [type, movements.filter((movement) => movement.type === type).reduce((total, movement) => total + movement.quantityDelta, 0)]));
    const customerIds = topCustomerGroups.flatMap((group) => group.customerId ? [group.customerId] : []);
    const customerNames = await this.prisma.customer.findMany({ where: { businessId, id: { in: customerIds } }, select: { id: true, firstName: true, lastName: true } });
    const customerNameMap = new Map(customerNames.map((customer) => [customer.id, `${customer.firstName} ${customer.lastName}`]));
    const customersWithSales = await this.prisma.sale.groupBy({ by: ["customerId"], where: { businessId, status: "COMPLETED", customerId: { not: null } }, _count: { _all: true } });

    const serviceRows = services.map((service) => {
      const serviceBookings = bookings.filter((booking) => booking.serviceId === service.id);
      const serviceItems = completed.flatMap((sale) => sale.items).filter((item) => item.serviceId === service.id);
      return { id: service.id, nameDe: service.nameDe, nameEn: service.nameEn, bookingCount: serviceBookings.length, completedBookingCount: serviceBookings.filter((booking) => booking.status === "COMPLETED").length, salesQuantity: serviceItems.reduce((total, item) => total + item.quantity, 0), revenueMinor: serviceItems.reduce((total, item) => total + item.lineTotalMinor, 0) };
    });

    const dayMap = new Map<string, { revenueMinor: number; salesCount: number; bookingsCount: number }>();
    for (let cursor = DateTime.fromISO(range.dateFrom, { zone: range.timezone }); cursor <= DateTime.fromISO(range.dateTo, { zone: range.timezone }); cursor = cursor.plus({ days: 1 })) dayMap.set(cursor.toISODate()!, { revenueMinor: 0, salesCount: 0, bookingsCount: 0 });
    for (const sale of completed) { const key = DateTime.fromJSDate(sale.soldAt ?? sale.createdAt).setZone(range.timezone).toISODate()!; const day = dayMap.get(key); if (day) { day.revenueMinor += sale.totalMinor; day.salesCount += 1; } }
    for (const booking of bookings) { const key = DateTime.fromJSDate(booking.startsAt).setZone(range.timezone).toISODate()!; const day = dayMap.get(key); if (day) day.bookingsCount += 1; }

    const activeProducts = products.filter((product) => product.isActive);
    const knownCostProducts = products.filter((product) => product.costPriceMinor !== null);
    const terminalBookings = Number(bookingByStatus.COMPLETED) + Number(bookingByStatus.CANCELLED) + Number(bookingByStatus.NO_SHOW);
    return {
      range: { preset: range.preset, dateFrom: range.dateFrom, dateTo: range.dateTo }, timezone: range.timezone, currency: business.currency,
      sales: { completedCount: completed.length, cancelledCount, grossSubtotalMinor: sum("subtotalMinor"), discountsMinor: sum("discountMinor"), taxMinor: sum("taxMinor"), revenueMinor, paidMinor: paidAgainstSalesMinor, outstandingMinor: Math.max(0, revenueMinor - paidAgainstSalesMinor), averageSaleMinor: completed.length ? Math.round(revenueMinor / completed.length) : 0, productRevenueMinor, serviceRevenueMinor },
      payments: { collectedMinor: collectedPayments.reduce((total, payment) => total + payment.amountMinor, 0), byMethod: paymentByMethod },
      bookings: { total: bookings.length, byStatus: bookingByStatus, upcoming: upcomingBookings, completionRatePercent: terminalBookings ? Math.round((Number(bookingByStatus.COMPLETED) / terminalBookings) * 1000) / 10 : null },
      customers: { total: customerTotal, newInRange: newCustomers, withBookings: customerBookingGroups.length, withCompletedSales: customersWithSales.length, top: topCustomerGroups.flatMap((group) => group.customerId ? [{ id: group.customerId, displayName: customerNameMap.get(group.customerId) ?? "Customer", totalSpentMinor: group._sum.totalMinor ?? 0 }] : []) },
      products: { active: activeProducts.length, inactive: products.length - activeProducts.length, lowStock: activeProducts.filter((product) => product.stockQuantity <= product.minimumStock).length, outOfStock: activeProducts.filter((product) => product.stockQuantity === 0).length, totalUnitsInStock: activeProducts.reduce((total, product) => total + product.stockQuantity, 0), knownCostValueMinor: knownCostProducts.reduce((total, product) => total + product.stockQuantity * (product.costPriceMinor ?? 0), 0), productsWithoutCost: products.length - knownCostProducts.length, movementSummary },
      employees: { total: employees.length, byStatus: employeeByStatus, linkedUsers: employees.filter((employee) => employee.userId).length, unlinkedEmployees: employees.filter((employee) => !employee.userId).length, activeSystemAccess: employees.filter((employee) => employee.user?.isActive).length },
      services: serviceRows,
      trends: [...dayMap].map(([date, values]) => ({ date, ...values })),
    };
  }
}
