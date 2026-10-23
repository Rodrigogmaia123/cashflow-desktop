import { requireActiveWorkspaceId } from "@/lib/workspace";
import { listOffersWithMetrics, type OfferWithMetrics } from "./actions";
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
      <section className="space-y-4">
        <h1 className="sr-only">Ofertas</h1>

        {canCreate && (
          <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] px-4 py-4 md:px-5">
            <h2 className="mb-3 text-sm font-medium text-foreground">Criar nova oferta</h2>
            <CreateOfferForm />
          </div>
        )}

        {/* Lista de ofertas */}
        <OffersList
          offers={offers}
          canEdit={canEdit}
          canDelete={canDelete}
          workspaceId={workspaceId}
        />
        
        {/* Portal do menu de ações */}
        <OfferActionsMenuPortal />
      </section>
    </OfferActionsProvider>
  );
}
