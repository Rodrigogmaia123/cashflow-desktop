"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { UpgradeModal } from "./upgrade-modal";
import type { Plan } from "@/lib/billing/plans";
import { getLimitCopy } from "@/lib/conversion/copy";
import { trackLimitReached } from "@/lib/analytics/conversion";

interface LimitWarningProps {
  currentValue: number;
  limit: number;
  limitType: "workspaces" | "transactions" | "categories";
  requiredPlan: Plan;
  onUpgrade?: () => void;
  source?: string;
  currentPlan?: "FREE" | "PRO" | "BUSINESS";
  userId?: string;
}

// Removido - usando getLimitCopy agora

/**
 * Banner de aviso quando um limite está sendo atingido
 */
export function LimitWarning({
  currentValue,
  limit,
  limitType,
  requiredPlan,
  onUpgrade,
  source = "limit_warning",
  currentPlan = "FREE",
  userId,
}: LimitWarningProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const copy = getLimitCopy(limitType);

  const percentage = limit > 0 ? (currentValue / limit) * 100 : 0;
  const isAtLimit = limit > 0 && currentValue >= limit;
  const isNearLimit = limit > 0 && percentage >= 80;

  // Tracking quando limite é atingido
  useEffect(() => {
    if (isAtLimit) {
      trackLimitReached({
        limitType,
        currentValue,
        limitValue: limit,
        source,
        userId,
        plan: currentPlan,
      });
    }
  }, [isAtLimit, limitType, currentValue, limit, source, userId, currentPlan]);

  // Só mostra se estiver próximo ou no limite
  if (!isNearLimit && !isAtLimit) {
    return null;
  }

  const handleUpgradeClick = () => {
    onUpgrade?.();
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className={`border-2 ${isAtLimit ? "border-destructive/50 bg-destructive/5" : "border-warning/50 bg-warning/5"}`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${isAtLimit ? "bg-destructive/20" : "bg-warning/20"}`}>
              <AlertTriangle className={`w-5 h-5 ${isAtLimit ? "text-destructive" : "text-warning"}`} />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {copy.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {copy.description}
                </p>
                {copy.benefit && (
                  <p className="text-xs font-medium text-primary mt-2">
                    {copy.benefit}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {limitType === "workspaces" && `Workspaces: ${currentValue}`}
                    {limitType === "transactions" && `Lançamentos: ${currentValue}`}
                    {limitType === "categories" && `Categorias: ${currentValue}`}
                  </span>
                  <span className="text-muted-foreground">
                    Limite: {limit === 0 ? "0 (FREE)" : limit}
                  </span>
                </div>
                {limit > 0 && (
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isAtLimit ? "bg-destructive" : "bg-warning"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              <Button
                size="sm"
                onClick={handleUpgradeClick}
                className="mt-2 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {copy.cta}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {requiredPlan !== "FREE" && (
        <UpgradeModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          requiredPlan={requiredPlan as "PRO" | "BUSINESS"}
          feature={limitType}
          title={copy.title}
          description={copy.description}
        />
      )}
    </>
  );
}

