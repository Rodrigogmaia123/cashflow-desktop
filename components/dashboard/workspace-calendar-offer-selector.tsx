"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type WorkspaceCalendarOfferSelectorProps = {
  offers: Array<{ id: string; name: string }>;
  selectedOfferId?: string;
  offerQuery: string;
};

export function WorkspaceCalendarOfferSelector({
  offers,
  selectedOfferId,
  offerQuery
}: WorkspaceCalendarOfferSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (offerId: string) => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    if (offerId) {
      sp.set("offerId", offerId);
    } else {
      sp.delete("offerId");
    }
    sp.set("view", "heatmap");
    router.push(`/app/dashboard?${sp.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs font-medium text-muted-foreground">
        Filtrar oferta:
      </label>
      <select
        value={selectedOfferId || ""}
        onChange={(e) => handleChange(e.target.value)}
        className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">Todas as ofertas</option>
        {offers.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      {selectedOfferId && (
        <Link
          href={`/app/dashboard?view=heatmap&${offerQuery}`}
          className="text-xs text-primary hover:underline"
        >
          Limpar filtro
        </Link>
      )}
    </div>
  );
}

