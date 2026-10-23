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
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-foreground">Suporte</h1>
        <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
          Conversa direta com a operação. Sem internet o programa continua; as mensagens sobem quando conectar, como a confirmação da chave.
        </p>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.7fr)]">
        <CustomerSupportDesk />
        <aside className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-5">
          <h2 className="font-display text-base font-semibold">Como funciona</h2>
          <div className="mt-4 space-y-4 text-sm text-[#9ca9a1]">
            <p><span className="block font-medium text-foreground">Funciona offline.</span> O programa continua sem internet. Suas mensagens ficam na fila.</p>
            <p><span className="block font-medium text-foreground">Sobem ao reconectar.</span> Assim que a conexão volta, a fila é enviada, como a confirmação da chave.</p>
            <p><span className="block font-medium text-foreground">Atendimento identificado.</span> A conversa usa o e-mail da sua conta.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
