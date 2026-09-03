-- CreateEnum
CREATE TYPE "OfferActionType" AS ENUM ('PAUSE', 'MONITOR', 'SCALE');

-- CreateEnum
CREATE TYPE "OfferActionSource" AS ENUM ('MANUAL', 'AUTOMATION');

-- CreateTable
CREATE TABLE "OfferActionLog" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "actionType" "OfferActionType" NOT NULL,
    "source" "OfferActionSource" NOT NULL DEFAULT 'MANUAL',
    "metadata_json" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferAutomationRule" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "condition_json" TEXT NOT NULL,
    "action" "OfferActionType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferAutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfferActionLog_offerId_createdAt_idx" ON "OfferActionLog"("offerId", "createdAt");

-- CreateIndex
CREATE INDEX "OfferActionLog_actionType_idx" ON "OfferActionLog"("actionType");

-- CreateIndex
CREATE INDEX "OfferActionLog_source_idx" ON "OfferActionLog"("source");

-- CreateIndex
CREATE INDEX "OfferAutomationRule_offerId_idx" ON "OfferAutomationRule"("offerId");

-- CreateIndex
CREATE INDEX "OfferAutomationRule_active_idx" ON "OfferAutomationRule"("active");

-- AddForeignKey
ALTER TABLE "OfferActionLog" ADD CONSTRAINT "OfferActionLog_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferAutomationRule" ADD CONSTRAINT "OfferAutomationRule_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
