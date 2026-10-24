-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('GENERAL', 'PRODUCT_PROMOTION', 'ANNOUNCEMENT');

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "content" TEXT,
    "type" "PostType" NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostImage" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "PostImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Post_storeId_createdAt_idx" ON "Post"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "PostImage_postId_order_idx" ON "PostImage"("postId", "order");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostImage" ADD CONSTRAINT "PostImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
