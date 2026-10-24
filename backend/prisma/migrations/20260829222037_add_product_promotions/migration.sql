/*
  Warnings:

  - You are about to drop the column `messageNotificationDeliveredAt` on the `Message` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProductDiscountStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "messageNotificationDeliveredAt";

-- CreateTable
CREATE TABLE "ProductDiscount" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT,
    "discountPercent" DOUBLE PRECISION NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "ProductDiscountStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDiscountProduct" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductDiscountProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductDiscount_storeId_idx" ON "ProductDiscount"("storeId");

-- CreateIndex
CREATE INDEX "ProductDiscount_status_idx" ON "ProductDiscount"("status");

-- CreateIndex
CREATE INDEX "ProductDiscount_startsAt_endsAt_idx" ON "ProductDiscount"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "ProductDiscountProduct_discountId_idx" ON "ProductDiscountProduct"("discountId");

-- CreateIndex
CREATE INDEX "ProductDiscountProduct_productId_idx" ON "ProductDiscountProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDiscountProduct_discountId_productId_key" ON "ProductDiscountProduct"("discountId", "productId");

-- AddForeignKey
ALTER TABLE "ProductDiscount" ADD CONSTRAINT "ProductDiscount_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDiscountProduct" ADD CONSTRAINT "ProductDiscountProduct_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "ProductDiscount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDiscountProduct" ADD CONSTRAINT "ProductDiscountProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
