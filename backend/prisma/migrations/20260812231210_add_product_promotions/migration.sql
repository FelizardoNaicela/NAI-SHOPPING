-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PromotionPlacement" AS ENUM ('FEED', 'SEARCH', 'CATEGORY');

-- CreateTable
CREATE TABLE "ProductPromotion" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "impressionLimit" INTEGER NOT NULL,
    "impressionsUsed" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPromotionProduct" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPromotionProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPromotionPlacement" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "placement" "PromotionPlacement" NOT NULL,

    CONSTRAINT "ProductPromotionPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductPromotion_storeId_idx" ON "ProductPromotion"("storeId");

-- CreateIndex
CREATE INDEX "ProductPromotion_status_idx" ON "ProductPromotion"("status");

-- CreateIndex
CREATE INDEX "ProductPromotion_startsAt_endsAt_idx" ON "ProductPromotion"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "ProductPromotion_status_priority_idx" ON "ProductPromotion"("status", "priority");

-- CreateIndex
CREATE INDEX "ProductPromotionProduct_promotionId_order_idx" ON "ProductPromotionProduct"("promotionId", "order");

-- CreateIndex
CREATE INDEX "ProductPromotionProduct_productId_idx" ON "ProductPromotionProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPromotionProduct_promotionId_productId_key" ON "ProductPromotionProduct"("promotionId", "productId");

-- CreateIndex
CREATE INDEX "ProductPromotionPlacement_placement_idx" ON "ProductPromotionPlacement"("placement");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPromotionPlacement_promotionId_placement_key" ON "ProductPromotionPlacement"("promotionId", "placement");

-- AddForeignKey
ALTER TABLE "ProductPromotion" ADD CONSTRAINT "ProductPromotion_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPromotionProduct" ADD CONSTRAINT "ProductPromotionProduct_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "ProductPromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPromotionProduct" ADD CONSTRAINT "ProductPromotionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPromotionPlacement" ADD CONSTRAINT "ProductPromotionPlacement_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "ProductPromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
