import type {
  ApplicationUser,
  CreateServiceData,
  DataStore,
  ServiceRecord,
  UpdateServiceData,
} from "../../src/database/data-store.js";

const business = {
  id: "business-1",
  name: "AutoCare",
  currency: "EUR",
  locale: "de",
  timezone: "Europe/Berlin",
};

export class FakeDataStore implements DataStore {
  users: ApplicationUser[] = [
    {
      id: "user-1",
      clerkUserId: "test-user",
      businessId: business.id,
      role: "ADMIN",
      isActive: true,
      business,
    },
  ];
  services: ServiceRecord[] = [];

  async disconnect() {}
  async findUserByClerkId(clerkUserId: string) {
    return this.users.find((user) => user.clerkUserId === clerkUserId) ?? null;
  }
  async listPublicServices() {
    return this.services.filter((service) => service.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  }
  async findPublicServiceBySlug(slug: string) {
    return this.services.find((service) => service.slug === slug && service.isActive) ?? null;
  }
  async listServices(businessId: string) {
    return this.services.filter((service) => service.businessId === businessId);
  }
  async findService(businessId: string, serviceId: string) {
    return this.services.find((service) => service.id === serviceId && service.businessId === businessId) ?? null;
  }
  async createService(data: CreateServiceData) {
    if (this.services.some((service) => service.businessId === data.businessId && service.slug === data.slug)) {
      throw Object.assign(new Error("duplicate"), { code: "P2002" });
    }
    const timestamp = new Date("2026-01-01T00:00:00.000Z");
    const service: ServiceRecord = {
      ...data,
      id: `service-${this.services.length + 1}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.services.push(service);
    return service;
  }
  async updateService(businessId: string, serviceId: string, data: UpdateServiceData) {
    const service = await this.findService(businessId, serviceId);
    if (!service) return null;
    Object.assign(service, data, { updatedAt: new Date() });
    return service;
  }
}

export const validServiceInput = {
  slug: "car-detailing",
  nameDe: "Fahrzeugaufbereitung",
  nameEn: "Car Detailing",
  shortDescriptionDe: "Professionelle Außenpflege.",
  shortDescriptionEn: "Professional exterior care.",
  descriptionDe: "Professionelle Pflege für das gesamte Fahrzeug.",
  descriptionEn: "Professional care for the complete vehicle.",
  priceFrom: 12_500,
  durationMinutes: 120,
  imageUrl: null,
  isActive: true,
  sortOrder: 1,
};
