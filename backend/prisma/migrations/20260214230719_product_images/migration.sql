/*
  Warnings:

  - You are about to drop the column `url` on the `ProductImage` table. All the data in the column will be lost.
  - Added the required column `originalUrl` to the `ProductImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductImage" DROP COLUMN "url",
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "largeUrl" TEXT,
ADD COLUMN     "mediumUrl" TEXT,
ADD COLUMN     "originalUrl" TEXT NOT NULL,
ADD COLUMN     "sizeKb" INTEGER,
ADD COLUMN     "smallUrl" TEXT,
ADD COLUMN     "thumbUrl" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "webpUrl" TEXT,
ADD COLUMN     "width" INTEGER;
