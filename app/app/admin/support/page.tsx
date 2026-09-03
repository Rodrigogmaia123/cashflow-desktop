import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isDesktopMode } from "@/lib/desktop";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LifeBuoy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OpsSupportPage() {
  if (isDesktopMode()) {
    redirect("/app/overview");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.isAdmin) {
    redirect("/app/overview");
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
          Suporte
        </h1>
        <p className="text-sm text-muted-foreground">
          Canal da operação com quem comprou a licença. Ainda não está no ar.
        </p>
      </div>

      <Card className="border-white/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Em breve</h2>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Aqui entra o atendimento da operação: pedidos de ajuda, serial e
            instalação. Por enquanto o painel cobre só licenças e métricas.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
