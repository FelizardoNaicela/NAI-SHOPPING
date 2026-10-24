/*
  Warnings:

  - Added the required column `packageId` to the `ProductPromotion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductPromotion" ADD COLUMN     "packageId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PromotionPackage" (
    "id" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromotionPackage_isActive_idx" ON "PromotionPackage"("isActive");

-- CreateIndex
CREATE INDEX "ProductPromotion_packageId_idx" ON "ProductPromotion"("packageId");

-- AddForeignKey
ALTER TABLE "ProductPromotion" ADD CONSTRAINT "ProductPromotion_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PromotionPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
