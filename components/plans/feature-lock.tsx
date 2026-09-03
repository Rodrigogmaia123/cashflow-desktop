"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics/events";

interface FeatureLockProps {
  feature: string;
  requiredPlan: "PRO" | "BUSINESS";
  title: string;
  description: string;
  workspaceId?: string;
}

export function FeatureLock({
  feature,
  requiredPlan,
  title,
  description,
  workspaceId,
}: FeatureLockProps) {
  const handleUpgradeClick = () => {
    trackEvent("business_feature_locked", {
      feature,
      plan: requiredPlan,
      workspaceId,
    });
  };

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span>Disponível no plano {requiredPlan}</span>
        </div>
        <Button
          asChild
          className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          onClick={handleUpgradeClick}
        >
          <Link href="/app/billing">
            Fazer Upgrade para {requiredPlan}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
