CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
ALTER TABLE "Business" ADD COLUMN "taxRateBps" INTEGER NOT NULL DEFAULT 1900,
ADD CONSTRAINT "Business_taxRateBps_check" CHECK ("taxRateBps" BETWEEN 0 AND 10000);
CREATE TABLE "BusinessOpeningHour" (
  "businessId" TEXT NOT NULL,
  "dayOfWeek" "DayOfWeek" NOT NULL,
  "isOpen" BOOLEAN NOT NULL DEFAULT false,
  "openTime" VARCHAR(5),
  "closeTime" VARCHAR(5),
  CONSTRAINT "BusinessOpeningHour_pkey" PRIMARY KEY ("businessId", "dayOfWeek"),
  CONSTRAINT "BusinessOpeningHour_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BusinessOpeningHour_time_format_check" CHECK ((NOT "isOpen" AND "openTime" IS NULL AND "closeTime" IS NULL) OR ("isOpen" AND "openTime" ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$' AND "closeTime" ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$' AND "openTime" < "closeTime"))
);
INSERT INTO "BusinessOpeningHour" ("businessId", "dayOfWeek", "isOpen", "openTime", "closeTime")
SELECT id, day, day <> 'SUNDAY'::"DayOfWeek",
  CASE WHEN day = 'SUNDAY'::"DayOfWeek" THEN NULL WHEN day = 'SATURDAY'::"DayOfWeek" THEN '09:00' ELSE '08:00' END,
  CASE WHEN day = 'SUNDAY'::"DayOfWeek" THEN NULL WHEN day = 'SATURDAY'::"DayOfWeek" THEN '14:00' ELSE '18:00' END
FROM "Business" CROSS JOIN unnest(enum_range(NULL::"DayOfWeek")) AS day;
