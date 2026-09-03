"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { openBillingPortal } from "@/app/app/billing/actions";
import { useState } from "react";
import type { Plan } from "@/lib/billing/plans";
import type { AuthUser } from "@/lib/auth/types";

interface SubscriptionInfo {
  plan: Plan;
  isLifetime: boolean;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

interface BillingStatusProps {
  user: AuthUser;
  subscriptionInfo: SubscriptionInfo | null;
  currentPlanConfig: {
    id: Plan;
    name: string;
    description: string;
  };
}

export function BillingStatus({
  user,
  subscriptionInfo,
  currentPlanConfig,
}: BillingStatusProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    setError(null);

    const result = await openBillingPortal();

    if (result.success) {
      window.location.href = result.url;
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  };

  if (!subscriptionInfo) {
    return (
      <Card>
        <CardHeader>Status da assinatura</CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Carregando informações...
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>Status da assinatura</CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Plano atual</p>
              <p className="text-xs text-muted-foreground">
                {currentPlanConfig.name}
              </p>
            </div>
            {subscriptionInfo.isLifetime && (
              <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">
                Vitalício
              </span>
            )}
          </div>

          {subscriptionInfo.status === "active" && (
            <>
              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">
                    {subscriptionInfo.cancelAtPeriodEnd
                      ? "Cancelará ao final do período"
                      : "Ativa"}
                  </p>
                </div>
              </div>

              {subscriptionInfo.currentPeriodEnd && (
                <div className="flex items-center justify-between border-t border-white/5 pt-2">
                  <div>
                    <p className="text-sm font-medium">Próxima renovação</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(subscriptionInfo.currentPeriodEnd)}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {subscriptionInfo.status === "none" && user.plan === "FREE" && (
            <div className="flex items-center justify-between border-t border-white/5 pt-2">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-muted-foreground">
                  Plano gratuito ativo
                </p>
              </div>
            </div>
          )}
        </div>

        {!subscriptionInfo.isLifetime &&
          subscriptionInfo.status === "active" && (
            <div className="border-t border-white/5 pt-4">
              <Button
                onClick={handleManageSubscription}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? "Carregando..." : "Gerenciar assinatura"}
              </Button>
              {error && (
                <p className="mt-2 text-xs text-destructive">{error}</p>
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );
}

