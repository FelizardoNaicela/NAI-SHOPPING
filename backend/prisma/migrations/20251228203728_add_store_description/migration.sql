/*
  Warnings:

  - Added the required column `countryCode` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "countryCode" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "verificationType" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;
