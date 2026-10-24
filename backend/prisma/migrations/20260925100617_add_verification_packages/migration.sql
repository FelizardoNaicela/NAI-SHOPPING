-- CreateTable
CREATE TABLE "VerificationPackage" (
    "id" TEXT NOT NULL,
    "verificationType" "VerificationType" NOT NULL,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationPackage_verificationType_key" ON "VerificationPackage"("verificationType");

-- CreateIndex
CREATE INDEX "VerificationPackage_isActive_idx" ON "VerificationPackage"("isActive");

-- CreateIndex
CREATE INDEX "VerificationPackage_verificationType_idx" ON "VerificationPackage"("verificationType");
