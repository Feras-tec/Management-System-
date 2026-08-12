export type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

export interface BusinessSummary {
  id: string;
  name: string;
  currency: string;
  locale: string;
  timezone: string;
}

export interface ApplicationUser {
  id: string;
  clerkUserId: string;
  businessId: string;
  role: UserRole;
  isActive: boolean;
  business: BusinessSummary;
}

export interface ServiceRecord {
  id: string;
  businessId: string;
  slug: string;
  nameDe: string;
  nameEn: string;
  shortDescriptionDe: string;
  shortDescriptionEn: string;
  descriptionDe: string;
  descriptionEn: string;
  priceFrom: number;
  durationMinutes: number;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateServiceData = Omit<
  ServiceRecord,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateServiceData = Partial<
  Omit<ServiceRecord, "id" | "businessId" | "createdAt" | "updatedAt">
>;

export interface DataStore {
  disconnect(): Promise<void>;
  findUserByClerkId(clerkUserId: string): Promise<ApplicationUser | null>;
  listPublicServices(): Promise<ServiceRecord[]>;
  findPublicServiceBySlug(slug: string): Promise<ServiceRecord | null>;
  listServices(businessId: string): Promise<ServiceRecord[]>;
  findService(businessId: string, serviceId: string): Promise<ServiceRecord | null>;
  createService(data: CreateServiceData): Promise<ServiceRecord>;
  updateService(
    businessId: string,
    serviceId: string,
    data: UpdateServiceData,
  ): Promise<ServiceRecord | null>;
}
