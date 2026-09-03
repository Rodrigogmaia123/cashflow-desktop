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
        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
        "text-foreground bg-white/5 hover:bg-white/10 border border-white/5"
      )}
    >
      <span className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Lançar
      </span>
      <kbd className="hidden sm:inline rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
        Ctrl+K
      </kbd>
    </button>
  );
}
