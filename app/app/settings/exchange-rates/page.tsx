import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CURRENCY_OPTIONS, formatMoney } from "@/lib/domain/currency";
import { Decimal } from "@prisma/client/runtime/library";
import {
  upsertExchangeRate,
  deleteExchangeRate
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ExchangeRatesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.activeWorkspaceId) {
    redirect("/app/workspaces?missing=1");
  }

  const [membership, workspace, rates] = await Promise.all([
    prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: user.activeWorkspaceId
        }
      }
    }),
    prisma.workspace.findUnique({
      where: { id: user.activeWorkspaceId },
      select: { baseCurrency: true, name: true }
    }),
    prisma.exchangeRateConfig.findMany({
      where: { workspaceId: user.activeWorkspaceId },
      orderBy: [{ fromCurrency: "asc" }, { toCurrency: "asc" }]
    })
  ]);

  const isAdmin = membership?.role === "ADMIN" || membership?.role === "OWNER";
  const baseCurrency = workspace?.baseCurrency ?? "BRL";

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
          Taxas de câmbio
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure as taxas usadas ao lançar performances em moeda diferente da
          base do workspace ({baseCurrency}). A taxa resolvida no momento do
          lançamento fica gravada (snapshot) e não muda se você editar a config
          depois. Pares inversos também são aceitos automaticamente.
        </p>
      </div>

      {!isAdmin && (
        <div className="rounded-xl border border-warning/30 bg-warning-soft/50 p-4">
          <p className="text-sm text-warning">
            Apenas administradores podem alterar taxas de câmbio. Os valores
            abaixo são somente leitura.
          </p>
        </div>
      )}

      <Card className="max-w-2xl border-white/5 bg-card">
        <CardContent className="p-6 space-y-6">
          {isAdmin && (
            <form action={upsertExchangeRate} className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">De</label>
                <select
                  name="fromCurrency"
                  required
                  className="w-full rounded-xl border-0 bg-[#0F131A] px-3 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  defaultValue="USD"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code} className="bg-card">
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Para</label>
                <select
                  name="toCurrency"
                  required
                  className="w-full rounded-xl border-0 bg-[#0F131A] px-3 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  defaultValue={baseCurrency}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code} className="bg-card">
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Taxa (1 de = N para)
                </label>
                <input
                  name="rate"
                  type="number"
                  step="any"
                  min="0.00000001"
                  required
                  placeholder="ex: 5.20"
                  className="w-full rounded-xl border-0 bg-[#0F131A] px-3 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" size="sm" className="w-full">
                  Salvar
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Pares configurados</h2>
            {rates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma taxa cadastrada. Ofertas na moeda base ({baseCurrency})
                não precisam de câmbio.
              </p>
            ) : (
              <ul className="divide-y divide-white/5 rounded-xl border border-white/5">
                {rates.map((rate) => (
                  <li
                    key={rate.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <span className="font-medium text-foreground">
                        1 {rate.fromCurrency} = {rate.rate.toString()}{" "}
                        {rate.toCurrency}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Ex.:{" "}
                        {formatMoney(new Decimal(1), rate.fromCurrency)} ≈{" "}
                        {formatMoney(rate.rate, rate.toCurrency)}
                      </p>
                    </div>
                    {isAdmin && (
                      <form action={deleteExchangeRate}>
                        <input type="hidden" name="id" value={rate.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          Excluir
                        </Button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
