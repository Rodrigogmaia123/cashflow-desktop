"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CURRENCY_OPTIONS,
  suggestCurrencyFromCountry,
  type CurrencyCode
} from "@/lib/domain/currency";
import { OFFER_COUNTRY_OPTIONS, type OfferCountryCode } from "@/lib/domain/offer-country";
import { createOffer } from "./actions";

export function CreateOfferForm() {
  const router = useRouter();
  const [currency, setCurrency] = useState<CurrencyCode>("BRL");

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value as OfferCountryCode | "";
    if (code) {
      setCurrency(suggestCurrencyFromCountry(code));
    }
  };

  const handleSubmit = async (formData: FormData) => {
    formData.set("currency", currency);
    await createOffer(formData);
    router.refresh();
  };

  return (
    <form
      action={handleSubmit}
      className="grid gap-3 md:gap-4 text-sm grid-cols-1 md:grid-cols-[2fr,1fr,1fr,1fr,auto]"
      data-tour="create-offer-button"
    >
      <input
        name="name"
        required
        minLength={3}
        maxLength={120}
        placeholder="Nome da oferta (ex: Funil Webinar XYZ)"
        className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
      />
      <select
        name="status"
        className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
        defaultValue="ACTIVE"
      >
        <option value="ACTIVE" className="bg-card">Ativa</option>
        <option value="PAUSED" className="bg-card">Pausada</option>
        <option value="DEAD" className="bg-card">Morta</option>
      </select>
      <select
        name="country"
        onChange={handleCountryChange}
        className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
        defaultValue=""
      >
        <option value="" className="bg-card">Sem bandeira</option>
        {OFFER_COUNTRY_OPTIONS.map((country) => (
          <option key={country.code} value={country.code} className="bg-card">
            {country.flag} {country.label}
          </option>
        ))}
      </select>
      <select
        name="currency"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
      >
        {CURRENCY_OPTIONS.map((c) => (
          <option key={c.code} value={c.code} className="bg-card">
            {c.code}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 h-9 md:h-auto">
        Criar
      </Button>
    </form>
  );
}
