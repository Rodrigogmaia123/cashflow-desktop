export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { ensureSqliteSchemaOnce } = await import("./lib/sqlite-schema-compat");
  await ensureSqliteSchemaOnce();
}
