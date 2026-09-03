"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type View = "main" | "compare" | "heatmap";

type Props = {
  activeView: View;
};

const views: Array<{ id: View; label: string }> = [
  { id: "main", label: "Visão geral" },
  { id: "compare", label: "Comparação" },
  { id: "heatmap", label: "Heatmap" }
];

export function WorkspaceDashboardViewToggle({ activeView }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function go(view: View) {
    const sp = new URLSearchParams(searchParams?.toString());
    if (view === "main") {
      sp.delete("view");
    } else {
      sp.set("view", view);
    }
    router.push(`/app/dashboard?${sp.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {views.map((v) => (
        <Button
          key={v.id}
          type="button"
          size="sm"
          variant={activeView === v.id ? "default" : "outline"}
          onClick={() => go(v.id)}
          className="text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 h-8 md:h-9"
        >
          {v.label}
        </Button>
      ))}
    </div>
  );
}


