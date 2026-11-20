import type { PrismaClient } from "../../generated/prisma/client.js";
import type {
  AdminReviewList,
  AdminReviewListOptions,
  ReviewInput,
  ReviewStatus,
  ReviewStore,
} from "./review.types.js";

/** Public listings are capped so an unbounded moderation backlog cannot make
 * the unauthenticated endpoint expensive or return an oversized payload. */
const PUBLIC_REVIEW_LIMIT = 50;

export class PrismaReviewStore implements ReviewStore {
  constructor(private readonly prisma: PrismaClient) {}

  async findPublicBusinessId() {
    const business = await this.prisma.business.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    return business?.id ?? null;
  }

  create(businessId: string, input: ReviewInput) {
    return this.prisma.review.create({
      data: {
        businessId,
        customerName: input.customerName,
        rating: input.rating,
        message: input.message,
        ...(input.email ? { email: input.email } : {}),
      },
      select: { id: true, status: true },
    });
  }

  listApproved(businessId: string) {
    return this.prisma.review.findMany({
      where: { businessId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: PUBLIC_REVIEW_LIMIT,
      select: {
        id: true,
        customerName: true,
        rating: true,
        message: true,
        createdAt: true,
      },
    });
  }

  async listForAdmin(
    businessId: string,
    options: AdminReviewListOptions,
  ): Promise<AdminReviewList> {
    const where = {
      businessId,
      ...(options.status ? { status: options.status } : {}),
    };
    const skip = (options.page - 1) * options.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: options.limit,
        select: {
          id: true,
          customerName: true,
          rating: true,
          message: true,
          email: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return { items, total, page: options.page, limit: options.limit };
  }

  async updateStatus(businessId: string, reviewId: string, status: ReviewStatus) {
    const result = await this.prisma.review.updateMany({
      where: { id: reviewId, businessId },
      data: { status },
    });
    return result.count ? { id: reviewId, status } : null;
  }
}
