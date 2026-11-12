-- 1. Criar o modo de localização da promoção
CREATE TYPE "PromotionLocationMode" AS ENUM (
    'INHERITED',
    'CUSTOM'
);

-- 2. Acrescentar os campos de localização
-- inicialmente permitindo valores nulos
ALTER TABLE "ProductPromotion"
ADD COLUMN "locationMode" "PromotionLocationMode"
NOT NULL DEFAULT 'INHERITED';

ALTER TABLE "ProductPromotion"
ADD COLUMN "targetCountryCode" TEXT;

ALTER TABLE "ProductPromotion"
ADD COLUMN "targetRegion" TEXT;

-- 3. Preencher as campanhas antigas
-- usando a localização das respetivas bancas
UPDATE "ProductPromotion" AS promotion
SET
    "targetCountryCode" = store."countryCode",
    "targetRegion" = store."region"
FROM "Store" AS store
WHERE promotion."storeId" = store."id";

-- 4. Tornar o país obrigatório
ALTER TABLE "ProductPromotion"
ALTER COLUMN "targetCountryCode" SET NOT NULL;

-- 5. Criar índice para acelerar pesquisas
CREATE INDEX "ProductPromotion_targetCountryCode_targetRegion_idx"
ON "ProductPromotion"("targetCountryCode", "targetRegion");