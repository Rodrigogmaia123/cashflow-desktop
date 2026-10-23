"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuickCapture } from "./quick-capture-provider";
import { cn } from "@/lib/utils";

export function QuickCaptureTrigger({
  variant = "sidebar"
}: {
  variant?: "sidebar" | "header";
}) {
  const { openCapture } = useQuickCapture();

  if (variant === "header") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={openCapture}
        className="h-10 w-10"
        aria-label="Captura rápida"
        title="Captura rápida (Ctrl+K)"
      >
        <Plus className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={openCapture}
      className={cn(
        "flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-sm font-medium",
        "bg-accent text-accent-foreground hover:bg-accent/90"
      )}
    >
      <span className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Lançar
      </span>
      <kbd className="hidden sm:inline font-mono text-[11px] opacity-65">
        Ctrl+K
      </kbd>
    </button>
  );
}
