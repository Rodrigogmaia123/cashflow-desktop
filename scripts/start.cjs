const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const desktop =
  process.env.DESKTOP_MODE === "true" ||
  process.env.NEXT_PUBLIC_DESKTOP_MODE === "true";

const host = desktop ? "127.0.0.1" : "0.0.0.0";
const port = desktop ? "3456" : String(process.env.PORT || "3000");

process.env.HOSTNAME = host;
process.env.HOST = host;
process.env.PORT = port;

fs.mkdirSync(path.join(root, "data"), { recursive: true });
const dbFile = path.join(root, "data", "cashflow-desktop.db").replace(/\\/g, "/");
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("file:")) {
  process.env.DATABASE_URL = `file:${dbFile}`;
} else if (process.env.DATABASE_URL.includes("../data/cashflow-desktop.db")) {
  process.env.DATABASE_URL = `file:${dbFile}`;
}

function prismaCli() {
  const unix = path.join(root, "node_modules", ".bin", "prisma");
  const win = path.join(root, "node_modules", ".bin", "prisma.cmd");
  if (process.platform === "win32" && fs.existsSync(win)) return win;
  return unix;
}

const push = spawnSync(
  prismaCli(),
  ["db", "push", "--skip-generate"],
  { stdio: "inherit", env: process.env, shell: process.platform === "win32" }
);
if (push.status !== 0) {
  console.error("[start] prisma db push falhou; o SQLite pode estar vazio.");
}

function findStandaloneDir(dir) {
  if (!fs.existsSync(dir)) return null;
  if (fs.existsSync(path.join(dir, "server.js"))) return dir;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const found = findStandaloneDir(path.join(dir, entry.name));
    if (found) return found;
  }
  return null;
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true, force: true });
}

const standaloneDir = findStandaloneDir(path.join(root, ".next", "standalone"));

if (!desktop && standaloneDir) {
  fs.mkdirSync(path.join(standaloneDir, ".next"), { recursive: true });
  copyDir(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"));
  copyDir(path.join(root, "public"), path.join(standaloneDir, "public"));
  copyDir(
    path.join(root, "node_modules", ".prisma"),
    path.join(standaloneDir, "node_modules", ".prisma")
  );
  copyDir(
    path.join(root, "node_modules", "@prisma"),
    path.join(standaloneDir, "node_modules", "@prisma")
  );

  const child = spawn(process.execPath, ["server.js"], {
    cwd: standaloneDir,
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code) => process.exit(code ?? 1));
} else {
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "start", "-H", host, "-p", port], {
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code) => process.exit(code ?? 1));
}
