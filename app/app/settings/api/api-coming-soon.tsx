"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Key, Construction, Sparkles } from "lucide-react";

interface ApiComingSoonProps {
  message?: string;
  workspaceId?: string;
}

export function ApiComingSoon({ message, workspaceId }: ApiComingSoonProps) {

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
            API Access
          </h1>
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
            <Construction className="h-3 w-3 mr-1" />
            Em desenvolvimento
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Estamos construindo uma API poderosa para integrações avançadas
        </p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">API em Desenvolvimento</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Esta funcionalidade estará disponível em breve
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <p className="text-sm text-foreground/80 leading-relaxed">
              {message}
            </p>
          )}

          <div className="rounded-lg border border-primary/20 bg-background/50 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">O que você pode esperar:</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-6 list-disc">
                  <li>Integração REST completa com autenticação segura</li>
                  <li>Acesso programático aos seus dados financeiros</li>
                  <li>Webhooks para eventos em tempo real</li>
                  <li>Documentação completa e exemplos de código</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              disabled
              className="flex-1 bg-muted text-muted-foreground cursor-not-allowed"
            >
              Disponível em breve
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Clientes Business serão notificados quando a API estiver disponível
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

