type Bucket = number[];

const buckets = new Map<string, Bucket>();

export function allowSupportRate(
  key: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const next = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (next.length >= max) {
    buckets.set(key, next);
    return false;
  }
  next.push(now);
  buckets.set(key, next);
  return true;
}
