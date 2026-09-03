export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  try {
    const { ensureSqliteSchemaOnce } = await import("./lib/sqlite-schema-compat");
    await ensureSqliteSchemaOnce();
    const { ensureAdminUserFromEnv } = await import("./lib/auth/ensure-admin-user");
    await ensureAdminUserFromEnv();
  } catch (error) {
    console.error("[instrumentation] schema/admin bootstrap falhou:", error);
  }
}
