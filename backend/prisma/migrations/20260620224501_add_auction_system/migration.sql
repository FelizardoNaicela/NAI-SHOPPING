-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('NORMAL', 'AUCTION');

-- AlterEnum
ALTER TYPE "PostType" ADD VALUE 'AUCTION';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "auctionClosed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "auctionEndsAt" TIMESTAMP(3),
ADD COLUMN     "auctionStartPrice" DOUBLE PRECISION,
ADD COLUMN     "auctionStartsAt" TIMESTAMP(3),
ADD COLUMN     "auctionWinnerId" TEXT,
ADD COLUMN     "currentBid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "minimumIncrement" DOUBLE PRECISION,
ADD COLUMN     "reservePrice" DOUBLE PRECISION,
ADD COLUMN     "type" "ProductType" NOT NULL DEFAULT 'NORMAL';

-- CreateTable
CREATE TABLE "AuctionBid" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AuctionBid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuctionBid_productId_idx" ON "AuctionBid"("productId");

-- CreateIndex
CREATE INDEX "AuctionBid_userId_idx" ON "AuctionBid"("userId");

-- CreateIndex
CREATE INDEX "AuctionBid_productId_createdAt_idx" ON "AuctionBid"("productId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionBid_productId_userId_amount_key" ON "AuctionBid"("productId", "userId", "amount");

-- CreateIndex
CREATE INDEX "Product_type_idx" ON "Product"("type");

-- CreateIndex
CREATE INDEX "Product_auctionEndsAt_idx" ON "Product"("auctionEndsAt");

-- CreateIndex
CREATE INDEX "Product_auctionClosed_idx" ON "Product"("auctionClosed");

-- CreateIndex
CREATE INDEX "Product_type_auctionClosed_idx" ON "Product"("type", "auctionClosed");

-- CreateIndex
CREATE INDEX "Product_type_auctionEndsAt_idx" ON "Product"("type", "auctionEndsAt");

-- CreateIndex
CREATE INDEX "Product_auctionWinnerId_idx" ON "Product"("auctionWinnerId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_auctionWinnerId_fkey" FOREIGN KEY ("auctionWinnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
