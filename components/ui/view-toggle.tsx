"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type ViewMode = "cards" | "spreadsheet";

export function ViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentView = (searchParams.get("viewMode") as ViewMode) || "cards";

  const setView = (view: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "cards") {
      params.delete("viewMode");
    } else {
      params.set("viewMode", view);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1 bg-card-secondary/30">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("cards")}
        className={`h-8 px-3 transition-all ${
          currentView === "cards"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <svg
          className="h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
        Cards
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("spreadsheet")}
        className={`h-8 px-3 transition-all ${
          currentView === "spreadsheet"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <svg
          className="h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        Planilha
      </Button>
    </div>
  );
}
