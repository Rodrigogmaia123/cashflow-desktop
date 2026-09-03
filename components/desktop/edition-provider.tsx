"use client";

import { createContext, useContext } from "react";
import type { DesktopEdition } from "@/lib/desktop-edition";

const EditionContext = createContext<DesktopEdition>("pro");

export function EditionProvider({
  edition,
  children,
}: {
  edition: DesktopEdition;
  children: React.ReactNode;
}) {
  return <EditionContext.Provider value={edition}>{children}</EditionContext.Provider>;
}

export function useDesktopEdition() {
  return useContext(EditionContext);
}

export function usePersonalEdition() {
  return useDesktopEdition() === "pessoal";
}
