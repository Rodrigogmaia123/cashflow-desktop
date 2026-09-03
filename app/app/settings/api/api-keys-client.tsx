"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createApiKeyAction, revokeApiKeyAction } from "./actions";
import { Key, Copy, Trash2, Plus, Check } from "lucide-react";
// Toast simples usando alert/confirm por enquanto
const toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`),
};

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

interface ApiKeysClientProps {
  initialKeys: ApiKey[];
}

export function ApiKeysClient({ initialKeys }: ApiKeysClientProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [isCreating, setIsCreating] = useState(false);
  const [newKey, setNewKey] = useState<{ key: string; id: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async (formData: FormData) => {
    setIsCreating(true);
    try {
      const result = await createApiKeyAction(formData);
      if (result.success && result.key) {
        setNewKey({ key: result.key, id: result.id });
        // Atualiza a lista localmente sem recarregar a página
        // A key completa só aparece uma vez, então não adicionamos à lista ainda
        // O usuário precisa fechar o modal primeiro
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Tem certeza que deseja revogar esta API key? Ela não poderá ser usada novamente.")) {
      return;
    }

    const formData = new FormData();
    formData.append("id", id);

    try {
      await revokeApiKeyAction(formData);
      setKeys(keys.filter((k) => k.id !== id));
      toast.success("API key revogada com sucesso");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao revogar API key");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copiado para a área de transferência");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Nova Key Modal */}
      {newKey && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Nova API Key Criada</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>Importante:</strong> Esta é a única vez que você verá esta chave completa.
              Salve-a em um local seguro.
            </p>
            <div className="rounded-lg border-2 border-primary/30 bg-background p-4">
              <div className="flex items-start gap-2 mb-2">
                <code className="flex-1 text-xs font-mono break-all select-all bg-background/50 p-2 rounded">
                  {newKey.key}
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                Clique no código acima para selecionar, ou use o botão "Copiar Key" abaixo
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setNewKey(null);
                  // Recarrega apenas após o usuário fechar o modal
                  window.location.reload();
                }}
                variant="outline"
                className="flex-1"
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  handleCopy(newKey.key, newKey.id);
                }}
                className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                {copiedId === newKey.id ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Key
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário criar key */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Criar Nova API Key</h3>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Nome da Key
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Ex: Produção, Desenvolvimento, Integração XYZ"
                className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <Button type="submit" disabled={isCreating} className="w-full">
              {isCreating ? (
                "Criando..."
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar API Key
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de keys */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Suas API Keys</h3>
        {keys.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma API key criada ainda
            </CardContent>
          </Card>
        ) : (
          keys.map((key) => (
            <Card key={key.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{key.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Key: <code className="bg-background px-1.5 py-0.5 rounded">{key.keyPrefix}...</code></p>
                      <p>
                        Criada em: {new Date(key.createdAt).toLocaleDateString("pt-BR")}
                        {key.lastUsedAt && (
                          <> • Último uso: {new Date(key.lastUsedAt).toLocaleDateString("pt-BR")}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(key.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Documentação básica */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <h3 className="font-semibold">Documentação da API</h3>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Use sua API key no header <code className="bg-background px-1.5 py-0.5 rounded">Authorization: Bearer YOUR_KEY</code>
          </p>
          <p>
            Endpoint base: <code className="bg-background px-1.5 py-0.5 rounded">{process.env.NEXT_PUBLIC_APP_URL || "https://app.cashflowpro.com"}/api/v1</code>
          </p>
          <p className="pt-2">
            <a href="/docs/api" className="text-primary hover:underline">
              Ver documentação completa →
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

