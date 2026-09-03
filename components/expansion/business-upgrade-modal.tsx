"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createCheckout } from "@/app/app/billing/actions";
import { TrendingUp, Check, Sparkles, Zap, Users, Code } from "lucide-react";
import type { ExpansionTrigger } from "@/lib/expansion/triggers";
import { getBusinessCopyByTrigger, generateBusinessMessage } from "@/lib/conversion/business-copy";
import { trackUpgradeModalOpened, trackCheckoutStarted } from "@/lib/analytics/conversion";
import { getAnnualPlanConfig, formatMonthlyEquivalent } from "@/lib/billing/annual";

interface BusinessUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: ExpansionTrigger;
  context?: {
    workspacesCount?: number;
    monthlyTransactions?: number;
  };
}

/**
 * Modal contextual para upgrade PRO → BUSINESS
 * Aparece apenas quando faz sentido (baseado em gatilhos)
 */
export function BusinessUpgradeModal({
  isOpen,
  onClose,
  trigger,
  context,
}: BusinessUpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("year"); // Default anual

  const copy = getBusinessCopyByTrigger(trigger);
  const message = generateBusinessMessage(copy, context);
  const annualConfig = getAnnualPlanConfig("BUSINESS");

  // Tracking quando modal abre
  useEffect(() => {
    if (isOpen) {
      trackUpgradeModalOpened({
        feature: "business_upgrade",
        source: `expansion_${trigger}`,
        plan: "PRO",
        targetPlan: "BUSINESS",
      });
    }
  }, [isOpen, trigger]);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    // Tracking de checkout iniciado
    trackCheckoutStarted({
      targetPlan: "BUSINESS",
      source: `business_modal_${trigger}`,
      plan: "PRO",
    });

    try {
      // TODO: Implementar checkout anual quando disponível
      // Por enquanto usa mensal
      const result = await createCheckout("BUSINESS");

      if (result.success && result.url) {
        window.location.href = result.url;
      } else if (!result.success) {
        setError(result.error || "Erro ao iniciar checkout");
        setLoading(false);
      } else {
        setError("Erro ao iniciar checkout");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setLoading(false);
    }
  };

  const monthlyPrice = annualConfig.monthlyPrice;
  const annualPrice = annualConfig.annualPrice;
  const monthlyEquivalent = annualConfig.monthlyEquivalent;
  const savings = annualConfig.savingsAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 border-2 border-primary/20 shadow-2xl">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
            {copy.title}
          </h2>
          <p className="text-sm text-muted-foreground">{copy.headline}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            {message}
          </p>

          {/* Benefícios principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {copy.benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-primary/10"
              >
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Seleção de intervalo de cobrança */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setBillingInterval("month")}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  billingInterval === "month"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/30 hover:border-primary/50"
                }`}
              >
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground">
                    Mensal
                  </div>
                  <div className="text-lg font-bold text-foreground mt-1">
                    R$ {(monthlyPrice / 100).toFixed(2).replace(".", ",")}/mês
                  </div>
                </div>
              </button>

              <button
                onClick={() => setBillingInterval("year")}
                className={`flex-1 p-3 rounded-lg border-2 transition-all relative ${
                  billingInterval === "year"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/30 hover:border-primary/50"
                }`}
              >
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  2 meses grátis
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground">
                    Anual
                  </div>
                  <div className="text-lg font-bold text-foreground mt-1">
                    R$ {(monthlyEquivalent / 100).toFixed(2).replace(".", ",")}/mês
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    R$ {(annualPrice / 100).toFixed(2).replace(".", ",")}/ano
                  </div>
                  <div className="text-xs text-primary font-medium mt-1">
                    Economize R$ {(savings / 100).toFixed(2).replace(".", ",")}/ano
                  </div>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Talvez depois
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-lg shadow-primary/25"
              disabled={loading}
              size="lg"
            >
              {loading ? "Processando..." : copy.cta}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

