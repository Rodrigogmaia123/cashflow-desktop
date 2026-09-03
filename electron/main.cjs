const { app, BrowserWindow, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");
const http = require("http");
const net = require("net");

const HOST = "127.0.0.1";
const ROOT = path.join(__dirname, "..");

try {
  require("dotenv").config({ path: path.join(ROOT, ".env") });
} catch {
  // sem dotenv no instalador empacotado
}

let PORT = process.env.CASHFLOW_DESKTOP_PORT || "3456";
let nextProcess = null;
let mainWindow = null;
let startedNext = false;

function isPackaged() {
  return app.isPackaged;
}

function desktopEdition() {
  if (isPackaged()) {
    const file = path.join(process.resourcesPath, "edition.json");
    if (fs.existsSync(file)) {
      try {
        const data = JSON.parse(fs.readFileSync(file, "utf8"));
        if (data && data.edition === "pessoal") return "pessoal";
      } catch {
        // instalador Pro não traz esse arquivo
      }
    }
    return "pro";
  }
  const fromEnv = (process.env.DESKTOP_EDITION || "").trim().toLowerCase();
  return fromEnv === "pessoal" ? "pessoal" : "pro";
}

function productName() {
  return desktopEdition() === "pessoal" ? "Cashflow Pessoal" : "Cashflow Pro";
}

function findFreePort(preferred) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => {
      const fallback = net.createServer();
      fallback.unref();
      fallback.listen(0, HOST, () => {
        const address = fallback.address();
        fallback.close(() => resolve(String(address.port)));
      });
    });
    server.listen(Number(preferred), HOST, () => {
      const address = server.address();
      server.close(() => resolve(String(address.port)));
    });
  });
}

function canWriteDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, ".write-test");
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

function copyDbFiles(fromDb, toDb) {
  fs.mkdirSync(path.dirname(toDb), { recursive: true });
  fs.copyFileSync(fromDb, toDb);
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    const from = fromDb + suffix;
    if (fs.existsSync(from)) fs.copyFileSync(from, toDb + suffix);
  }
}

function persistentDataDir() {
  return path.join(app.getPath("appData"), productName());
}

function exeDir() {
  return path.dirname(app.getPath("exe"));
}

function localDataDir() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return path.join(process.env.PORTABLE_EXECUTABLE_DIR, "data");
  }
  return path.join(exeDir(), "data");
}

function isProtectedInstallDir(dir) {
  const n = path.normalize(dir).toLowerCase();
  const prefixes = [
    process.env.ProgramFiles,
    process.env["ProgramFiles(x86)"],
    process.env.ProgramW6432,
    path.join(process.env.LOCALAPPDATA || "", "Programs"),
  ]
    .filter(Boolean)
    .map((p) => path.normalize(p).toLowerCase());
  return prefixes.some((p) => n === p || n.startsWith(p + path.sep));
}

function shouldKeepDataNextToExe() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) return true;
  if (fs.existsSync(path.join(exeDir(), ".portable"))) return true;
  if (isProtectedInstallDir(exeDir())) return false;
  return canWriteDir(localDataDir());
}

let cachedDataDir = null;

function dataDir() {
  if (cachedDataDir) return cachedDataDir;

  if (!isPackaged()) {
    cachedDataDir = path.join(ROOT, "data");
    return cachedDataDir;
  }

  cachedDataDir = shouldKeepDataNextToExe()
    ? localDataDir()
    : persistentDataDir();
  return cachedDataDir;
}

function applyPortableUserData() {
  if (!isPackaged() || !shouldKeepDataNextToExe()) return;
  const profile = path.join(dataDir(), "profile");
  fs.mkdirSync(profile, { recursive: true });
  app.setPath("userData", profile);
}

function dbSize(file) {
  try {
    return fs.statSync(file).size;
  } catch {
    return 0;
  }
}

