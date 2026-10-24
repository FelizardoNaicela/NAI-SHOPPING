/*
  Migration:
  - Adiciona storeId aos AuctionBid existentes
  - Preenche os registros antigos através do Product
  - Torna storeId obrigatório
  - Cria o Ranking Nacional
*/

-- =========================================================
-- 1. ADICIONAR storeId TEMPORARIAMENTE COMO NULL
-- =========================================================

ALTER TABLE "AuctionBid"
ADD COLUMN "storeId" TEXT;


-- =========================================================
-- 2. PREENCHER OS LANCES EXISTENTES
--
-- Cada AuctionBid já possui productId.
--
-- Product.storeId informa qual banca pertence
-- ao produto/leilão.
-- =========================================================

UPDATE "AuctionBid" AS bid
SET "storeId" = product."storeId"
FROM "Product" AS product
WHERE bid."productId" = product."id";


-- =========================================================
-- 3. GARANTIR QUE NENHUM LANCE FICOU SEM storeId
-- =========================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "AuctionBid"
    WHERE "storeId" IS NULL
  ) THEN
    RAISE EXCEPTION
      'Migration abortada: existem AuctionBid sem storeId correspondente ao Product.';
  END IF;
END $$;


-- =========================================================
-- 4. TORNAR storeId OBRIGATÓRIO
-- =========================================================

ALTER TABLE "AuctionBid"
ALTER COLUMN "storeId" SET NOT NULL;


-- =========================================================
-- 5. ÍNDICE DO storeId
-- =========================================================

CREATE INDEX "AuctionBid_storeId_idx"
ON "AuctionBid"("storeId");


-- =========================================================
-- 6. FOREIGN KEY
-- =========================================================

ALTER TABLE "AuctionBid"
ADD CONSTRAINT "AuctionBid_storeId_fkey"
FOREIGN KEY ("storeId")
REFERENCES "Store"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;


-- =========================================================
-- 7. CRIAR RANKING NACIONAL
-- =========================================================

CREATE TABLE "NationalRankingPosition" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "storeId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NationalRankingPosition_pkey"
    PRIMARY KEY ("id")
);


-- =========================================================
-- 8. ÍNDICES
-- =========================================================

CREATE INDEX "NationalRankingPosition_countryCode_idx"
ON "NationalRankingPosition"("countryCode");

CREATE INDEX "NationalRankingPosition_storeId_idx"
ON "NationalRankingPosition"("storeId");

CREATE INDEX "NationalRankingPosition_assignedById_idx"
ON "NationalRankingPosition"("assignedById");


-- =========================================================
-- 9. UNIQUE
-- =========================================================

CREATE UNIQUE INDEX
"NationalRankingPosition_countryCode_position_key"
ON "NationalRankingPosition"("countryCode", "position");

CREATE UNIQUE INDEX
"NationalRankingPosition_countryCode_storeId_key"
ON "NationalRankingPosition"("countryCode", "storeId");


-- =========================================================
-- 10. FOREIGN KEY DO RANKING → STORE
-- =========================================================

ALTER TABLE "NationalRankingPosition"
ADD CONSTRAINT
"NationalRankingPosition_storeId_fkey"
FOREIGN KEY ("storeId")
REFERENCES "Store"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


-- =========================================================
-- 11. FOREIGN KEY DO RANKING → ADMIN
-- =========================================================

ALTER TABLE "NationalRankingPosition"
ADD CONSTRAINT
"NationalRankingPosition_assignedById_fkey"
FOREIGN KEY ("assignedById")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;