import type { LicenseDuration, LicenseEdition } from "@/lib/prisma-enums";
import {
  isLicenseDuration,
  isLicenseEdition,
  LICENSE_DURATION_DAYS,
} from "./types";

export const DESKTOP_LICENSE_PRODUCT = "desktop-license";

export type LicenseOffer = {
  duration: LicenseDuration;
  label: string;
  sublabel: string;
  amountCents: number | null;
};

const DURATION_COPY: Record<
  LicenseDuration,
  { label: string; sublabel: string }
> = {
  "3m": {
    label: "3 meses",
    sublabel: "90 dias a partir da ativação",
  },
  "5m": {
    label: "5 meses",
    sublabel: "150 dias a partir da ativação",
  },
  annual: {
    label: "12 meses",
    sublabel: "365 dias a partir da ativação",
  },
  lifetime: {
    label: "Vitalício",
    sublabel: "Sem data de validade",
  },
};

const ENV_KEYS: Record<LicenseDuration, string> = {
  "3m": "LICENSE_PRICE_3M_CENTS",
  "5m": "LICENSE_PRICE_5M_CENTS",
  annual: "LICENSE_PRICE_ANNUAL_CENTS",
  lifetime: "LICENSE_PRICE_LIFETIME_CENTS",
};

const DEFAULT_PRICE_CENTS: Partial<Record<LicenseDuration, number>> = {
  "3m": 3000,
};

function parseCents(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export function licensePriceCents(duration: LicenseDuration): number | null {
  const key = ENV_KEYS[duration];
  const fromPublic = parseCents(process.env[`NEXT_PUBLIC_${key}`]);
  if (fromPublic != null) return fromPublic;
  const fromServer = parseCents(process.env[key]);
  if (fromServer != null) return fromServer;
  return DEFAULT_PRICE_CENTS[duration] ?? null;
}

export function listLicenseOffers(): LicenseOffer[] {
  return (Object.keys(DURATION_COPY) as LicenseDuration[]).map((duration) => ({
    duration,
    label: DURATION_COPY[duration].label,
    sublabel: DURATION_COPY[duration].sublabel,
    amountCents: licensePriceCents(duration),
  }));
}

export function getPricedLicenseOffer(
  edition: string,
  duration: string
): { edition: LicenseEdition; duration: LicenseDuration; amountCents: number; name: string; description: string } | null {
  if (!isLicenseEdition(edition) || !isLicenseDuration(duration)) return null;
  const amountCents = licensePriceCents(duration);
  if (amountCents == null) return null;
  const copy = DURATION_COPY[duration];
  const editionName = edition === "pessoal" ? "Cashflow Pessoal" : "Cashflow Pro";
  const days =
    duration === "lifetime"
      ? "O prazo começa quando você ativa o serial no app."
      : `Licença de ${LICENSE_DURATION_DAYS[duration]} dias. O prazo começa quando você ativa o serial no app.`;
  return {
    edition,
    duration,
    amountCents,
    name: `${editionName} — ${copy.label}`,
    description: days,
  };
}

export function formatLicensePrice(amountCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

export function editionLabel(edition: LicenseEdition): string {
  return edition === "pessoal" ? "Cashflow Pessoal" : "Cashflow Pro";
}

export function licenseDurationLabel(duration: LicenseDuration): string {
  return DURATION_COPY[duration].label;
}
