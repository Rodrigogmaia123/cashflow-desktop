const SERIAL_BODY_LENGTH = 16;
const SERIAL_WITH_PREFIX_LENGTH = SERIAL_BODY_LENGTH + 2;

export function formatSerialInput(input: string): string {
  let compact = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  while (
    compact.startsWith("CF") &&
    compact.length > SERIAL_WITH_PREFIX_LENGTH
  ) {
    compact = compact.slice(2);
  }
  if (compact.startsWith("CF")) compact = compact.slice(2);
  compact = compact.slice(0, SERIAL_BODY_LENGTH);
  const chunks = compact.match(/.{1,4}/g) ?? [];
  if (chunks.length === 0) return "CF-";
  return `CF-${chunks.join("-")}`;
}
