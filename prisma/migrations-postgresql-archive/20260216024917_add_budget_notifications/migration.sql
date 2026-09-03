-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BUDGET_WARNING_75', 'BUDGET_WARNING_90', 'BUDGET_EXCEEDED_100', 'BUDGET_CRITICAL_EXCEEDED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'DISMISSED');

-- CreateTable
CREATE TABLE "BudgetNotification" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata_json" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "BudgetNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetNotification_workspaceId_idx" ON "BudgetNotification"("workspaceId");

-- CreateIndex
CREATE INDEX "BudgetNotification_userId_idx" ON "BudgetNotification"("userId");

-- CreateIndex
CREATE INDEX "BudgetNotification_budgetId_idx" ON "BudgetNotification"("budgetId");

-- CreateIndex
CREATE INDEX "BudgetNotification_status_idx" ON "BudgetNotification"("status");

-- CreateIndex
CREATE INDEX "BudgetNotification_createdAt_idx" ON "BudgetNotification"("createdAt");

-- AddForeignKey
ALTER TABLE "BudgetNotification" ADD CONSTRAINT "BudgetNotification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetNotification" ADD CONSTRAINT "BudgetNotification_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