function emptyTemplatePath() {
  return path.join(process.resourcesPath, "empty.db");
}

function sqliteCount(file, table) {
  try {
    const { DatabaseSync } = require("node:sqlite");
    const db = new DatabaseSync(file, { readOnly: true });
    try {
      const row = db.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get();
      return Number(row && row.n ? row.n : 0);
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

function looksLikeEmptyTemplate(file) {
  const size = dbSize(file);
  if (size <= 0) return true;

  const live = ["SpendPlan", "Expense", "Offer", "DailyPerformance", "ManualIncome"].reduce(
    (sum, table) => {
      const n = sqliteCount(file, table);
      return n == null ? sum : sum + n;
    },
    0
  );
  if (live > 0) return false;

  const template = emptyTemplatePath();
  const emptySize = fs.existsSync(template) ? dbSize(template) : 491520;
  // Uma página SQLite (~4 KB) acima do template ainda pode ser banco virgem.
  // Acima disso não substitui: o template futuro pode crescer, o dado do usuário não.
  return size <= emptySize + 4096;
}

function snapshotDb(file, reason) {
  if (!fs.existsSync(file) || dbSize(file) <= 0) return;
  const dir = path.join(path.dirname(file), "backups");
  try {
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dest = path.join(dir, `cashflow-desktop.${reason}.${stamp}.db`);
    copyDbFiles(file, dest);
    const kept = fs
      .readdirSync(dir)
      .filter((name) => name.startsWith("cashflow-desktop.") && name.endsWith(".db"))
      .map((name) => ({ name, mtime: fs.statSync(path.join(dir, name)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    for (const extra of kept.slice(12)) {
      try {
        fs.unlinkSync(path.join(dir, extra.name));
      } catch {
        // ignore
      }
    }
  } catch {
    // backup não pode impedir o app de abrir
  }
}

function uniqueExistingFiles(files, exclude) {
  const seen = new Set();
  const result = [];
  const excludeNorm = exclude ? path.normalize(exclude).toLowerCase() : "";
  for (const file of files) {
    if (!file || !fs.existsSync(file)) continue;
    const norm = path.normalize(file);
    const key = norm.toLowerCase();
    if (key === excludeNorm || seen.has(key)) continue;
    seen.add(key);
    result.push(norm);
  }
  return result;
}

function candidateDbPaths(dest) {
  const exeDir = path.dirname(app.getPath("exe"));
  const roaming = app.getPath("appData");
  const home = app.getPath("home");
  const localAppData =
    process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
  const names = [
    productName(),
    "Cashflow Pro",
    "Cashflow Pessoal",
    "cashflow-pro",
    "cashflow-pessoal",
  ];
  const files = [
    path.join(exeDir, "data", "cashflow-desktop.db"),
    path.join(exeDir, "cashflow-desktop.db"),
    path.join(path.dirname(exeDir), "data", "cashflow-desktop.db"),
    path.join(localAppData, "Programs", "Cashflow Pro", "data", "cashflow-desktop.db"),
    path.join(localAppData, "Programs", "Cashflow Pessoal", "data", "cashflow-desktop.db"),
    path.join(localAppData, "CashflowInstallBackup", "cashflow-desktop.db"),
    path.join(localAppData, "CashflowInstallBackup", "cashflow-desktop.last.db"),
    path.join("D:", "cashflow", "Cashflow Pro", "data", "cashflow-desktop.db"),
    path.join("D:", "cashflow", "Cashflow Pessoal", "data", "cashflow-desktop.db"),
    path.join(home, "Desktop", "cashflow-desktop.db"),
    path.join(home, "Documents", "cashflow-desktop.db"),
  ];
  for (const name of names) {
    files.push(path.join(roaming, name, "cashflow-desktop.db"));
    files.push(path.join(localAppData, name, "cashflow-desktop.db"));
    files.push(
      path.join(localAppData, "Programs", name, "data", "cashflow-desktop.db")
    );
    const backupDir = path.join(roaming, name, "backups");
    if (fs.existsSync(backupDir)) {
      try {
        for (const entry of fs.readdirSync(backupDir)) {
          if (entry.endsWith(".db") && entry.startsWith("cashflow-desktop.")) {
            files.push(path.join(backupDir, entry));
          }
        }
      } catch {
        // ignore
      }
    }
  }
  return uniqueExistingFiles(files, dest);
}

function bestCandidateDb(dest) {
  const candidates = candidateDbPaths(dest);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const sizeDiff = dbSize(b) - dbSize(a);
    if (sizeDiff !== 0) return sizeDiff;
    return fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs;
  });
  return candidates[0];
}

function logMigrate(dir, message) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(
      path.join(dir, "data-migrate.log"),
      `${new Date().toISOString()} ${message}${os.EOL}`
    );
  } catch {
    // ignore
  }
}

function ensurePackagedDatabase(dest) {
  const dir = path.dirname(dest);
  snapshotDb(dest, "startup");

  const best = bestCandidateDb(dest);
  const bestSize = best ? dbSize(best) : 0;
  const destSize = dbSize(dest);
  const destEmpty = looksLikeEmptyTemplate(dest);
  const bestUseful = Boolean(best && bestSize > 0 && !looksLikeEmptyTemplate(best));

  if (!fs.existsSync(dest)) {
    if (bestUseful) {
      copyDbFiles(best, dest);
      logMigrate(dir, `copied ${best} -> ${dest} (${bestSize} bytes)`);
      return;
    }
    const template = emptyTemplatePath();
    if (template && fs.existsSync(template)) {
      fs.copyFileSync(template, dest);
      logMigrate(dir, `seeded empty template -> ${dest}`);
    }
    return;
  }

  // Nunca substitui banco com lançamento/projeto. Só preenche template vazio.
  if (bestUseful && destEmpty && bestSize > destSize) {
    snapshotDb(dest, "pre-replace");
    copyDbFiles(dest, `${dest}.empty-bak`);
    copyDbFiles(best, dest);
    logMigrate(
      dir,
      `replaced empty ${dest} (${destSize}) with ${best} (${bestSize})`
    );
  }
}

function sqliteUrl() {
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, "cashflow-desktop.db");

  if (isPackaged()) {
    ensurePackagedDatabase(dest);
  }

  return "file:" + dest.replace(/\\/g, "/");
}

function desktopEnv() {
  const licenseApi =
    process.env.LICENSE_API_BASE_URL ||
    process.env.NEXT_PUBLIC_LICENSE_API_BASE_URL ||
    "";

  const env = {
    ...process.env,
    DATABASE_URL: sqliteUrl(),
    DESKTOP_MODE: "true",
    NEXT_PUBLIC_DESKTOP_MODE: "true",
    DESKTOP_EDITION: desktopEdition(),
    CASHFLOW_PACKAGED: isPackaged() ? "true" : "false",
    LICENSE_API_BASE_URL: licenseApi,
    NEXT_PUBLIC_LICENSE_API_BASE_URL: licenseApi,
    LICENSE_GRACE_DAYS: process.env.LICENSE_GRACE_DAYS || "7",
    NEXTAUTH_URL: `http://${HOST}:${PORT}`,
    NEXT_PUBLIC_APP_URL: `http://${HOST}:${PORT}`,
    PORT: String(PORT),
    HOSTNAME: HOST,
    BROWSER: "none",
  };

  if (process.env.NEXTAUTH_SECRET) {
    env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
  } else if (isPackaged()) {
    env.NEXTAUTH_SECRET = "cashflow-desktop-local-secret";
  }

  if (isPackaged()) {
    delete env.DESKTOP_USER_EMAIL;
    delete env.SOURCE_DATABASE_URL;
    delete env.DATABASE_URL;
    env.DATABASE_URL = sqliteUrl();
  }

  return env;
}

function findServerJs(dir) {
  const direct = path.join(dir, "server.js");
  if (fs.existsSync(direct)) return { cwd: dir, file: direct };

  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const nested = path.join(dir, entry.name, "server.js");
    if (fs.existsSync(nested)) {
      return { cwd: path.join(dir, entry.name), file: nested };
    }
  }
  return null;
}

function resolveNodeBin() {
  const name = process.platform === "win32" ? "node.exe" : "node";
  const pathDirs = String(process.env.PATH || "").split(path.delimiter);
  for (const dir of pathDirs) {
    const candidate = path.join(dir, name);
    if (dir && fs.existsSync(candidate)) return candidate;
  }
  return name;
}

function logPath() {
  return path.join(dataDir(), "server.log");
}

function readLogTail() {
  try {
    const text = fs.readFileSync(logPath(), "utf8").trim();
    return text.slice(-1200);
  } catch {
    return "";
  }
}

function httpReady(port = PORT, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: HOST, port: Number(port), path: "/", timeout: timeoutMs },
      (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

function isDesktopServer(port) {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: HOST, port: Number(port), path: "/login", timeout: 2500 },
      (res) => {
        res.resume();
        const location = String(res.headers.location || "");
        resolve(
          res.statusCode >= 300 &&
            res.statusCode < 400 &&
            location.includes("/app/")
        );
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

function isServerUp() {
  return httpReady(PORT, 2000);
}

async function findExistingDesktopServer() {
  const ports = [...new Set([String(PORT), "3456", "3457", "3000"])];
  for (const port of ports) {
    if (!(await httpReady(port, 2000))) continue;
    if (await isDesktopServer(port)) return port;
  }
  return null;
}

function desktopDistDir() {
  return path.join(ROOT, ".next-desktop");
}

function clearStaleNextLock() {
  const lockFile = path.join(desktopDistDir(), "dev", "lock");
  try {
    if (fs.existsSync(lockFile)) fs.rmSync(lockFile, { force: true });
  } catch {
    // lock em uso por outro Next desktop
  }
}

function waitForServer(timeoutMs = 180000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    let settled = false;

    const fail = (message) => {
      if (settled) return;
      settled = true;
      const tail = readLogTail();
      reject(new Error(tail ? message + "\n\n" + tail : message));
    };

    const onExit = (code) => {
      fail(
        "O Next.js fechou antes de ficar pronto (código " +
          String(code) +
          "). Feche outros npm run dev / Cashflow e tente de novo."
      );
    };
    if (nextProcess) nextProcess.once("exit", onExit);

    const ping = async () => {
      if (settled) return;
      if (Date.now() - started > timeoutMs) {
        if (nextProcess) nextProcess.off("exit", onExit);
        fail(
          "O servidor local do Cashflow não iniciou a tempo. Feche outros Cashflow/Next e tente de novo."
        );
        return;
      }

      const ok = await httpReady(PORT, 8000);
      if (ok) {
        if (nextProcess) nextProcess.off("exit", onExit);
        settled = true;
        resolve();
        return;
      }
      setTimeout(ping, 700);
    };

    ping();
  });
}

function ensureServerNodeModules(serverCwd) {
  const nm = path.join(serverCwd, "node_modules");
  const staged = path.join(serverCwd, "_node_modules");
  if (fs.existsSync(nm)) return;
  if (!fs.existsSync(staged)) {
    throw new Error(
      "Dependências do app não encontradas. Reinstale o Cashflow Pro."
    );
  }
  fs.renameSync(staged, nm);
}

function startNextServer() {
  const env = desktopEnv();
  startedNext = true;

  if (isPackaged()) {
    const serverDir = path.join(process.resourcesPath, "app-server");
    const found = findServerJs(serverDir);
    if (!found) {
      throw new Error("Servidor do app não encontrado no instalador.");
    }

    ensureServerNodeModules(found.cwd);

    const engine = path.join(
      found.cwd,
      "node_modules",
      ".prisma",
      "client",
      "query_engine-windows.dll.node"
    );
    if (fs.existsSync(engine)) {
      env.PRISMA_QUERY_ENGINE_LIBRARY = engine;
    }

    const logFile = path.join(dataDir(), "server.log");
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    const logFd = fs.openSync(logFile, "a");
    nextProcess = spawn(process.execPath, [found.file], {
      cwd: found.cwd,
      env: {
        ...env,
        ELECTRON_RUN_AS_NODE: "1",
      },
      windowsHide: true,
      stdio: ["ignore", logFd, logFd],
    });
  } else {
    const logFile = path.join(dataDir(), "server.log");
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.appendFileSync(
      logFile,
      `\n---- desktop ${new Date().toISOString()} port ${PORT} ----\n`
    );
    const logFd = fs.openSync(logFile, "a");
    const nextCli = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
    nextProcess = spawn(
      resolveNodeBin(),
      [nextCli, "dev", "-p", String(PORT), "-H", HOST],
      {
        cwd: ROOT,
        env,
        windowsHide: true,
        shell: false,
        stdio: ["ignore", logFd, logFd],
      }
    );
  }

  nextProcess.on("error", (error) => {
    console.error("Falha ao iniciar o Next.js:", error);
  });
  nextProcess.on("exit", (code) => {
    if (code && code !== 0 && mainWindow) {
      console.error(`Next.js encerrou com código ${code}`);
    }
  });
}

function stopNextServer() {
  if (!startedNext || !nextProcess || !nextProcess.pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(nextProcess.pid), "/f", "/t"], {
      windowsHide: true,
    });
  } else {
    nextProcess.kill("SIGTERM");
  }
  nextProcess = null;
}

