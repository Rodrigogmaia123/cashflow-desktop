export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { ensureSqliteSchemaOnce } = await import("./lib/sqlite-schema-compat");
  await ensureSqliteSchemaOnce();
  try {
    const { ensureAdminUserFromEnv } = await import("./lib/auth/ensure-admin-user");
    await ensureAdminUserFromEnv();
  } catch (error) {
    console.error("[instrumentation] admin bootstrap falhou:", error);
  }
}
