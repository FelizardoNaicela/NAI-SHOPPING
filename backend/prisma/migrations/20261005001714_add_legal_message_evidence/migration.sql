-- CreateTable
CREATE TABLE "LegalMessageEvidence" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "holdId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "messageType" "MessageType" NOT NULL,
    "encryptedContent" TEXT,
    "encryptedAudioReference" TEXT,
    "encryptedImageReference" TEXT,
    "encryptedVideoReference" TEXT,
    "encryptedDocumentReference" TEXT,
    "documentName" TEXT,
    "evidenceHash" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalDeletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalMessageEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalMessageEvidence_messageId_idx" ON "LegalMessageEvidence"("messageId");

-- CreateIndex
CREATE INDEX "LegalMessageEvidence_investigationId_idx" ON "LegalMessageEvidence"("investigationId");

-- CreateIndex
CREATE INDEX "LegalMessageEvidence_holdId_idx" ON "LegalMessageEvidence"("holdId");

-- CreateIndex
CREATE INDEX "LegalMessageEvidence_conversationId_idx" ON "LegalMessageEvidence"("conversationId");

-- CreateIndex
CREATE INDEX "LegalMessageEvidence_senderId_idx" ON "LegalMessageEvidence"("senderId");

-- CreateIndex
CREATE INDEX "LegalMessageEvidence_receiverId_idx" ON "LegalMessageEvidence"("receiverId");

-- CreateIndex
CREATE INDEX "LegalMessageEvidence_capturedAt_idx" ON "LegalMessageEvidence"("capturedAt");

-- CreateIndex
CREATE INDEX "LegalMessageEvidence_evidenceHash_idx" ON "LegalMessageEvidence"("evidenceHash");

-- CreateIndex
CREATE UNIQUE INDEX "LegalMessageEvidence_messageId_investigationId_key" ON "LegalMessageEvidence"("messageId", "investigationId");

-- AddForeignKey
ALTER TABLE "LegalMessageEvidence" ADD CONSTRAINT "LegalMessageEvidence_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalMessageEvidence" ADD CONSTRAINT "LegalMessageEvidence_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "LegalInvestigationAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalMessageEvidence" ADD CONSTRAINT "LegalMessageEvidence_holdId_fkey" FOREIGN KEY ("holdId") REFERENCES "LegalHold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalMessageEvidence" ADD CONSTRAINT "LegalMessageEvidence_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalMessageEvidence" ADD CONSTRAINT "LegalMessageEvidence_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalMessageEvidence" ADD CONSTRAINT "LegalMessageEvidence_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
