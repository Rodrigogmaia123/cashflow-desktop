"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Check } from "lucide-react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics/events";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredPlan: "PRO" | "BUSINESS";
  feature: string;
  title: string;
  description: string;
  workspaceId?: string;
}

const PLAN_FEATURES: Record<"PRO" | "BUSINESS", string[]> = {
  PRO: [
    "Workspaces ilimitados",
    "Exportação PDF e Excel",
    "Categorias personalizadas",
    "Relatórios avançados",
    "Análise histórica ilimitada",
  ],
  BUSINESS: [
    "Tudo do PRO",
    "Acesso à API",
    "Multi-usuário ilimitado",
    "Controle de permissões",
    "Relatórios personalizados",
    "Suporte prioritário",
  ],
};

export function UpgradeModal({
  open,
  onOpenChange,
  requiredPlan,
  feature,
  title,
  description,
  workspaceId,
}: UpgradeModalProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleUpgrade = () => {
    trackEvent("business_upgrade_started", {
      feature,
      plan: requiredPlan,
      workspaceId,
    });
    setIsNavigating(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-center text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Incluído no plano {requiredPlan}:
            </p>
            <ul className="space-y-2">
              {PLAN_FEATURES[requiredPlan].map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isNavigating}
          >
            Cancelar
          </Button>
          <Button
            asChild
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            onClick={handleUpgrade}
            disabled={isNavigating}
          >
            <Link href="/app/billing">
              {isNavigating ? "Redirecionando..." : `Fazer Upgrade para ${requiredPlan}`}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
