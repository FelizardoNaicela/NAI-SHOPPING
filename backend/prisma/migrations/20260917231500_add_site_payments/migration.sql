-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PROMOTION', 'VERIFICATION', 'NATIONAL_RANKING', 'OTHER');

-- CreateTable
CREATE TABLE "SitePayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT,
    "type" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MZN',
    "description" TEXT,
    "reference" TEXT,
    "provider" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "promotionId" TEXT,
    "rankingAuctionId" TEXT,
    "verificationRequestId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "SitePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SitePayment_reference_key" ON "SitePayment"("reference");

-- CreateIndex
CREATE INDEX "SitePayment_userId_idx" ON "SitePayment"("userId");

-- CreateIndex
CREATE INDEX "SitePayment_storeId_idx" ON "SitePayment"("storeId");

-- CreateIndex
CREATE INDEX "SitePayment_type_idx" ON "SitePayment"("type");

-- CreateIndex
CREATE INDEX "SitePayment_status_idx" ON "SitePayment"("status");

-- CreateIndex
CREATE INDEX "SitePayment_paidAt_idx" ON "SitePayment"("paidAt");

-- CreateIndex
CREATE INDEX "SitePayment_createdAt_idx" ON "SitePayment"("createdAt");

-- CreateIndex
CREATE INDEX "SitePayment_promotionId_idx" ON "SitePayment"("promotionId");

-- CreateIndex
CREATE INDEX "SitePayment_rankingAuctionId_idx" ON "SitePayment"("rankingAuctionId");

-- CreateIndex
CREATE INDEX "SitePayment_verificationRequestId_idx" ON "SitePayment"("verificationRequestId");

-- AddForeignKey
ALTER TABLE "SitePayment" ADD CONSTRAINT "SitePayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitePayment" ADD CONSTRAINT "SitePayment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitePayment" ADD CONSTRAINT "SitePayment_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "ProductPromotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitePayment" ADD CONSTRAINT "SitePayment_rankingAuctionId_fkey" FOREIGN KEY ("rankingAuctionId") REFERENCES "NationalRankingAuction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitePayment" ADD CONSTRAINT "SitePayment_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "VerificationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
