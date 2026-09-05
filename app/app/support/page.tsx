import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isDesktopMode } from "@/lib/desktop";
import { CustomerSupportDesk } from "@/components/support/customer-support-desk";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!isDesktopMode()) {
    redirect("/app/overview");
  }

  return (
    <section className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
          Suporte
        </h1>
        <p className="text-sm text-muted-foreground">
          Conversa direta com a operação. Sem internet o programa continua; as
          mensagens sobem quando conectar, como a confirmação da chave.
        </p>
      </div>
      <CustomerSupportDesk />
    </section>
  );
}
