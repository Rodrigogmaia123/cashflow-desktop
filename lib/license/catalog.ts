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
  "1d": {
    label: "1 dia",
    sublabel: "Só para teste interno — 24h a partir da ativação",
  },
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
    sublabel: "12 meses a partir da ativação",
  },
  lifetime: {
    label: "Vitalício",
    sublabel: "Sem data de validade",
  },
};

const ENV_KEYS: Record<LicenseDuration, string> = {
  "1d": "LICENSE_PRICE_1D_CENTS",
  "3m": "LICENSE_PRICE_3M_CENTS",
  "5m": "LICENSE_PRICE_5M_CENTS",
  annual: "LICENSE_PRICE_ANNUAL_CENTS",
  lifetime: "LICENSE_PRICE_LIFETIME_CENTS",
};

/**
 * 3 meses permanece em R$ 30 só para cumprir pagamento e licença já vendidos.
 * A vitrine pública não oferece esse prazo.
 * 12 meses e vitalício são a oferta V2. Env ainda sobrescreve, se existir.
 */
const DEFAULT_PRICE_CENTS: Partial<Record<LicenseDuration, number>> = {
  "3m": 3000,
  annual: 9700,
  lifetime: 14700,
};

const SELLABLE_DURATIONS = ["annual", "lifetime"] as const satisfies readonly LicenseDuration[];

function envDisabled(raw: string | undefined): boolean {
  if (raw == null || raw.trim() === "") return false;
  return ["0", "false", "off", "no"].includes(raw.trim().toLowerCase());
}

/** Desliga o vitalício na LP e no checkout com LICENSE_LIFETIME_ENABLED=false. */
export function lifetimeOfferEnabled(): boolean {
  if (envDisabled(process.env.LICENSE_LIFETIME_ENABLED)) return false;
  if (envDisabled(process.env.NEXT_PUBLIC_LICENSE_LIFETIME_ENABLED)) return false;
  return true;
}

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
  return (Object.keys(DURATION_COPY) as LicenseDuration[])
    .filter((duration) => duration !== "1d")
    .map((duration) => ({
    duration,
    label: DURATION_COPY[duration].label,
    sublabel: DURATION_COPY[duration].sublabel,
    amountCents: licensePriceCents(duration),
  }));
}

/** Planos que a LP e o checkout público podem vender. Pro only. */
export function listSellableLicenseOffers(): LicenseOffer[] {
  return SELLABLE_DURATIONS.filter((duration) => {
    if (duration === "lifetime" && !lifetimeOfferEnabled()) return false;
    return licensePriceCents(duration) != null;
  }).map((duration) => ({
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
      ? "Licença sem data de validade. O acesso começa quando você ativa o serial no app."
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

/** Oferta nova da LP. Licença antiga (3 meses, Pessoal) continua em getPricedLicenseOffer. */
export function getSellableLicenseOffer(
  edition: string,
  duration: string
) {
  if (edition !== "pro") return null;
  if (!SELLABLE_DURATIONS.includes(duration as (typeof SELLABLE_DURATIONS)[number])) {
    return null;
  }
  if (duration === "lifetime" && !lifetimeOfferEnabled()) return null;
  return getPricedLicenseOffer(edition, duration);
}

export function editionLabel(edition: LicenseEdition): string {
  return edition === "pessoal" ? "Cashflow Pessoal" : "Cashflow Pro";
}

export function licenseDurationLabel(duration: LicenseDuration): string {
  return DURATION_COPY[duration].label;
}
