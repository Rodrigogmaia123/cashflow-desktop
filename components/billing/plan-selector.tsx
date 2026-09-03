"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createCheckout } from "@/app/app/billing/actions";
import { useState } from "react";
import type { PlanConfig } from "@/lib/billing/config";
import type { Plan } from "@/lib/billing/plans";
import { Check } from "lucide-react";

interface PlanSelectorProps {
  currentPlan: Plan;
  isLifetime: boolean;
  plans: PlanConfig[];
}

export function PlanSelector({
  currentPlan,
  isLifetime,
  plans,
}: PlanSelectorProps) {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (plan: Plan) => {
    // Não permite selecionar FREE ou plano atual
    if (plan === "FREE" || plan === currentPlan) {
      return;
    }

    // Se é lifetime, não pode trocar
    if (isLifetime) {
      setError("Usuários com acesso vitalício não podem alterar o plano");
      return;
    }

    setLoadingPlan(plan);
    setError(null);

    const result = await createCheckout(plan);

    if (result.success) {
      window.location.href = result.url;
    } else {
      setError(result.error);
      setLoadingPlan(null);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount / 100);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlan;
        const isFree = plan.id === "FREE";
        const isPro = plan.id === "PRO";
        const isLoading = loadingPlan === plan.id;

        return (
          <Card
            key={plan.id}
            className={`relative ${
              isCurrent ? "ring-2 ring-primary" : ""
            } ${isPro ? "border-2 border-primary/50 shadow-lg shadow-primary/10" : ""}`}
          >
            {isPro && !isCurrent && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="rounded-full bg-gradient-to-r from-primary to-blue-500 px-4 py-1 text-xs font-semibold text-white shadow-md">
                  ⭐ Mais Popular
                </span>
              </div>
            )}
            {isCurrent && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Plano atual
                </span>
              </div>
            )}

            <CardHeader>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {plan.description}
                </p>
              </div>
              <div className="mt-4">
                {isFree ? (
                  <div className="text-2xl font-bold">Gratuito</div>
                ) : (
                  <div>
                    <span className="text-2xl font-bold">
                      {/* Usa displayPrice se disponível (preço dinâmico do Stripe), 
                          senão formata amount (fallback do config) */}
                      {plan.displayPrice || formatPrice(plan.amount)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {/* Usa displayInterval se disponível (dinâmico), senão usa "/mês" padrão */}
                      {plan.displayInterval || "/mês"}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {isLifetime && plan.id !== currentPlan ? (
                <Button disabled variant="outline" className="w-full">
                  Indisponível
                </Button>
              ) : isCurrent ? (
                <Button disabled variant="outline" className="w-full">
                  Plano atual
                </Button>
              ) : (
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isLoading || isFree}
                  variant={plan.id === "BUSINESS" || plan.id === "PRO" ? "default" : "outline"}
                  className={plan.id === "PRO" ? "w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90" : "w-full"}
                >
                  {isLoading
                    ? "Processando..."
                    : isFree
                    ? "Plano atual"
                    : "Assinar"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}

      {error && (
        <div className="col-span-full rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}

