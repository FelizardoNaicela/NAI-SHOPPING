-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "locationKeyword" TEXT,
ADD COLUMN     "locationReference" TEXT;

-- CreateIndex
CREATE INDEX "Store_locationKeyword_idx" ON "Store"("locationKeyword");
