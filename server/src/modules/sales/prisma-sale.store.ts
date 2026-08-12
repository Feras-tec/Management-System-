import { randomBytes } from "node:crypto";
import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type { SaleListInput, SaleWriteInput } from "./sale.types.js";
const include = {
  items: true,
  customer: { select: { id: true, firstName: true, lastName: true } },
  booking: { select: { id: true, bookingNumber: true, customerId: true } },
  payments: {
    select: {
      id: true,
      method: true,
      status: true,
      amountMinor: true,
      reference: true,
      paidAt: true,
      createdAt: true,
    },
  },
} as const;
function fail(code: string): never {
  throw Object.assign(new Error(code), { code });
}
export class PrismaSaleStore {
  constructor(private readonly prisma: PrismaClient) {}
  private async prepared(tx: Prisma.TransactionClient, input: SaleWriteInput) {
    let customerId = input.customerId ?? null;
    if (input.bookingId) {
      const booking = await tx.booking.findFirst({
        where: { id: input.bookingId, businessId: input.businessId },
      });
      if (!booking) fail("BOOKING_NOT_FOUND");
      if (customerId && customerId !== booking.customerId)
        fail("BOOKING_CUSTOMER_MISMATCH");
      customerId = booking.customerId;
    }
    if (
      customerId &&
      !(await tx.customer.findFirst({
        where: { id: customerId, businessId: input.businessId },
      }))
    )
      fail("CUSTOMER_NOT_FOUND");
    const items: Array<{
      type: "PRODUCT" | "SERVICE";
      productId: string | null;
      serviceId: string | null;
      description: string;
      quantity: number;
      unitPriceMinor: number;
      lineTotalMinor: number;
    }> = [];
    for (const raw of input.items) {
      if (raw.type === "PRODUCT") {
        const p = await tx.product.findFirst({
          where: { id: raw.productId, businessId: input.businessId },
        });
        if (!p) fail("PRODUCT_NOT_FOUND");
        if (!p.isActive) fail("PRODUCT_INACTIVE");
        if (p.salePriceMinor === 0) fail("PRODUCT_PRICE_REQUIRED");
        items.push({
          type: "PRODUCT",
          productId: p.id,
          serviceId: null,
          description: p.name,
          quantity: raw.quantity,
          unitPriceMinor: p.salePriceMinor,
          lineTotalMinor: p.salePriceMinor * raw.quantity,
        });
      } else {
        const s = await tx.service.findFirst({
          where: { id: raw.serviceId, businessId: input.businessId },
        });
        if (!s) fail("SERVICE_NOT_FOUND");
        if (!s.isActive) fail("SERVICE_INACTIVE");
        if (
          raw.unitPriceOverrideMinor !== undefined &&
          input.role === "EMPLOYEE"
        )
          fail("PRICE_OVERRIDE_FORBIDDEN");
        const price = raw.unitPriceOverrideMinor ?? s.priceFrom;
        if (price === 0 && raw.unitPriceOverrideMinor === undefined)
          fail("SERVICE_PRICE_REQUIRED");
        items.push({
          type: "SERVICE",
          productId: null,
          serviceId: s.id,
          description: s.nameEn,
          quantity: raw.quantity,
          unitPriceMinor: price,
          lineTotalMinor: price * raw.quantity,
        });
      }
    }
    const subtotalMinor = items.reduce((n, x) => n + x.lineTotalMinor, 0);
    if (input.discountMinor > subtotalMinor) fail("INVALID_DISCOUNT");
    const taxable = subtotalMinor - input.discountMinor;
    const business = await tx.business.findUniqueOrThrow({
      where: { id: input.businessId },
      select: { taxRateBps: true },
    });
    const taxMinor = Math.round((taxable * business.taxRateBps) / 10000);
    return {
      customerId,
      items,
      subtotalMinor,
      taxMinor,
      totalMinor: taxable + taxMinor,
    };
  }
  private dto(s: Prisma.SaleGetPayload<{ include: typeof include }>) {
    const paidMinor = s.payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((n, p) => n + p.amountMinor, 0);
    return {
      ...s,
      paidMinor,
      remainingMinor: Math.max(0, s.totalMinor - paidMinor),
      paymentStatus:
        paidMinor === 0
          ? "UNPAID"
          : paidMinor >= s.totalMinor
            ? "PAID"
            : "PARTIALLY_PAID",
    };
  }
  async create(input: SaleWriteInput) {
    return this.prisma.$transaction(
      async (tx) => {
        const p = await this.prepared(tx, input);
        const sale = await tx.sale.create({
          data: {
            businessId: input.businessId,
            saleNumber:
              "SALE-" +
              new Date().getUTCFullYear() +
              "-" +
              randomBytes(4).toString("hex").toUpperCase(),
            customerId: p.customerId,
            bookingId: input.bookingId ?? null,
            currency: "EUR",
            subtotalMinor: p.subtotalMinor,
            discountMinor: input.discountMinor,
            taxMinor: p.taxMinor,
            totalMinor: p.totalMinor,
            createdByUserId: input.actorId,
            items: { create: p.items },
          },
          include,
        });
        return this.dto(sale);
      },
      { isolationLevel: "Serializable" },
    );
  }
  async update(id: string, input: SaleWriteInput) {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(
          "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
          input.businessId + ":" + id,
        );
        const current = await tx.sale.findFirst({
          where: { id, businessId: input.businessId },
        });
        if (!current) fail("SALE_NOT_FOUND");
        if (current.status !== "DRAFT") fail("INVALID_SALE_STATE");
        const p = await this.prepared(tx, input);
        await tx.saleItem.deleteMany({ where: { saleId: id } });
        const sale = await tx.sale.update({
          where: { id },
          data: {
            customerId: p.customerId,
            bookingId: input.bookingId ?? null,
            subtotalMinor: p.subtotalMinor,
            discountMinor: input.discountMinor,
            taxMinor: p.taxMinor,
            totalMinor: p.totalMinor,
            items: { create: p.items },
          },
          include,
        });
        return this.dto(sale);
      },
      { isolationLevel: "Serializable" },
    );
  }
  async get(businessId: string, id: string) {
    const s = await this.prisma.sale.findFirst({
      where: { id, businessId },
      include,
    });
    return s ? this.dto(s) : null;
  }
  async list(input: SaleListInput) {
    const where: Prisma.SaleWhereInput = {
      businessId: input.businessId,
      ...(input.status ? { status: input.status } : {}),
      ...(input.customerId ? { customerId: input.customerId } : {}),
      ...(input.bookingId ? { bookingId: input.bookingId } : {}),
      ...(input.dateFrom || input.dateTo
        ? {
            createdAt: {
              ...(input.dateFrom ? { gte: input.dateFrom } : {}),
              ...(input.dateTo ? { lte: input.dateTo } : {}),
            },
          }
        : {}),
      ...(input.search
        ? {
            OR: [
              { saleNumber: { contains: input.search, mode: "insensitive" } },
              {
                customer: {
                  firstName: { contains: input.search, mode: "insensitive" },
                },
              },
              {
                customer: {
                  lastName: { contains: input.search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include,
        orderBy: { [input.sort]: input.order },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      this.prisma.sale.count({ where }),
    ]);
    return { items: rows.map((x) => this.dto(x)), total };
  }
  async complete(businessId: string, id: string, actorId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(
          "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
          businessId + ":" + id,
        );
        const sale = await tx.sale.findFirst({
          where: { id, businessId },
          include: { items: true },
        });
        if (!sale) fail("SALE_NOT_FOUND");
        if (sale.status !== "DRAFT") fail("INVALID_SALE_STATE");
        const grouped = new Map<string, number>();
        for (const i of sale.items)
          if (i.productId)
            grouped.set(
              i.productId,
              (grouped.get(i.productId) ?? 0) + i.quantity,
            );
        for (const productId of [...grouped.keys()].sort()) {
          await tx.$executeRawUnsafe(
            "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
            businessId + ":" + productId,
          );
          const p = await tx.product.findFirst({
            where: { id: productId, businessId },
          });
          if (!p) fail("PRODUCT_NOT_FOUND");
          if (!p.isActive) fail("PRODUCT_INACTIVE");
          const qty = grouped.get(productId)!;
          if (p.stockQuantity < qty) fail("INSUFFICIENT_STOCK");
          const after = p.stockQuantity - qty;
          const changed = await tx.product.updateMany({
            where: {
              id: productId,
              businessId,
              stockQuantity: p.stockQuantity,
            },
            data: { stockQuantity: after },
          });
          if (changed.count !== 1) fail("STOCK_CONFLICT");
          await tx.inventoryMovement.create({
            data: {
              businessId,
              productId,
              type: "SALE",
              quantityDelta: -qty,
              quantityBefore: p.stockQuantity,
              quantityAfter: after,
              reason: "Sale " + sale.saleNumber,
              referenceType: "SALE",
              referenceId: id,
              createdByUserId: actorId,
            },
          });
        }
      const business = await tx.business.findUniqueOrThrow({
        where: { id: businessId },
        select: { taxRateBps: true },
      });
      const taxable = sale.subtotalMinor - sale.discountMinor;
      const taxMinor = Math.round((taxable * business.taxRateBps) / 10000);
      await tx.sale.update({
        where: { id },
        data: { status: "COMPLETED", soldAt: new Date(), taxMinor, totalMinor: taxable + taxMinor },
      });
        return this.dto(
          await tx.sale.findUniqueOrThrow({ where: { id }, include }),
        );
      },
      { isolationLevel: "Serializable" },
    );
  }
  async cancel(businessId: string, id: string, actorId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(
          "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
          businessId + ":" + id,
        );
        const sale = await tx.sale.findFirst({
          where: { id, businessId },
          include: { items: true, payments: true },
        });
        if (!sale) fail("SALE_NOT_FOUND");
        if (sale.status === "CANCELLED") fail("INVALID_SALE_STATE");
        if (sale.payments.some((p) => p.status === "COMPLETED"))
          fail("PAID_SALE_CANNOT_BE_CANCELLED");
        if (sale.status === "COMPLETED") {
          const grouped = new Map<string, number>();
          for (const i of sale.items)
            if (i.productId)
              grouped.set(
                i.productId,
                (grouped.get(i.productId) ?? 0) + i.quantity,
              );
          for (const productId of [...grouped.keys()].sort()) {
            await tx.$executeRawUnsafe(
              "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
              businessId + ":" + productId,
            );
            const p = await tx.product.findFirstOrThrow({
              where: { id: productId, businessId },
            });
            const qty = grouped.get(productId)!;
            await tx.product.update({
              where: { id: productId },
              data: { stockQuantity: p.stockQuantity + qty },
            });
            await tx.inventoryMovement.create({
              data: {
                businessId,
                productId,
                type: "CANCELLATION",
                quantityDelta: qty,
                quantityBefore: p.stockQuantity,
                quantityAfter: p.stockQuantity + qty,
                reason: "Cancelled sale " + sale.saleNumber,
                referenceType: "SALE",
                referenceId: id,
                createdByUserId: actorId,
              },
            });
          }
        }
        await tx.sale.update({ where: { id }, data: { status: "CANCELLED" } });
        return this.dto(
          await tx.sale.findUniqueOrThrow({ where: { id }, include }),
        );
      },
      { isolationLevel: "Serializable" },
    );
  }
  async payments(businessId: string, id: string) {
    const sale = await this.get(businessId, id);
    if (!sale) fail("SALE_NOT_FOUND");
    return sale.payments;
  }
  async addPayment(
    businessId: string,
    id: string,
    actorId: string,
    input: {
      method: "CASH" | "CARD" | "BANK_TRANSFER" | "OTHER";
      amountMinor: number;
      reference?: string | null | undefined;
    },
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(
          "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
          businessId + ":" + id,
        );
        const sale = await tx.sale.findFirst({
          where: { id, businessId },
          include: { payments: true },
        });
        if (!sale) fail("SALE_NOT_FOUND");
        if (sale.status !== "COMPLETED") fail("INVALID_SALE_STATE");
        const paid = sale.payments
          .filter((p) => p.status === "COMPLETED")
          .reduce((n, p) => n + p.amountMinor, 0);
        if (paid + input.amountMinor > sale.totalMinor)
          fail("PAYMENT_EXCEEDS_REMAINING");
        return tx.payment.create({
          data: {
            businessId,
            saleId: id,
            method: input.method,
            status: "COMPLETED",
            amountMinor: input.amountMinor,
            reference: input.reference ?? null,
            paidAt: new Date(),
            createdByUserId: actorId,
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
  }
  async summary(businessId: string) {
    const [count, sum, recent] = await Promise.all([
      this.prisma.sale.count({ where: { businessId, status: "COMPLETED" } }),
      this.prisma.sale.aggregate({
        where: { businessId, status: "COMPLETED" },
        _sum: { totalMinor: true },
      }),
      this.prisma.sale.findMany({
        where: { businessId },
        select: {
          id: true,
          saleNumber: true,
          status: true,
          totalMinor: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);
    return {
      totalSales: count,
      revenueMinor: sum._sum.totalMinor ?? 0,
      recent,
    };
  }
}
