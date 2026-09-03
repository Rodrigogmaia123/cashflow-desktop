"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { acceptInviteAction } from "./actions";

interface AcceptInviteFormProps {
  token: string;
}

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("token", token);
      await acceptInviteAction(formData);
      // Redireciona após aceitar
      window.location.href = "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao aceitar convite");
      setIsAccepting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          onClick={handleAccept}
          disabled={isAccepting}
          className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
        >
          {isAccepting ? "Aceitando..." : "Aceitar Convite"}
        </Button>
      </div>
    </div>
  );
}

