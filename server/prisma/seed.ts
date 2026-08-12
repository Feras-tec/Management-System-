import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";
import { seedRepresentativeCatalog } from "./catalog.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to run the seed.");
if (process.env.NODE_ENV === "production") {
  throw new Error("The development seed must not run in production.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const services = [
  {
    slug: "car-detailing",
    nameDe: "Fahrzeugaufbereitung",
    nameEn: "Car Detailing",
    shortDescriptionDe: "Professionelle Pflege für Lack und Außenflächen.",
    shortDescriptionEn: "Professional care for paintwork and exterior surfaces.",
  },
  {
    slug: "interior-cleaning",
    nameDe: "Innenraumreinigung",
    nameEn: "Interior Cleaning",
    shortDescriptionDe: "Gründliche Reinigung von Sitzen, Teppichen und Oberflächen.",
    shortDescriptionEn: "Thorough cleaning of seats, carpets, and interior surfaces.",
  },
  {
    slug: "car-wrapping",
    nameDe: "Fahrzeugfolierung und Farbwechsel",
    nameEn: "Car Wrapping / Color Change",
    shortDescriptionDe: "Individuelle Folierung zum Schutz und zur Farbgestaltung.",
    shortDescriptionEn: "Custom wrapping for protection and a new vehicle color.",
  },
  {
    slug: "window-tinting",
    nameDe: "Scheibentönung",
    nameEn: "Window Tinting",
    shortDescriptionDe: "Hochwertige Tönungsfolien für Komfort und Sichtschutz.",
    shortDescriptionEn: "Quality window films for comfort and added privacy.",
  },
  {
    slug: "underbody-protection",
    nameDe: "Unterbodenschutz",
    nameEn: "Underbody Protection",
    shortDescriptionDe: "Langfristiger Schutz des Unterbodens vor Feuchtigkeit und Salz.",
    shortDescriptionEn: "Long-lasting underbody protection from moisture and road salt.",
  },
  {
    slug: "rust-protection",
    nameDe: "Rostschutz und Unterbodenbeschichtung",
    nameEn: "Rust Protection / Undercoating",
    shortDescriptionDe: "Gezielte Vorsorge gegen Korrosion an gefährdeten Bereichen.",
    shortDescriptionEn: "Targeted corrosion prevention for vulnerable vehicle areas.",
  },
] as const;

async function main() {
  const business = await prisma.business.upsert({
    where: { slug: "autocare" },
    update: {},
    create: { name: "AutoCare", slug: "autocare" },
  });

  const openingHourDefaults = [
    ["MONDAY", true, "08:00", "18:00"], ["TUESDAY", true, "08:00", "18:00"],
    ["WEDNESDAY", true, "08:00", "18:00"], ["THURSDAY", true, "08:00", "18:00"],
    ["FRIDAY", true, "08:00", "18:00"], ["SATURDAY", true, "09:00", "14:00"],
    ["SUNDAY", false, null, null],
  ] as const;
  for (const [dayOfWeek, isOpen, openTime, closeTime] of openingHourDefaults) {
    await prisma.businessOpeningHour.upsert({
      where: { businessId_dayOfWeek: { businessId: business.id, dayOfWeek } },
      update: {},
      create: { businessId: business.id, dayOfWeek, isOpen, openTime, closeTime },
    });
  }

  for (const [sortOrder, service] of services.entries()) {
    await prisma.service.upsert({
      where: {
        businessId_slug: { businessId: business.id, slug: service.slug },
      },
      update: {
        ...service,
        descriptionDe: service.shortDescriptionDe,
        descriptionEn: service.shortDescriptionEn,
        sortOrder,
      },
      create: {
        ...service,
        businessId: business.id,
        descriptionDe: service.shortDescriptionDe,
        descriptionEn: service.shortDescriptionEn,
        priceFrom: 0,
        durationMinutes: 60,
        sortOrder,
      },
    });
  }

  await seedRepresentativeCatalog(prisma, business.id);

  const bootstrapClerkUserId = process.env.BOOTSTRAP_ADMIN_CLERK_USER_ID;
  if (bootstrapClerkUserId) {
    await prisma.user.upsert({
      where: { clerkUserId: bootstrapClerkUserId },
      update: {
        businessId: business.id,
        role: "ADMIN",
        isActive: true,
      },
      create: {
        clerkUserId: bootstrapClerkUserId,
        businessId: business.id,
        role: "ADMIN",
        isActive: true,
      },
    });
  }
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Seed failed.");
    process.exitCode = 1;
  });
