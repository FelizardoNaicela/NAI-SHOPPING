-- DropIndex
DROP INDEX "NationalRankingPosition_countryCode_storeId_key";

-- AlterTable
ALTER TABLE "NationalRankingPosition" ALTER COLUMN "storeId" DROP NOT NULL;
