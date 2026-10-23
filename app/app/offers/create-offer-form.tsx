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
import { field } from "@/lib/ui/screen";

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
        className={field}
      />
      <select
        name="status"
        className={field}
        defaultValue="ACTIVE"
      >
        <option value="ACTIVE" className="bg-card">Ativa</option>
        <option value="PAUSED" className="bg-card">Pausada</option>
        <option value="DEAD" className="bg-card">Morta</option>
      </select>
      <select
        name="country"
        onChange={handleCountryChange}
        className={field}
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
        className={field}
      >
        {CURRENCY_OPTIONS.map((c) => (
          <option key={c.code} value={c.code} className="bg-card">
            {c.code}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="accent" className="h-10">
        Criar
      </Button>
    </form>
  );
}
