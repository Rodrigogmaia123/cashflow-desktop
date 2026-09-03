import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { checkFeatureAccess } from "@/lib/plans/authorization";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, CheckCircle, Zap } from "lucide-react";
import { FeatureLock } from "@/components/plans/feature-lock";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const featureCheck = await checkFeatureAccess("priority_support");
  const isBusiness = user.plan === "BUSINESS";

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
            Suporte
          </h1>
          {isBusiness && (
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <Zap className="h-3 w-3 mr-1" />
              Prioritário
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {isBusiness
            ? "Receba atendimento prioritário com resposta garantida"
            : "Entre em contato com nossa equipe de suporte"}
        </p>
      </div>

      {!isBusiness && (
        <FeatureLock
          feature="priority_support"
          requiredPlan="BUSINESS"
          title="Suporte Prioritário"
          description="Receba atendimento prioritário com resposta garantida em até 2 horas durante horário comercial."
          workspaceId={user.activeWorkspaceId || undefined}
        />
      )}

      {isBusiness && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">SLA Garantido</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-primary">2 horas</p>
                <p className="text-sm text-muted-foreground">
                  Tempo de resposta garantido durante horário comercial (9h-18h, seg-sex)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Canal Exclusivo</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Acesso direto à equipe técnica sem fila de espera
                </p>
                <p className="text-sm text-muted-foreground">
                  Suporte via email prioritário e chat dedicado
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="font-semibold">Enviar Solicitação</h3>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-2">
                Assunto
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                placeholder="Descreva brevemente sua solicitação"
                className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Mensagem
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                placeholder="Descreva seu problema ou dúvida em detalhes..."
                className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              Enviar Solicitação
            </Button>
            {isBusiness && (
              <p className="text-xs text-center text-muted-foreground">
                Você receberá uma resposta em até 2 horas durante horário comercial
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

