"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function GithubLoginButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    try {
      await signIn("github", {
        callbackUrl: "/app"
      });
    } finally {
      // Em caso de erro, o NextAuth pode redirecionar para /login com error
      setIsSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      className="w-full"
      onClick={handleClick}
      disabled={isSubmitting}
    >
      {isSubmitting ? "Redirecionando..." : "Entrar com GitHub"}
    </Button>
  );
}


