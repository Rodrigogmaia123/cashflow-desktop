import { DashboardPreview } from "./dashboard-preview";
import { CashflowPreview } from "./cashflow-preview";
import { OverviewPreview } from "./overview-preview";
import { OffersPreview } from "./offers-preview";

type MockupPageProps = {
  searchParams?: Promise<{
    type?: string;
  }>;
};

/**
 * Página de Preview dos Mockups
 * 
 * Use ?type=dashboard, ?type=cashflow, ?type=overview ou ?type=offers
 * para visualizar cada mockup individualmente para captura de screenshot.
 */
export default async function MockupsPage({ searchParams }: MockupPageProps) {
  const params = await searchParams;
  const type = params?.type || "dashboard";

  const renderMockup = () => {
    switch (type) {
      case "cashflow":
        return <CashflowPreview />;
      case "overview":
        return <OverviewPreview />;
      case "offers":
        return <OffersPreview />;
      case "dashboard":
      default:
        return <DashboardPreview />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderMockup()}
    </div>
  );
}

