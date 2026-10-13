const SPARSE_ACTIVE_RATIO = 0.7;

/**
 * Série com lançamentos isolados: a curva monotone passa pelo zero dos dias
 * vazios e desenha um pico em cada anotação.
 */
export function numericSeriesIsSparse(
  values: readonly (number | null | undefined)[]
): boolean {
  if (values.length < 4) return false;

  let active = 0;
  let maxGap = 0;
  let gap = 0;
  let seen = false;

  for (const raw of values) {
    const hasValue = typeof raw === "number" && raw !== 0;

    if (hasValue) {
      active += 1;
      if (seen && gap > maxGap) maxGap = gap;
      gap = 0;
      seen = true;
    } else if (seen) {
      gap += 1;
    }
  }

  if (active === 0) return false;
  if (active === 1) return true;

  return maxGap >= 1 && active / values.length < SPARSE_ACTIVE_RATIO;
}
