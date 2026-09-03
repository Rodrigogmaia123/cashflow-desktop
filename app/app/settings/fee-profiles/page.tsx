import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteFeeProfileModal } from "@/components/settings/delete-fee-profile-modal";
import {
  createFeeProfile,
  updateFeeProfile,
  deleteFeeProfile
} from "./actions";
import { CURRENCY_OPTIONS, formatMoney, type CurrencyCode } from "@/lib/domain/currency";

export const dynamic = "force-dynamic";

export default async function FeeProfilesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.activeWorkspaceId) {
    redirect("/app/workspaces?missing=1");
  }

  const [membership, feeProfiles, offersUsingProfiles] = await Promise.all([
    prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: user.activeWorkspaceId
        }
      }
    }),
    prisma.feeProfile.findMany({
      where: { workspaceId: user.activeWorkspaceId },
      orderBy: { createdAt: "asc" }
    }),
    prisma.offer.findMany({
      where: {
        workspaceId: user.activeWorkspaceId,
        feeProfileId: { not: null }
      },
      select: {
        id: true,
        name: true,
        feeProfileId: true
      }
    })
  ]);

  // OWNER tem todas as permissões (incluindo as de ADMIN)
  const isAdmin = membership?.role === "ADMIN" || membership?.role === "OWNER";
  const offersByProfileId = offersUsingProfiles.reduce(
    (acc, offer) => {
      if (!offer.feeProfileId) return acc;
      acc[offer.feeProfileId] ??= [];
      acc[offer.feeProfileId].push({ id: offer.id, name: offer.name });
      return acc;
    },
    {} as Record<string, { id: string; name: string }[]>
  );

  // Considera o primeiro perfil como "mais usado" se tiver mais ofertas
  const mostUsedProfileId = feeProfiles.length > 0 
    ? feeProfiles.reduce((max, p) => {
        const maxCount = offersByProfileId[max.id]?.length ?? 0;
        const currentCount = offersByProfileId[p.id]?.length ?? 0;
        return currentCount > maxCount ? p : max;
      }).id
    : null;

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
          Perfis de Taxas
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure diferentes perfis de taxas para o workspace atual. Cada
          oferta pode apontar para um desses perfis, garantindo que as taxas
          utilizadas fiquem claras e sejam consistentes ao longo do tempo.
        </p>
      </div>

      {!isAdmin && (
        <div className="rounded-xl border border-warning/30 bg-warning-soft/50 p-4">
          <p className="text-sm text-warning">
            Você não é administrador deste workspace. Apenas administradores podem
            criar, editar ou excluir perfis de taxas. Os valores abaixo são
            somente para consulta.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr),minmax(0,1.2fr)]">
        {/* Lista de Fee Profiles */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Perfis existentes
          </h2>
          {feeProfiles.length === 0 && (
            <Card className="border-white/5 bg-card-secondary/30">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum perfil de taxas cadastrado. Crie um perfil padrão para
                  começar.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {feeProfiles.map((profile, idx) => {
              const isMostUsed = profile.id === mostUsedProfileId && (offersByProfileId[profile.id]?.length ?? 0) > 0;
              const offersCount = offersByProfileId[profile.id]?.length ?? 0;
              
              return (
                <Card 
                  key={profile.id} 
                  className={`border-2 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                    isMostUsed
                      ? "border-[#A855F7]/30 bg-gradient-to-br from-[#A855F7]/10 via-[#A855F7]/5 to-transparent"
                      : "border-white/5 bg-card hover:bg-card-hover"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{profile.name}</h3>
                        {isMostUsed && (
                          <span className="rounded-full bg-[#A855F7]/20 px-2 py-0.5 text-[10px] font-medium text-[#A855F7] uppercase tracking-wider">
                            Mais Usado
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {profile.createdAt.toISOString().split("T")[0]}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]"></div>
                          <div className="text-[11px] text-muted-foreground">Checkout</div>
                        </div>
                        <div className="text-base font-semibold text-foreground">
                          {(profile.checkoutPercentage.toNumber() * 100).toFixed(2)}%
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]"></div>
                          <div className="text-[11px] text-muted-foreground">Gateway</div>
                        </div>
                        <div className="text-base font-semibold text-foreground">
                          {formatMoney(
                            profile.gatewayFeePerSale,
                            profile.currency as CurrencyCode
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {profile.currency}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]"></div>
                          <div className="text-[11px] text-muted-foreground">Imposto</div>
                        </div>
                        <div className="text-base font-semibold text-foreground">
                          {(profile.taxPercentage.toNumber() * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-card-secondary/30 px-3 py-2">
                      <p className="text-xs text-muted-foreground">
                        Em uso por{" "}
                        <span className="font-semibold text-foreground">
                          {offersCount}
                        </span>{" "}
                        {offersCount === 1 ? "oferta" : "ofertas"}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <form
                          action={updateFeeProfile}
                          className="grid gap-3 md:grid-cols-4"
                        >
                          <input type="hidden" name="id" value={profile.id} />
                          <Input
                            name="name"
                            defaultValue={profile.name}
                            placeholder="Nome do perfil"
                            className="col-span-2 rounded-xl border-0 bg-[#0F131A] text-sm focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50"
                            required
                          />
                          <select
                            name="currency"
                            defaultValue={profile.currency}
                            className="rounded-xl border-0 bg-[#0F131A] px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7]/50"
                          >
                            {CURRENCY_OPTIONS.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code}
                              </option>
                            ))}
                          </select>
                          <Input
                            name="checkoutPercentage"
                            type="number"
                            step="0.01"
                            min={0}
                            max={1}
                            defaultValue={profile.checkoutPercentage
                              .toNumber()
                              .toFixed(2)}
                            placeholder="0.10"
                            className="rounded-xl border-0 bg-[#0F131A] text-sm focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
                          />
                          <Input
                            name="gatewayFeePerSale"
                            type="number"
                            step="0.01"
                            min={0}
                            defaultValue={profile.gatewayFeePerSale.toFixed(2)}
                            placeholder="0.30"
                            className="rounded-xl border-0 bg-[#0F131A] text-sm focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50"
                          />
                          <Input
                            name="taxPercentage"
                            type="number"
                            step="0.01"
                            min={0}
                            max={1}
                            defaultValue={profile.taxPercentage
                              .toNumber()
                              .toFixed(2)}
                            placeholder="0.06"
                            className="rounded-xl border-0 bg-[#0F131A] text-sm focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50"
                          />
                          <div className="col-span-4 flex justify-end pt-1">
                            <Button 
                              type="submit" 
                              size="sm" 
                              variant="outline"
                              className="hover:bg-white/5 hover:border-[#8B5CF6]/30"
                            >
                              Salvar alterações
                            </Button>
                          </div>
                        </form>

                        <div className="flex justify-end">
                          <DeleteFeeProfileModal
                            profileId={profile.id}
                            profileName={profile.name}
                            offersInUse={offersByProfileId[profile.id] ?? []}
                            deleteAction={deleteFeeProfile}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Criação de novo Fee Profile */}
        <Card className="border-white/5 bg-card">
          <CardHeader className="pb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Novo Perfil de Taxas
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Crie um novo conjunto de taxas para ser usado por uma ou mais
              ofertas. Valores de percentual devem ser informados como fração
              (por exemplo, <code className="text-[#8B5CF6]">0.10</code> = 10%).
            </p>
            <form
              action={createFeeProfile}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Nome do perfil
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ex: Lançamento padrão, Black Friday..."
                  required
                  disabled={!isAdmin}
                  className="rounded-xl border-0 bg-[#0F131A] text-sm focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label
                    htmlFor="checkoutPercentage"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Checkout (% faturamento)
                  </label>
                  <Input
                    id="checkoutPercentage"
                    name="checkoutPercentage"
                    type="number"
                    step={0.01}
                    min={0}
                    max={1}
                    placeholder="0.10"
                    defaultValue={0.1}
                    required
                    disabled={!isAdmin}
                    className="rounded-xl border-0 bg-[#0F131A] text-sm focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Ex: 0.10 = 10%
                  </p>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="gatewayFeePerSale"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Gateway (valor fixo na moeda do perfil)
                  </label>
                  <Input
                    id="gatewayFeePerSale"
                    name="gatewayFeePerSale"
                    type="number"
                    step={0.01}
                    min={0}
                    placeholder="0.30"
                    defaultValue={0.3}
                    required
                    disabled={!isAdmin}
                    className="rounded-xl border-0 bg-[#0F131A] text-sm focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="currency"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Moeda do perfil
                </label>
                <select
                  id="currency"
                  name="currency"
                  defaultValue="BRL"
                  disabled={!isAdmin}
                  className="w-full rounded-xl border-0 bg-[#0F131A] px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="taxPercentage"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Imposto (% faturamento)
                </label>
                <Input
                  id="taxPercentage"
                  name="taxPercentage"
                  type="number"
                  step={0.01}
                  min={0}
                  max={1}
                  placeholder="0.06"
                  defaultValue={0.06}
                  required
                  disabled={!isAdmin}
                  className="rounded-xl border-0 bg-[#0F131A] text-sm focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Ex: 0.06 = 6%
                </p>
              </div>

              {isAdmin && (
                <Button 
                  type="submit" 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-[#8B5CF6] to-purple-600 hover:from-[#8B5CF6]/90 hover:to-purple-600/90"
                >
                  Criar perfil de taxas
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


