"use client";

import { useOnboarding } from "@/lib/onboarding/use-onboarding";
import { Button } from "@/components/ui/button";

type OnboardingTriggerProps = {
  className?: string;
};

export function OnboardingTrigger({ className }: OnboardingTriggerProps) {
  const { startTour } = useOnboarding({
    shouldStart: false
  });

  return (
    <Button
      onClick={startTour}
      variant="ghost"
      size="sm"
      className={className}
      title="Guia do Sistema"
    >
      <span className="mr-2">🎓</span>
      <span className="text-xs">Guia do Sistema</span>
    </Button>
  );
}
