import { requireActiveWorkspaceId } from "@/lib/workspace";
import { listOffersWithMetrics, type OfferWithMetrics } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserWorkspaceRole } from "@/lib/rbac/workspace-permissions";
import { hasPermission } from "@/lib/rbac/permissions";
import { CreateOfferForm } from "./create-offer-form";
import { OffersList } from "./offers-list";
import { OfferActionsProvider } from "@/components/offers/offer-actions-context";
import { OfferActionsMenuPortal } from "@/components/offers/offer-actions-menu-portal";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const workspaceId = await requireActiveWorkspaceId();
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  const userRole = await getUserWorkspaceRole(workspaceId);
  const canCreate = userRole ? hasPermission(userRole, "create") : false;
  const canEdit = userRole ? hasPermission(userRole, "edit") : false;
  const canDelete = userRole ? hasPermission(userRole, "delete") : false;
  
  const offers = await listOffersWithMetrics();

  return (
    <OfferActionsProvider>
      <section className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
            Ofertas
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Radar de performance das suas ofertas digitais.
          </p>
        </div>

        {/* Formulário criar oferta */}
        {canCreate && (
          <Card className="transition-all hover:shadow-lg hover:-translate-y-0.5">
            <CardContent className="pt-4 md:pt-6 px-4 md:px-6">
              <h2 className="text-xs md:text-sm font-semibold mb-4 md:mb-6 text-foreground">Criar nova oferta</h2>
              <CreateOfferForm />
            </CardContent>
          </Card>
        )}

        {/* Lista de ofertas */}
        <OffersList offers={offers} canEdit={canEdit} canDelete={canDelete} />
        
        {/* Portal do menu de ações */}
        <OfferActionsMenuPortal />
      </section>
    </OfferActionsProvider>
  );
}
