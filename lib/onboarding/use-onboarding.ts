"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { getTourSteps } from "./tour-steps";
import { completeOnboarding } from "@/app/app/onboarding/actions";
import { useDesktopEdition } from "@/components/desktop/edition-provider";

export function useOnboarding(options: {
  shouldStart: boolean;
  onComplete?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const edition = useDesktopEdition();
  const [isInitialized, setIsInitialized] = useState(false);
  const driverRef = useRef<Driver | null>(null);

  const handleComplete = useCallback(async () => {
    const driverInstance = driverRef.current;
    if (driverInstance) {
      driverRef.current = null;
      driverInstance.destroy();
    }
    try {
      await completeOnboarding({ skip: false });
      // Refresh suave para atualizar o estado do usuário
      router.refresh();
      options.onComplete?.();
    } catch (error) {
      console.error("Erro ao completar onboarding:", error);
      // Mesmo com erro, destruir o driver
      if (driverInstance) {
        driverInstance.destroy();
      }
    }
  }, [options, router]);

  const handleSkip = useCallback(async () => {
    const driverInstance = driverRef.current;
    if (driverInstance) {
      driverRef.current = null;
      driverInstance.destroy();
    }
    try {
      await completeOnboarding({ skip: true });
      // Refresh suave para atualizar o estado do usuário
      router.refresh();
      options.onComplete?.();
    } catch (error) {
      console.error("Erro ao pular onboarding:", error);
      // Mesmo com erro, destruir o driver
      if (driverInstance) {
        driverInstance.destroy();
      }
    }
  }, [options, router]);

  const startTour = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    let isDestroying = false;
    let completedByButton = false;

    // Se o usuário já estiver na página de overview, filtrar o passo do link
    const isOnOverviewPage = pathname === "/app/overview";
    const baseSteps = getTourSteps(edition);
    const filteredSteps = isOnOverviewPage
      ? baseSteps.filter((step) => step.element !== "[data-tour='overview-link']")
      : baseSteps;

    const steps = filteredSteps.map((step, index) => {
      const isFirst = index === 0;
      const isLast = index === filteredSteps.length - 1;

      if (isFirst) {
        return {
          ...step,
          popover: {
            ...step.popover,
            buttons: [
              {
                text: "Pular",
                action: () => {
                  if (!isDestroying) {
                    isDestroying = true;
                    completedByButton = true;
                    handleSkip();
                  }
                }
              },
              {
                text: "Começar",
                action: () => {
                  if (driverRef.current) {
                    driverRef.current.moveNext();
                  }
                }
              }
            ]
          }
        };
      }

      if (isLast) {
        return {
          ...step,
          popover: {
            ...step.popover,
            buttons: [
              {
                text: "Finalizar",
                class: "driverjs-btn driverjs-btn-primary",
                action: () => {
                  if (!isDestroying) {
                    isDestroying = true;
                    completedByButton = true;
                    handleComplete();
                  }
                }
              }
            ]
          }
        };
      }

      return step;
    });

    driverRef.current = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      allowClose: true,
      overlayColor: "rgba(0, 0, 0, 0.75)",
      overlayOpacity: 0.75,
      smoothScroll: true,
      stagePadding: 16,
      stageRadius: 16,
      popoverClass: "driverjs-theme",
      popoverOffset: 20,
      allowKeyboardControl: true,
      disableActiveInteraction: false,
      steps: steps as any, // Type assertion: driver.js aceita "center" em runtime mesmo não sendo no tipo
      onHighlightStarted: (element, step, options) => {
        // Garantir que elementos dentro de containers com scroll sejam visíveis
        if (element) {
          const sidebar = element.closest("aside");
          if (sidebar) {
            const sidebarNav = sidebar.querySelector("nav");
            if (sidebarNav && element.closest("[data-tour='workspace-selector']")) {
              // Scroll até o rodapé da sidebar
              setTimeout(() => {
                sidebarNav.scrollTo({ top: sidebarNav.scrollHeight, behavior: "smooth" });
              }, 100);
            }
          }
          // Scroll do elemento para a viewport
          element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
      },
      onDestroyStarted: (element, step, options) => {
        // Se já estiver destruindo por ação de botão, não fazer nada
        if (isDestroying || completedByButton) {
          return;
        }

        // Se o usuário fechar pelo X em qualquer passo, marcar como pulado
        isDestroying = true;
        setTimeout(() => {
          handleSkip();
        }, 100);
      },
      onDestroyed: () => {
        // Garantir que o estado seja limpo
        driverRef.current = null;
      }
    });

    driverRef.current.drive();
  }, [edition, pathname, handleComplete, handleSkip]);

  useEffect(() => {
    if (!isInitialized && options.shouldStart) {
      const timer = setTimeout(() => {
        startTour();
        setIsInitialized(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [options.shouldStart, isInitialized, startTour]);

  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, []);

  return {
    startTour,
    skipTour: handleSkip
  };
}
