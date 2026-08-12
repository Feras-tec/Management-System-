import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client.js";
import type {
  ApplicationUser,
  CreateServiceData,
  DataStore,
  ServiceRecord,
  UpdateServiceData,
} from "./data-store.js";

const serviceOrder = [
  { sortOrder: "asc" as const },
  { createdAt: "asc" as const },
];

export class PrismaDataStore implements DataStore {
  readonly client: PrismaClient;

  constructor(databaseUrl: string) {
    this.client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    });
  }

  async disconnect() {
    await this.client.$disconnect();
  }

  async findUserByClerkId(clerkUserId: string): Promise<ApplicationUser | null> {
    return this.client.user.findUnique({
      where: { clerkUserId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            currency: true,
            locale: true,
            timezone: true,
          },
        },
      },
    });
  }

  private async getPublicBusinessId() {
    const business = await this.client.business.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    return business?.id ?? null;
  }

  async listPublicServices(): Promise<ServiceRecord[]> {
    const businessId = await this.getPublicBusinessId();
    if (!businessId) return [];
    return this.client.service.findMany({
      where: { businessId, isActive: true },
      orderBy: serviceOrder,
    });
  }

  async findPublicServiceBySlug(slug: string): Promise<ServiceRecord | null> {
    const businessId = await this.getPublicBusinessId();
    if (!businessId) return null;
    return this.client.service.findFirst({
      where: { businessId, slug, isActive: true },
    });
  }

  listServices(businessId: string): Promise<ServiceRecord[]> {
    return this.client.service.findMany({
      where: { businessId },
      orderBy: serviceOrder,
    });
  }

  findService(businessId: string, serviceId: string): Promise<ServiceRecord | null> {
    return this.client.service.findFirst({
      where: { id: serviceId, businessId },
    });
  }

  createService(data: CreateServiceData): Promise<ServiceRecord> {
    return this.client.service.create({ data });
  }

  async updateService(
    businessId: string,
    serviceId: string,
    data: UpdateServiceData,
  ): Promise<ServiceRecord | null> {
    const result = await this.client.service.updateMany({
      where: { id: serviceId, businessId },
      data,
    });
    if (result.count === 0) return null;
    return this.findService(businessId, serviceId);
  }
}
