import type { PrismaClient } from "../../generated/prisma/client.js";
import type { AdminContactStore, ContactMessageInput, ContactStore } from "./contact.types.js";

const summary = { id: true, subject: true, createdAt: true } as const;

export class PrismaContactStore implements ContactStore, AdminContactStore {
  constructor(private readonly prisma: PrismaClient) {}

  async findPublicBusinessId() {
    const business = await this.prisma.business.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    return business?.id ?? null;
  }

  createMessage(businessId: string, input: ContactMessageInput) {
    return this.prisma.contactMessage.create({
      data: {
        businessId,
        name: input.name,
        email: input.email,
        ...(input.phone ? { phone: input.phone } : {}),
        subject: input.subject,
        message: input.message,
      },
      select: { id: true, createdAt: true },
    });
  }

  async listMessages(businessId: string, limit: number, after?: string) {
    const cursor = after ? await this.prisma.contactMessage.findFirst({
      where: { businessId, id: after },
      select: { id: true, createdAt: true },
    }) : null;
    if (after && !cursor) return null;
    const rows = await this.prisma.contactMessage.findMany({
      where: {
        businessId,
        ...(cursor ? { OR: [
          { createdAt: { lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, id: { lt: cursor.id } },
        ] } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      select: summary,
    });
    const items = rows.slice(0, limit);
    return { items, nextCursor: rows.length > limit ? (items.at(-1)?.id ?? null) : null };
  }

  findMessage(businessId: string, id: string) {
    return this.prisma.contactMessage.findFirst({
      where: { businessId, id },
      select: { ...summary, name: true, email: true, phone: true, message: true },
    });
  }
}
