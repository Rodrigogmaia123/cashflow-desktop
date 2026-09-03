-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('BRL', 'USD', 'ARS', 'MXN', 'COP');

-- AlterTable Workspace
ALTER TABLE "Workspace" ADD COLUMN "baseCurrency" "Currency" NOT NULL DEFAULT 'BRL';

-- AlterTable Offer
ALTER TABLE "Offer" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'BRL';

-- AlterTable DailyPerformance
ALTER TABLE "DailyPerformance" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'BRL';
ALTER TABLE "DailyPerformance" ADD COLUMN "exchangeRateSnapshot" DECIMAL(65,30) NOT NULL DEFAULT 1;

-- AlterTable WorkspaceFeeConfig
ALTER TABLE "WorkspaceFeeConfig" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'BRL';

-- AlterTable FeeProfile
ALTER TABLE "FeeProfile" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'BRL';

-- CreateTable ExchangeRateConfig
CREATE TABLE "ExchangeRateConfig" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "fromCurrency" "Currency" NOT NULL,
    "toCurrency" "Currency" NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExchangeRateConfig_workspaceId_idx" ON "ExchangeRateConfig"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRateConfig_workspaceId_fromCurrency_toCurrency_key" ON "ExchangeRateConfig"("workspaceId", "fromCurrency", "toCurrency");

-- AddForeignKey
ALTER TABLE "ExchangeRateConfig" ADD CONSTRAINT "ExchangeRateConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