function createSplash() {
  const splash = new BrowserWindow({
    width: 420,
    height: 220,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    backgroundColor: "#0b0f14",
    show: true,
  });
  splash.loadURL(
    "data:text/html;charset=utf-8," +
      encodeURIComponent(`<!doctype html>
<html><body style="margin:0;background:#0b0f14;color:#e8eaed;font-family:Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
  <div style="text-align:center">
    <div style="font-size:18px;font-weight:600;margin-bottom:8px;">${productName()}</div>
    <div style="font-size:13px;opacity:.7;">Preparando o servidor local…</div>
    <div style="font-size:12px;opacity:.45;margin-top:10px;">Na primeira abertura pode levar até 1 minuto.</div>
  </div>
</body></html>`)
  );
  return splash;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    title: productName(),
    autoHideMenuBar: true,
    backgroundColor: "#0b0f14",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const url = `http://${HOST}:${PORT}/app/overview`;
  let lastError = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await mainWindow.loadURL(url);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError || new Error("Não foi possível abrir " + url);
}

applyPortableUserData();

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    let splash = null;
    try {
      splash = createSplash();
      if (isPackaged()) {
        PORT = await findFreePort(PORT);
        startNextServer();
      } else {
        const existing = await findExistingDesktopServer();
        if (existing) {
          PORT = existing;
        } else {
          PORT = await findFreePort(PORT);
          clearStaleNextLock();
          startNextServer();
        }
      }
      await waitForServer();
      await createWindow();
      if (splash && !splash.isDestroyed()) splash.close();
    } catch (error) {
      if (splash && !splash.isDestroyed()) splash.close();
      dialog.showErrorBox(
        productName(),
        (error instanceof Error ? error.message : String(error)) +
          "\n\nSe o problema continuar, envie o arquivo server.log da pasta data."
      );
      stopNextServer();
      app.quit();
    }
  });
}

app.on("window-all-closed", () => {
  stopNextServer();
  app.quit();
});

app.on("before-quit", () => {
  stopNextServer();
});
