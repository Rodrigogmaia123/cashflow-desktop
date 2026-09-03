"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      // signOut do NextAuth limpa a sessão e redireciona
      await signOut({
        redirect: true,
        callbackUrl: "/login",
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Em caso de erro, forçar redirecionamento
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="w-full"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoggingOut ? "Saindo..." : "Sair da conta"}
    </Button>
  );
}

