"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { QuickCaptureDialog } from "./quick-capture-dialog";

type QuickCaptureContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openCapture: () => void;
};

const QuickCaptureContext = createContext<QuickCaptureContextValue | null>(null);

export function useQuickCapture() {
  const ctx = useContext(QuickCaptureContext);
  if (!ctx) {
    throw new Error("useQuickCapture precisa estar dentro de QuickCaptureProvider");
  }
  return ctx;
}

export function QuickCaptureProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openCapture = useCallback(() => setOpen(true), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") return;
      if (event.repeat) return;
      event.preventDefault();
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <QuickCaptureContext.Provider value={{ open, setOpen, openCapture }}>
      {children}
      <QuickCaptureDialog open={open} onOpenChange={setOpen} />
    </QuickCaptureContext.Provider>
  );
}
