import { config } from "dotenv";
import { ensureSqliteSchemaOnce } from "../lib/sqlite-schema-compat";
import { ensureAdminUserFromEnv } from "../lib/auth/ensure-admin-user";

config({ path: ".env" });
config({ path: ".env.local" });

async function main() {
  await ensureSqliteSchemaOnce();
  await ensureAdminUserFromEnv();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.error("ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios.");
    process.exit(1);
  }
  console.log("Admin garantido para", email);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
