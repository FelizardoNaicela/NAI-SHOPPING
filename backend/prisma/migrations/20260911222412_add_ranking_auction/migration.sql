/*
  Warnings:

  - A unique constraint covering the columns `[auctionProductId]` on the table `NationalRankingPosition` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "NationalRankingPosition" ADD COLUMN     "auctionProductId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "NationalRankingPosition_auctionProductId_key" ON "NationalRankingPosition"("auctionProductId");

-- AddForeignKey
ALTER TABLE "NationalRankingPosition" ADD CONSTRAINT "NationalRankingPosition_auctionProductId_fkey" FOREIGN KEY ("auctionProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
