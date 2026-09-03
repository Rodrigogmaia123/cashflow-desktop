"use client";

import { useOnboarding } from "@/lib/onboarding/use-onboarding";

type OnboardingProviderProps = {
  shouldStart: boolean;
  children: React.ReactNode;
};

export function OnboardingProvider({ shouldStart, children }: OnboardingProviderProps) {
  useOnboarding({
    shouldStart,
    onComplete: () => {
      // Tour completado
    }
  });

  return <>{children}</>;
}
