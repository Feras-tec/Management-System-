CREATE TABLE "ContactMessage" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "phone" VARCHAR(40),
  "subject" VARCHAR(160) NOT NULL,
  "message" VARCHAR(4000) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContactMessage_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ContactMessage_businessId_createdAt_idx"
  ON "ContactMessage"("businessId", "createdAt");
