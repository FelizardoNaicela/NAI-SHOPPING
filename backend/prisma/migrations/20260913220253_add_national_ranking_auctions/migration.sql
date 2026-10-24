/*
  Warnings:

  - You are about to drop the column `auctionProductId` on the `NationalRankingPosition` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "NationalRankingPosition" DROP CONSTRAINT "NationalRankingPosition_auctionProductId_fkey";

-- DropIndex
DROP INDEX "NationalRankingPosition_auctionProductId_key";

-- AlterTable
ALTER TABLE "NationalRankingPosition" DROP COLUMN "auctionProductId";

-- CreateTable
CREATE TABLE "NationalRankingAuction" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "startPrice" DOUBLE PRECISION NOT NULL,
    "currentBid" DOUBLE PRECISION,
    "minimumIncrement" DOUBLE PRECISION,
    "reservePrice" DOUBLE PRECISION,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "finalPrice" DOUBLE PRECISION,
    "winnerStoreId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NationalRankingAuction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NationalRankingAuctionBid" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isWinning" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auctionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "NationalRankingAuctionBid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NationalRankingAuction_countryCode_idx" ON "NationalRankingAuction"("countryCode");

-- CreateIndex
CREATE INDEX "NationalRankingAuction_endsAt_idx" ON "NationalRankingAuction"("endsAt");

-- CreateIndex
CREATE INDEX "NationalRankingAuction_closed_idx" ON "NationalRankingAuction"("closed");

-- CreateIndex
CREATE INDEX "NationalRankingAuction_winnerStoreId_idx" ON "NationalRankingAuction"("winnerStoreId");

-- CreateIndex
CREATE UNIQUE INDEX "NationalRankingAuction_countryCode_position_key" ON "NationalRankingAuction"("countryCode", "position");

-- CreateIndex
CREATE INDEX "NationalRankingAuctionBid_auctionId_idx" ON "NationalRankingAuctionBid"("auctionId");

-- CreateIndex
CREATE INDEX "NationalRankingAuctionBid_userId_idx" ON "NationalRankingAuctionBid"("userId");

-- CreateIndex
CREATE INDEX "NationalRankingAuctionBid_storeId_idx" ON "NationalRankingAuctionBid"("storeId");

-- CreateIndex
CREATE INDEX "NationalRankingAuctionBid_auctionId_createdAt_idx" ON "NationalRankingAuctionBid"("auctionId", "createdAt");

-- AddForeignKey
ALTER TABLE "NationalRankingAuction" ADD CONSTRAINT "NationalRankingAuction_winnerStoreId_fkey" FOREIGN KEY ("winnerStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NationalRankingAuction" ADD CONSTRAINT "NationalRankingAuction_countryCode_position_fkey" FOREIGN KEY ("countryCode", "position") REFERENCES "NationalRankingPosition"("countryCode", "position") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NationalRankingAuctionBid" ADD CONSTRAINT "NationalRankingAuctionBid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "NationalRankingAuction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NationalRankingAuctionBid" ADD CONSTRAINT "NationalRankingAuctionBid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NationalRankingAuctionBid" ADD CONSTRAINT "NationalRankingAuctionBid_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
