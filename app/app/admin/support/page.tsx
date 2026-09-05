import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isDesktopMode } from "@/lib/desktop";
import { AdminSupportDesk } from "@/components/admin/admin-support-desk";

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
          Um fio por e-mail de compra. Pro e Pessoal entram no mesmo chat.
          Encerrar guarda o histórico por 30 dias e depois apaga as mensagens.
        </p>
      </div>
      <AdminSupportDesk />
    </section>
  );
}
