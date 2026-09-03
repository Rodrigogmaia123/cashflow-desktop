/**
 * Utilitários para normalização de datas em cálculos de período
 * Garante que comparações de data sejam feitas apenas na parte da data (sem horas)
 */

/**
 * Normaliza uma data para o início do dia (00:00:00)
 * Útil para comparações de período que devem incluir o dia inteiro
 */
export function normalizeDateToStart(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Normaliza uma data para o fim do dia (23:59:59.999)
 * Útil para incluir o dia atual completo em comparações
 */
export function normalizeDateToEnd(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Calcula a data de N dias atrás a partir de hoje
 * Retorna a data normalizada para início do dia
 */
export function getDateNDaysAgo(days: number, fromDate?: Date): Date {
  const base = fromDate ? new Date(fromDate) : new Date();
  const result = new Date(base);
  result.setDate(result.getDate() - days);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Verifica se uma data está dentro de um período (inclusive)
 * Todas as datas são normalizadas para comparação correta
 */
export function isDateInPeriod(
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean {
  const normalizedDate = normalizeDateToStart(date);
  const normalizedStart = normalizeDateToStart(startDate);
  const normalizedEnd = normalizeDateToEnd(endDate);
  
  return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
}

/**
 * Filtra um array de objetos com propriedade 'date' por período
 */
export function filterByPeriod<T extends { date: Date | string }>(
  items: T[],
  startDate: Date | string,
  endDate: Date | string
): T[] {
  return items.filter((item) => isDateInPeriod(item.date, startDate, endDate));
}

