-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "locale" TEXT NOT NULL DEFAULT 'de',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Berlin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Business_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Business_currency_check" CHECK (char_length("currency") = 3),
    CONSTRAINT "Business_locale_check" CHECK (char_length("locale") BETWEEN 2 AND 10)
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameDe" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "shortDescriptionDe" TEXT NOT NULL,
    "shortDescriptionEn" TEXT NOT NULL,
    "descriptionDe" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "priceFrom" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Service_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Service_priceFrom_check" CHECK ("priceFrom" >= 0),
    CONSTRAINT "Service_durationMinutes_check" CHECK ("durationMinutes" > 0),
    CONSTRAINT "Service_sortOrder_check" CHECK ("sortOrder" >= 0)
);

CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");
CREATE INDEX "User_businessId_idx" ON "User"("businessId");
CREATE UNIQUE INDEX "Service_businessId_slug_key" ON "Service"("businessId", "slug");
CREATE INDEX "Service_businessId_idx" ON "Service"("businessId");
CREATE INDEX "Service_businessId_isActive_sortOrder_idx" ON "Service"("businessId", "isActive", "sortOrder");

ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Service" ADD CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
