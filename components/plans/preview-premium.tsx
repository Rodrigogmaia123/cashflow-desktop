"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Eye, TrendingUp } from "lucide-react";
import { UpgradeModal } from "./upgrade-modal";
import { trackPreviewViewed } from "@/lib/analytics/conversion";
import { getFeatureCopy, type ConversionCopy } from "@/lib/conversion/copy";
import type { Feature } from "@/lib/plans/features";
import type { Plan } from "@/lib/billing/plans";

interface PreviewPremiumProps {
  feature: Feature;
  requiredPlan: Plan;
  children: React.ReactNode;
  previewType?: "blur" | "watermark" | "summary";
  summary?: {
    label: string;
    value: string;
  }[];
  currentPlan?: "FREE" | "PRO" | "BUSINESS";
  source?: string;
}

/**
 * Componente que mostra preview de conteúdo premium com bloqueio elegante
 */
export function PreviewPremium({
  feature,
  requiredPlan,
  children,
  previewType = "blur",
  summary,
  currentPlan = "FREE",
  source = "preview",
}: PreviewPremiumProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const copy = getFeatureCopy(feature);

  const handleUnlockClick = () => {
    trackPreviewViewed({
      feature,
      source,
      plan: currentPlan,
    });
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="relative group">
        {/* Conteúdo com efeito de preview */}
        <div
          className={`relative ${
            previewType === "blur"
              ? "blur-sm opacity-60"
              : previewType === "watermark"
              ? "opacity-70"
              : "opacity-80"
          } pointer-events-none select-none transition-all`}
        >
          {previewType === "watermark" && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(139, 92, 246, 0.1) 10px,
                  rgba(139, 92, 246, 0.1) 20px
                )`,
              }}
            >
              <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/20">
                <Lock className="w-6 h-6 text-primary/50 mx-auto" />
              </div>
            </div>
          )}
          {children}
        </div>

        {/* Overlay interativo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-center space-y-4 p-6 max-w-sm">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {copy.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {copy.description}
              </p>
              {summary && summary.length > 0 && (
                <div className="space-y-1 mb-4 text-left">
                  {summary.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}:</span>
                      <span className="text-foreground font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                onClick={handleUnlockClick}
                className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {copy.cta}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {requiredPlan !== "FREE" && (
        <UpgradeModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          requiredPlan={requiredPlan as "PRO" | "BUSINESS"}
          feature={feature}
          title={copy.title}
          description={copy.description}
        />
      )}
    </>
  );
}

/**
 * Componente para mostrar resumo com CTA de upgrade
 */
export function PreviewSummary({
  feature,
  requiredPlan,
  summary,
  currentPlan = "FREE",
  source = "summary",
}: {
  feature: Feature;
  requiredPlan: Plan;
  summary: { label: string; value: string }[];
  currentPlan?: "FREE" | "PRO" | "BUSINESS";
  source?: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const copy = getFeatureCopy(feature);

  return (
    <>
      <Card className="border-2 border-primary/20 relative overflow-hidden">
        {/* Gradiente de fundo sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 pointer-events-none" />

        <CardContent className="pt-6 relative">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {copy.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {copy.description}
                </p>
              </div>
              <Lock className="w-5 h-5 text-primary/50 flex-shrink-0" />
            </div>

            {/* Resumo dos dados */}
            <div className="space-y-2">
              {summary.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-2 border-b border-border/50 last:border-0"
                >
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
              size="sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {copy.cta}
            </Button>
          </div>
        </CardContent>
      </Card>

      {requiredPlan !== "FREE" && (
        <UpgradeModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          requiredPlan={requiredPlan as "PRO" | "BUSINESS"}
          feature={feature}
          title={copy.title}
          description={copy.description}
        />
      )}
    </>
  );
}

