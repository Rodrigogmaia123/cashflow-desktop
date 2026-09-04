"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createAdminLicense,
  getAdminLicenses,
  resendAdminLicenseEmail,
  revokeAdminLicense,
  type AdminLicenseRow,
} from "@/app/app/admin/licenses-actions";
import type { LicenseDuration, LicenseEdition } from "@/lib/prisma-enums";

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

function statusLabel(status: string) {
  switch (status) {
    case "paid":
      return "Paga";
    case "active":
      return "Ativa";
    case "revoked":
      return "Revogada";
    case "expired":
      return "Expirada";
    default:
      return status;
  }
}

function shortMachine(id: string | null) {
  if (!id) return "—";
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

const CREATE_EDITIONS = [
  { value: "pro", label: "Cashflow Pro" },
  { value: "pessoal", label: "Cashflow Pessoal" },
] as const;

const CREATE_DURATIONS: { value: LicenseDuration; label: string }[] = [
  { value: "1d", label: "1 dia (teste)" },
  { value: "3m", label: "3 meses" },
  { value: "5m", label: "5 meses" },
  { value: "annual", label: "12 meses" },
  { value: "lifetime", label: "Vitalício" },
];

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm";

export function AdminLicensesList({
  initialLicenses,
}: {
  initialLicenses: AdminLicenseRow[];
}) {
  const [licenses, setLicenses] = useState(initialLicenses);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<AdminLicenseRow | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createEdition, setCreateEdition] = useState<LicenseEdition>("pro");
  const [createDuration, setCreateDuration] = useState<LicenseDuration>("3m");
  const [createSendEmail, setCreateSendEmail] = useState(true);
  const [createdSerial, setCreatedSerial] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function refresh(filter?: string) {
    startTransition(async () => {
      const result = await getAdminLicenses(filter);
      if (result.success && result.data) {
        setLicenses(result.data);
        setMessage(null);
      } else {
        setMessage(result.reason ?? "Não foi possível carregar as licenças.");
      }
    });
  }

  function resend(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const result = await resendAdminLicenseEmail(id);
      setPendingId(null);
      if (result.success) {
        setMessage("E-mail reenviado com o mesmo serial.");
        refresh(query);
      } else {
        setMessage(result.reason ?? "Falha ao reenviar.");
      }
    });
  }

  function confirmRevoke() {
    if (!revokeTarget) return;
    const id = revokeTarget.id;
    setPendingId(id);
    startTransition(async () => {
      const result = await revokeAdminLicense(id, revokeReason);
      setPendingId(null);
      setRevokeTarget(null);
      setRevokeReason("");
      if (result.success) {
        setMessage("Chave revogada. Na próxima checagem o app fecha.");
        refresh(query);
      } else {
        setMessage(result.reason ?? "Falha ao revogar.");
      }
    });
  }

  function resetCreateForm() {
    setCreateEmail("");
    setCreateEdition("pro");
    setCreateDuration("3m");
    setCreateSendEmail(true);
  }

  function createKey() {
    startTransition(async () => {
      const result = await createAdminLicense({
        email: createEmail,
        edition: createEdition,
        duration: createDuration,
        sendEmail: createSendEmail,
      });
      if (!result.success || !result.serial) {
        setMessage(result.reason ?? "Não foi possível criar a chave.");
        return;
      }
      setCreatedSerial(result.serial);
      setCopied(false);
      setCreateOpen(false);
      resetCreateForm();
      setMessage(
        result.emailed
          ? "Chave criada e enviada por e-mail."
          : "Chave criada. Copie o serial — o e-mail não saiu."
      );
      refresh(query);
    });
  }

  async function copySerial() {
    if (!createdSerial) return;
    try {
      await navigator.clipboard.writeText(createdSerial);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            refresh(query);
          }}
        >
          <label className="flex-1 space-y-1 text-sm">
            <span className="text-muted-foreground">Buscar e-mail ou serial</span>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="cliente@email.com ou CF-XXXX-…"
            />
          </label>
          <Button type="submit" variant="outline" disabled={isPending}>
            Buscar
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => {
              resetCreateForm();
              setCreateOpen(true);
            }}
          >
            Criar chave
          </Button>
        </form>
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {licenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma licença desktop ainda.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-3 font-medium">E-mail</th>
                <th className="py-2 pr-3 font-medium">Edição / prazo</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Ativação</th>
                <th className="py-2 pr-3 font-medium">Máquina</th>
                <th className="py-2 pr-3 font-medium">Revogação</th>
                <th className="py-2 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((license) => (
                <tr key={license.id} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3">{license.email}</td>
                  <td className="py-2 pr-3">
                    {license.editionLabel}
                    <div className="text-xs text-muted-foreground">
                      {license.lifetime
                        ? "Vitalício"
                        : license.expiresAt
                          ? `Até ${formatWhen(license.expiresAt)}`
                          : license.durationLabel}
                    </div>
                  </td>
                  <td className="py-2 pr-3">{statusLabel(license.status)}</td>
                  <td className="py-2 pr-3">{formatWhen(license.activatedAt)}</td>
                  <td className="py-2 pr-3 font-mono text-xs" title={license.machineId ?? undefined}>
                    {shortMachine(license.machineId)}
                  </td>
                  <td className="py-2 pr-3">
                    {license.revokedAt ? (
                      <div className="text-xs leading-relaxed">
                        {formatWhen(license.revokedAt)}
                        {license.revokedByEmail ? (
                          <div className="text-muted-foreground">
                            {license.revokedByEmail}
                          </div>
                        ) : null}
                        {license.revokeReason ? (
                          <div className="text-muted-foreground">
                            {license.revokeReason}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 space-y-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending || pendingId === license.id || !license.issued}
                      onClick={() => resend(license.id)}
                    >
                      Reenviar e-mail
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={
                        isPending ||
                        pendingId === license.id ||
                        license.status === "revoked"
                      }
                      onClick={() => {
                        setRevokeReason("");
                        setRevokeTarget(license);
                      }}
                    >
                      Revogar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>

      <Dialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTarget(null);
            setRevokeReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revogar esta chave?</DialogTitle>
            <DialogDescription>
              {revokeTarget
                ? `O app de ${revokeTarget.email} fecha na próxima checagem. Vitalício também cai. O instalador sozinho não reabre.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Motivo (opcional)</span>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={revokeReason}
              onChange={(event) => setRevokeReason(event.target.value)}
              maxLength={500}
              placeholder="Vazou, reembolso, teste…"
            />
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevokeTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={confirmRevoke}
            >
              Revogar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) setCreateOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar chave</DialogTitle>
            <DialogDescription>
              Gera um serial agora. O prazo só começa quando o cliente ativa no
              app. Sem Stripe.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              createKey();
            }}
          >
            <label className="space-y-1 text-sm block">
              <span className="text-muted-foreground">E-mail do cliente</span>
              <input
                type="email"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={createEmail}
                onChange={(event) => setCreateEmail(event.target.value)}
                placeholder="cliente@email.com"
              />
            </label>
            <label className="space-y-1 text-sm block">
              <span className="text-muted-foreground">Edição</span>
              <select
                className={selectClass}
                value={createEdition}
                onChange={(event) =>
                  setCreateEdition(event.target.value as LicenseEdition)
                }
              >
                {CREATE_EDITIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm block">
              <span className="text-muted-foreground">Prazo</span>
              <select
                className={selectClass}
                value={createDuration}
                onChange={(event) =>
                  setCreateDuration(event.target.value as LicenseDuration)
                }
              >
                {CREATE_DURATIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={createSendEmail}
                onChange={(event) => setCreateSendEmail(event.target.checked)}
              />
              <span>Enviar o serial por e-mail</span>
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Gerando…" : "Gerar serial"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(createdSerial)}
        onOpenChange={(open) => {
          if (!open) {
            setCreatedSerial(null);
            setCopied(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Serial gerado</DialogTitle>
            <DialogDescription>
              Copie agora. Depois só dá para reenviar por e-mail — a lista não
              mostra a chave em texto.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-input bg-muted/40 px-3 py-3 font-mono text-sm break-all">
            {createdSerial}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={copySerial}>
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setCreatedSerial(null);
                setCopied(false);
              }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
