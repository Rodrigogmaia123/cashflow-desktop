const fs = require("fs");
const path = require("path");

const KEEP_BACKUPS = 14;

function resolveSqliteFile(root, databaseUrl) {
  const fallback = path.join(root, "data", "cashflow-desktop.db");
  const raw = (databaseUrl || "").replace(/^file:/, "").trim();
  if (!raw) return fallback;
  if (path.isAbsolute(raw) || /^[A-Za-z]:[\\/]/.test(raw)) return raw;
  return path.resolve(root, raw);
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

function backupExistingSqlite(root, dbFile) {
  if (!fs.existsSync(dbFile)) return false;
  const size = fs.statSync(dbFile).size;
  if (size <= 0) return false;

  const backupDir = path.join(root, "data", "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(backupDir, `cashflow-${stamp}.db`);
  fs.copyFileSync(dbFile, dest);
  for (const extra of ["-wal", "-shm"]) {
    const sidecar = dbFile + extra;
    if (fs.existsSync(sidecar)) {
      fs.copyFileSync(sidecar, dest + extra);
    }
  }
  rotateBackups(backupDir);
  console.log(`[start] backup SQLite: ${dest} (${size} bytes)`);
  return true;
}

function sqliteAlreadyInitialized(dbFile) {
  if (!fs.existsSync(dbFile)) return false;
  return fs.statSync(dbFile).size > 0;
}

module.exports = {
  resolveSqliteFile,
  backupExistingSqlite,
  sqliteAlreadyInitialized,
};
