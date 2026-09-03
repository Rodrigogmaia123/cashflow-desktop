"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { selectWorkspace } from "@/app/app/workspaces/actions";
import { Button } from "@/components/ui/button";

type WorkspaceSelectorProps = {
  workspaces: Array<{ id: string; name: string }>;
  activeWorkspaceId: string | null;
};

export function WorkspaceSelector({ workspaces, activeWorkspaceId }: WorkspaceSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (workspaceId: string) => {
    if (workspaceId === activeWorkspaceId) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("workspaceId", workspaceId);
      try {
        await selectWorkspace(formData);
        router.refresh();
      } catch (error) {
        console.error("Erro ao trocar workspace:", error);
      }
    });
  };

  if (workspaces.length === 0) {
    return null;
  }

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <div className="space-y-2">
      <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Workspace
      </div>
      <div className="space-y-1">
        {workspaces.map((workspace) => {
          const isActive = workspace.id === activeWorkspaceId;
          return (
            <button
              key={workspace.id}
              onClick={() => handleSelect(workspace.id)}
              disabled={isPending || isActive}
              className={`group relative w-full rounded-xl px-3 py-2 text-left text-xs transition-all ${
                isActive
                  ? "bg-primary-soft text-primary font-medium shadow-sm"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              } ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{workspace.name}</span>
                {isActive && (
                  <div className="ml-2 h-2 w-2 rounded-full bg-primary shadow-lg shadow-primary/50" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
