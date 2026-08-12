CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE "VehicleType" AS ENUM ('SEDAN', 'SUV', 'HATCHBACK', 'VAN', 'COUPE', 'WAGON', 'OTHER');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

CREATE TABLE "Customer" (
  "id" TEXT NOT NULL, "businessId" TEXT NOT NULL, "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL, "phone" TEXT NOT NULL, "notes" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Vehicle" (
  "id" TEXT NOT NULL, "businessId" TEXT NOT NULL, "customerId" TEXT NOT NULL, "type" "VehicleType" NOT NULL,
  "brand" TEXT, "model" TEXT, "year" INTEGER, "licensePlate" TEXT, "color" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id"), CONSTRAINT "Vehicle_year_check" CHECK ("year" IS NULL OR "year" BETWEEN 1886 AND 2200)
);
CREATE TABLE "Booking" (
  "id" TEXT NOT NULL, "businessId" TEXT NOT NULL, "bookingNumber" TEXT NOT NULL, "customerId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL, "serviceId" TEXT NOT NULL, "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
  "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL, "notes" TEXT, "internalNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id"), CONSTRAINT "Booking_time_check" CHECK ("endsAt" > "startsAt")
);
CREATE UNIQUE INDEX "Customer_businessId_email_phone_key" ON "Customer"("businessId", "email", "phone");
CREATE INDEX "Customer_businessId_idx" ON "Customer"("businessId");
CREATE INDEX "Customer_businessId_lastName_firstName_idx" ON "Customer"("businessId", "lastName", "firstName");
CREATE INDEX "Vehicle_businessId_idx" ON "Vehicle"("businessId");
CREATE INDEX "Vehicle_customerId_idx" ON "Vehicle"("customerId");
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "Booking"("bookingNumber");
CREATE INDEX "Booking_businessId_startsAt_idx" ON "Booking"("businessId", "startsAt");
CREATE INDEX "Booking_businessId_status_idx" ON "Booking"("businessId", "status");
CREATE INDEX "Booking_businessId_serviceId_startsAt_idx" ON "Booking"("businessId", "serviceId", "startsAt");
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");
CREATE INDEX "Booking_vehicleId_idx" ON "Booking"("vehicleId");
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_no_active_service_overlap" EXCLUDE USING gist ("businessId" WITH =, "serviceId" WITH =, tsrange("startsAt", "endsAt", '[)') WITH &&) WHERE ("status" IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS'));
