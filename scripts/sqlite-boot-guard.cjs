const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const KEEP_BACKUPS = 14;
const DB_NAME = "cashflow-desktop.db";

function isDesktopRuntime() {
  return (
    process.env.DESKTOP_MODE === "true" ||
    process.env.NEXT_PUBLIC_DESKTOP_MODE === "true"
  );
}

function toFileUrl(dbFile) {
  return "file:" + path.resolve(dbFile).replace(/\\/g, "/");
}

function dirWritable(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveDataDir(root) {
  if (isDesktopRuntime()) {
    const dir = path.join(root, "data");
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  const fromEnv = process.env.CASHFLOW_DATA_DIR?.trim();
  if (fromEnv) {
    const dir = path.resolve(fromEnv);
    if (dirWritable(dir)) return dir;
    console.error("[start] CASHFLOW_DATA_DIR não dá para gravar:", dir);
  }

  for (const candidate of ["/data/cashflow", "/var/lib/cashflow", "/app/data"]) {
    if (dirWritable(candidate)) return candidate;
  }

  const fallback = path.join(root, "data");
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

function listDbFiles(dir) {
  const files = [];
  if (!dir || !fs.existsSync(dir)) return files;
  const main = path.join(dir, DB_NAME);
  if (fs.existsSync(main) && fs.statSync(main).size > 0) files.push(main);
  const backupDir = path.join(dir, "backups");
  if (!fs.existsSync(backupDir)) return files;
  for (const name of fs.readdirSync(backupDir)) {
    if (!name.endsWith(".db")) continue;
    const full = path.join(backupDir, name);
    try {
      if (fs.statSync(full).size > 0) files.push(full);
    } catch {
      /* ignore */
    }
  }
  return files;
}

function candidateDirs(root, dataDir) {
  const dirs = new Set([
    dataDir,
    path.join(root, "data"),
    "/data/cashflow",
    "/var/lib/cashflow",
    "/app/data",
  ]);
  return [...dirs];
}

function dbRowCount(root, dbFile) {
  const url = toFileUrl(dbFile);
  const script = `
    const { PrismaClient } = require("@prisma/client");
    process.env.DATABASE_URL = ${JSON.stringify(url)};
    const prisma = new PrismaClient();
    Promise.all([
      prisma.license.count().catch(() => 0),
      prisma.user.count().catch(() => 0),
      prisma.licenseOrder.count().catch(() => 0),
    ])
      .then(([licenses, users, orders]) => {
        process.stdout.write(String(licenses + users + orders));
      })
      .catch(() => process.stdout.write("0"))
      .finally(() => prisma.$disconnect());
  `;
  const result = spawnSync(process.execPath, ["-e", script], {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    timeout: 20000,
  });
  const n = Number((result.stdout || "").trim());
  return Number.isFinite(n) ? n : 0;
}

function copySqlite(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  for (const extra of ["-wal", "-shm"]) {
    const src = from + extra;
    const dest = to + extra;
    if (fs.existsSync(src)) fs.copyFileSync(src, dest);
    else if (fs.existsSync(dest)) fs.unlinkSync(dest);
  }
}

function rotateBackups(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".db"))
    .map((name) => ({
      name,
      full: path.join(dir, name),
      mtime: fs.statSync(path.join(dir, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  for (const stale of files.slice(KEEP_BACKUPS)) {
    try {
      fs.unlinkSync(stale.full);
    } catch {
      /* ignore */
    }
  }
}

function backupPopulatedSqlite(dataDir, dbFile, rows) {
  if (rows <= 0 || !fs.existsSync(dbFile)) return false;
  const backupDir = path.join(dataDir, "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(backupDir, `cashflow-${stamp}.db`);
  copySqlite(dbFile, dest);
  rotateBackups(backupDir);
  console.log(`[start] backup SQLite: ${dest} (${rows} registros)`);
  return true;
}

function findRichestDb(root, dataDir) {
  const seen = new Set();
  let best = { file: null, rows: 0 };
  for (const dir of candidateDirs(root, dataDir)) {
    for (const file of listDbFiles(dir)) {
      const key = path.resolve(file);
      if (seen.has(key)) continue;
      seen.add(key);
      const rows = dbRowCount(root, file);
      console.log(`[start] candidato ${file}: ${rows} registros`);
      if (rows > best.rows) best = { file, rows };
    }
  }
  return best;
}

function prepareProductionSqlite(root) {
  const dataDir = resolveDataDir(root);
  const dbFile = path.join(dataDir, DB_NAME);
  const allowEmpty =
    process.env.ALLOW_EMPTY_SQLITE === "1" ||
    process.env.ALLOW_EMPTY_SQLITE === "true";

  console.log(`[start] pasta persistente do banco: ${dataDir}`);

  const richest = findRichestDb(root, dataDir);
  const mainRows = fs.existsSync(dbFile) ? dbRowCount(root, dbFile) : 0;

  if (richest.rows > mainRows && richest.file) {
    console.warn(
      `[start] o banco em uso estava vazio ou atrasado; restaurando ${richest.file} (${richest.rows} registros)`
    );
    copySqlite(richest.file, dbFile);
  }

  const rows = fs.existsSync(dbFile) ? dbRowCount(root, dbFile) : 0;
  if (rows > 0) {
    backupPopulatedSqlite(dataDir, dbFile, rows);
    return { dbFile, dataDir, initialized: true, rows };
  }

  if (!isDesktopRuntime() && !allowEmpty) {
    console.error(
      "[start] PRODUÇÃO RECUSOU SUBIR COM BANCO VAZIO. O deploy ia apagar licenças de novo."
    );
    console.error(
      "[start] Monte um volume em /data/cashflow (ou defina CASHFLOW_DATA_DIR) com o .db antigo."
    );
    console.error(
      "[start] Se for a primeira instalação de verdade, defina ALLOW_EMPTY_SQLITE=1 só uma vez."
    );
    process.exit(1);
  }

  return { dbFile, dataDir, initialized: false, rows: 0 };
}

module.exports = {
  toFileUrl,
  resolveDataDir,
  prepareProductionSqlite,
  dbRowCount,
};
