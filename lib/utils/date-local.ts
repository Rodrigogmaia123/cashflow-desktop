/**
 * Utilitários para trabalhar com datas locais (sem timezone)
 * 
 * Snapshots diários devem ser tratados como dias fixos (YYYY-MM-DD),
 * não como timestamps. Isso evita problemas de off-by-one-day.
 */

/**
 * Converte uma string de data (YYYY-MM-DD) para um Date local
 * Sem conversão de timezone - trata como data local pura
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formata uma data local para string (YYYY-MM-DD)
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formata uma data para exibição brasileira
 * Ex: "23 de dezembro de 2025"
 */
export function formatBrazilianDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

/**
 * Formata uma data para exibição curta
 * Ex: "23/12/2025"
 */
export function formatShortDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

