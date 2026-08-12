CREATE TYPE "InventoryMovementType" AS ENUM ('INITIAL', 'PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'CANCELLATION');

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "salePriceMinor" INTEGER NOT NULL,
  "costPriceMinor" INTEGER,
  "stockQuantity" INTEGER NOT NULL DEFAULT 0,
  "minimumStock" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Product_salePrice_nonnegative" CHECK ("salePriceMinor" >= 0),
  CONSTRAINT "Product_costPrice_nonnegative" CHECK ("costPriceMinor" IS NULL OR "costPriceMinor" >= 0),
  CONSTRAINT "Product_stock_nonnegative" CHECK ("stockQuantity" >= 0),
  CONSTRAINT "Product_minimumStock_nonnegative" CHECK ("minimumStock" >= 0)
);

CREATE TABLE "InventoryMovement" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "type" "InventoryMovementType" NOT NULL,
  "quantityDelta" INTEGER NOT NULL,
  "quantityBefore" INTEGER NOT NULL,
  "quantityAfter" INTEGER NOT NULL,
  "reason" TEXT,
  "referenceType" TEXT,
  "referenceId" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InventoryMovement_delta_nonzero" CHECK ("quantityDelta" <> 0),
  CONSTRAINT "InventoryMovement_before_nonnegative" CHECK ("quantityBefore" >= 0),
  CONSTRAINT "InventoryMovement_after_nonnegative" CHECK ("quantityAfter" >= 0),
  CONSTRAINT "InventoryMovement_balance" CHECK ("quantityAfter" = "quantityBefore" + "quantityDelta")
);

CREATE UNIQUE INDEX "Product_businessId_sku_key" ON "Product"("businessId", "sku");
CREATE INDEX "Product_businessId_isActive_idx" ON "Product"("businessId", "isActive");
CREATE INDEX "Product_businessId_category_idx" ON "Product"("businessId", "category");
CREATE INDEX "Product_businessId_stockQuantity_minimumStock_idx" ON "Product"("businessId", "stockQuantity", "minimumStock");
CREATE INDEX "InventoryMovement_businessId_createdAt_idx" ON "InventoryMovement"("businessId", "createdAt");
CREATE INDEX "InventoryMovement_productId_createdAt_idx" ON "InventoryMovement"("productId", "createdAt");
CREATE INDEX "InventoryMovement_createdByUserId_idx" ON "InventoryMovement"("createdByUserId");

ALTER TABLE "Product" ADD CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
