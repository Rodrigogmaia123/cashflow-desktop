const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const resources = path.join(root, "electron", "resources");
fs.mkdirSync(resources, { recursive: true });

const emptyDb = path.join(resources, "empty.db");
for (const leftover of ["empty.db", "empty.db-journal", "empty.db-wal", "empty.db-shm"]) {
  const file = path.join(resources, leftover);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

const emptyUrl = "file:" + emptyDb.replace(/\\/g, "/");
execSync("npx prisma db push --skip-generate --accept-data-loss", {
  cwd: root,
  env: {
    ...process.env,
    DATABASE_URL: emptyUrl,
  },
  stdio: "inherit",
});

if (!fs.existsSync(emptyDb)) {
  throw new Error("Falha ao gerar o banco vazio.");
}

console.log("Banco vazio pronto para o build (sem dados pessoais).");
