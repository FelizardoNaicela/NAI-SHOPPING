-- 1. Criar o novo campo de províncias
ALTER TABLE "ProductPromotion"
ADD COLUMN "targetRegions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- 2. Preservar as províncias existentes
UPDATE "ProductPromotion"
SET "targetRegions" =
  CASE
    WHEN "targetRegion" IS NULL OR TRIM("targetRegion") = ''
      THEN ARRAY[]::TEXT[]
    ELSE ARRAY["targetRegion"]::TEXT[]
  END;

-- 3. Remover o índice antigo
DROP INDEX IF EXISTS "ProductPromotion_targetCountryCode_targetRegion_idx";

-- 4. Remover o campo antigo
ALTER TABLE "ProductPromotion"
DROP COLUMN "targetRegion";

-- 5. Criar o novo índice
CREATE INDEX "ProductPromotion_targetCountryCode_targetRegions_idx"
ON "ProductPromotion"("targetCountryCode", "targetRegions");