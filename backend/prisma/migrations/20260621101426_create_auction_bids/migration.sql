-- DropIndex
DROP INDEX "AuctionBid_productId_userId_amount_key";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "currentBid" DROP NOT NULL,
ALTER COLUMN "currentBid" DROP DEFAULT;
