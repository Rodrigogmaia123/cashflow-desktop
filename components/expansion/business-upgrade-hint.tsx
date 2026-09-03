"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Zap, ArrowRight } from "lucide-react";
import { BusinessUpgradeModal } from "./business-upgrade-modal";
import type { ExpansionTrigger } from "@/lib/expansion/triggers";
import { getBusinessCopyByTrigger } from "@/lib/conversion/business-copy";

interface BusinessUpgradeHintProps {
  trigger: ExpansionTrigger;
  context?: {
    workspacesCount?: number;
    monthlyTransactions?: number;
  };
  strength: "weak" | "medium" | "strong";
  recommendation: "show_hint" | "show_modal" | "show_banner";
}

/**
 * Sugestão discreta de upgrade para BUSINESS
 * Aparece como hint/banner não intrusivo
 */
export function BusinessUpgradeHint({
  trigger,
  context,
  strength,
  recommendation,
}: BusinessUpgradeHintProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const copy = getBusinessCopyByTrigger(trigger);

  if (recommendation === "show_modal") {
    // Se deveria mostrar modal, retorna null (modal será mostrado separadamente)
    return null;
  }

  const variant =
    recommendation === "show_banner" ? "banner" : "hint";

  return (
    <>
      {variant === "hint" ? (
        // Hint discreto (badge pequeno)
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 hover:border-primary/30 transition-colors">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-xs text-foreground">{copy.headline}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsModalOpen(true)}
            className="h-auto py-0 px-2 text-xs text-primary hover:text-primary/80"
          >
            Saiba mais <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      ) : (
        // Banner mais visível
        <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {copy.headline}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {copy.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {copy.benefits.slice(0, 2).map((benefit, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20"
                    >
                      <Users className="w-3 h-3 text-primary" />
                      <span className="text-xs text-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shrink-0"
                size="sm"
              >
                {copy.cta}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <BusinessUpgradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trigger={trigger}
        context={context}
      />
    </>
  );
}

