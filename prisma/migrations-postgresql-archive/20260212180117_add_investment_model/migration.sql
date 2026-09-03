/*
  Warnings:

  - You are about to drop the `OfferActionLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OfferAutomationRule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OfferActionLog" DROP CONSTRAINT "OfferActionLog_offerId_fkey";

-- DropForeignKey
ALTER TABLE "OfferAutomationRule" DROP CONSTRAINT "OfferAutomationRule_offerId_fkey";

-- DropTable
DROP TABLE "OfferActionLog";

-- DropTable
DROP TABLE "OfferAutomationRule";

-- DropEnum
DROP TYPE "OfferActionSource";

-- DropEnum
DROP TYPE "OfferActionType";

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Investment_workspaceId_date_idx" ON "Investment"("workspaceId", "date");

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
