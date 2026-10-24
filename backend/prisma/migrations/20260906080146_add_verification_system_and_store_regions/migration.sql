/*
  Warnings:

  - The `verificationType` column on the `Store` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('BASIC', 'PREMIUM');

-- CreateEnum
CREATE TYPE "VerificationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "regionalManagementLocked" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "verificationType",
ADD COLUMN     "verificationType" "VerificationType";

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "requestedType" "VerificationType" NOT NULL,
    "status" "VerificationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreRegion" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreRegion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationRequest_storeId_idx" ON "VerificationRequest"("storeId");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest"("status");

-- CreateIndex
CREATE INDEX "VerificationRequest_requestedType_idx" ON "VerificationRequest"("requestedType");

-- CreateIndex
CREATE INDEX "VerificationRequest_createdAt_idx" ON "VerificationRequest"("createdAt");

-- CreateIndex
CREATE INDEX "StoreRegion_region_idx" ON "StoreRegion"("region");

-- CreateIndex
CREATE INDEX "StoreRegion_storeId_idx" ON "StoreRegion"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreRegion_storeId_region_key" ON "StoreRegion"("storeId", "region");

-- CreateIndex
CREATE INDEX "Store_verificationType_idx" ON "Store"("verificationType");

-- CreateIndex
CREATE INDEX "Store_verified_idx" ON "Store"("verified");

-- CreateIndex
CREATE INDEX "Store_regionalManagementLocked_idx" ON "Store"("regionalManagementLocked");

-- CreateIndex
CREATE INDEX "Store_countryCode_region_idx" ON "Store"("countryCode", "region");

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreRegion" ADD CONSTRAINT "StoreRegion_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
