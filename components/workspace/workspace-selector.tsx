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
    <div className="space-y-1">
      <div className="px-2 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
        Workspace
      </div>
      <div className="space-y-0.5">
        {workspaces.map((workspace) => {
          const isActive = workspace.id === activeWorkspaceId;
          return (
            <button
              key={workspace.id}
              onClick={() => handleSelect(workspace.id)}
              disabled={isPending || isActive}
              className={`group relative w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                isActive
                  ? "bg-popover text-foreground"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              } ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{workspace.name}</span>
                {isActive && (
                  <div className="ml-2 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
