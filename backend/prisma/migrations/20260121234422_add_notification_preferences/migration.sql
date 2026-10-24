-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastActivity" TIMESTAMP(3);
