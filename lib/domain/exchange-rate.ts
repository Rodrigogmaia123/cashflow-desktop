import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import type { CurrencyCode } from "@/lib/domain/currency";

/**
 * Conversão pura: amount * rate.
 * rate = quantas unidades de toCurrency equivalem a 1 fromCurrency.
 */
export function convert(amount: Decimal, rate: Decimal): Decimal {
  return amount.mul(rate);
}

/**
 * Resolve a taxa de câmbio do workspace.
 * - from === to → 1
 * - busca par direto; se não houver, aceita o inverso (1 / rate)
 * - se nenhum existir → lança erro (não assume 1:1)
 */
export async function resolveExchangeRate(
  workspaceId: string,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<Decimal> {
  if (fromCurrency === toCurrency) {
    return new Decimal(1);
  }

  const direct = await prisma.exchangeRateConfig.findUnique({
    where: {
      workspaceId_fromCurrency_toCurrency: {
        workspaceId,
        fromCurrency,
        toCurrency
      }
    }
  });

  if (direct) {
    return direct.rate;
  }

  const inverse = await prisma.exchangeRateConfig.findUnique({
    where: {
      workspaceId_fromCurrency_toCurrency: {
        workspaceId,
        fromCurrency: toCurrency,
        toCurrency: fromCurrency
      }
    }
  });

  if (inverse) {
    if (inverse.rate.equals(0)) {
      throw new Error(
        `Taxa de câmbio inválida (zero) para ${toCurrency}→${fromCurrency}.`
      );
    }
    return new Decimal(1).div(inverse.rate);
  }

  throw new Error(
    `Taxa de câmbio não configurada para ${fromCurrency}→${toCurrency}. ` +
      `Configure o par (ou o inverso) em Configurações → Câmbio.`
  );
}
