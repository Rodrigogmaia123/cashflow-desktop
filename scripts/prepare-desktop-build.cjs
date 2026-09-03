const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");
const staticSrc = path.join(root, ".next", "static");
const publicSrc = path.join(root, "public");
const resources = path.join(root, "electron", "resources");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  if (process.platform === "win32") {
    try {
      execSync(
        `robocopy "${src}" "${dest}" /E /NFL /NDL /NJH /NJS /nc /ns /np`,
        { stdio: "pipe" }
      );
    } catch (error) {
      if (!error.status || error.status >= 8) {
        throw error;
      }
    }
    return;
  }
  fs.cpSync(src, dest, { recursive: true, force: true });
}

const serverJs = path.join(standalone, "server.js");
if (!fs.existsSync(standalone) || !fs.existsSync(serverJs)) {
  const nested = fs.existsSync(standalone)
    ? fs
        .readdirSync(standalone, { withFileTypes: true })
        .find(
          (entry) =>
            entry.isDirectory() &&
            fs.existsSync(path.join(standalone, entry.name, "server.js"))
        )
    : null;
  if (!nested) {
    throw new Error("next build não gerou .next/standalone. Rode npm run build antes.");
  }
}

fs.mkdirSync(path.join(standalone, ".next"), { recursive: true });
if (fs.existsSync(staticSrc)) {
  copyDir(staticSrc, path.join(standalone, ".next", "static"));
}
if (fs.existsSync(publicSrc)) {
  copyDir(publicSrc, path.join(standalone, "public"));
}

const prismaEngineSrc = path.join(root, "node_modules", ".prisma");
if (fs.existsSync(prismaEngineSrc)) {
  copyDir(prismaEngineSrc, path.join(standalone, "node_modules", ".prisma"));
}

const prismaClientSrc = path.join(root, "node_modules", "@prisma", "client");
if (fs.existsSync(prismaClientSrc)) {
  copyDir(prismaClientSrc, path.join(standalone, "node_modules", "@prisma", "client"));
}

for (const name of [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
  ".env.development",
  ".env.development.local",
]) {
  const file = path.join(standalone, name);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log("Removido do pacote:", name);
  }
}

const packServer = path.join(root, "dist", "pack-server");
if (fs.existsSync(packServer)) {
  fs.rmSync(packServer, { recursive: true, force: true });
}
fs.mkdirSync(packServer, { recursive: true });
copyDir(standalone, packServer);

const packedNm = path.join(packServer, "node_modules");
const stagedNm = path.join(packServer, "_node_modules");
if (fs.existsSync(packedNm)) {
  if (fs.existsSync(stagedNm)) {
    fs.rmSync(stagedNm, { recursive: true, force: true });
  }
  fs.renameSync(packedNm, stagedNm);
  console.log("node_modules preparado como _node_modules para o instalador");
}

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
  throw new Error("Falha ao gerar o banco vazio do instalador.");
}

console.log("Pacote desktop preparado (sem dados pessoais).");
