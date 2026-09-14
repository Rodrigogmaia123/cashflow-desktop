const { app, BrowserWindow, shell, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");
const http = require("http");
const net = require("net");

const HOST = "127.0.0.1";
const ROOT = path.join(__dirname, "..");

function openHttpUrl(url) {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    shell.openExternal(url);
    return true;
  } catch {
    return false;
  }
}

ipcMain.handle("desktop-open-external", (_event, url) => openHttpUrl(url));

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

function desktopAppId() {
  return desktopEdition() === "pessoal"
    ? "pro.cashflow.desktop.pessoal"
    : "pro.cashflow.desktop";
}

function appIconPath() {
  const local = path.join(__dirname, "icon.png");
  if (fs.existsSync(local)) return local;
  const fromResources = path.join(process.resourcesPath, "icon.png");
  if (fs.existsSync(fromResources)) return fromResources;
  return undefined;
}

function appIconDataUrl() {
  const icon = appIconPath();
  if (!icon) return "";
  try {
    return "data:image/png;base64," + fs.readFileSync(icon).toString("base64");
  } catch {
    return "";
  }
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
  checkpointSqlite(fromDb);
  fs.mkdirSync(path.dirname(toDb), { recursive: true });
  fs.copyFileSync(fromDb, toDb);
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    const from = fromDb + suffix;
    if (fs.existsSync(from)) fs.copyFileSync(from, toDb + suffix);
  }
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

function markPortable() {
  try {
    fs.writeFileSync(path.join(exeDir(), ".portable"), "1\n");
  } catch {
    // pasta só leitura
  }
}

let cachedDataDir = null;

function dataDir() {
  if (cachedDataDir) return cachedDataDir;
  if (!isPackaged()) {
    cachedDataDir = path.join(ROOT, "data");
    return cachedDataDir;
  }
  cachedDataDir = localDataDir();
  return cachedDataDir;
}

function applyPortableUserData() {
  if (!isPackaged()) return;
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

function checkpointSqlite(file) {
  if (!fs.existsSync(file)) return;
  try {
    const { DatabaseSync } = require("node:sqlite");
    const db = new DatabaseSync(file);
    try {
      db.exec("PRAGMA wal_checkpoint(TRUNCATE);");
    } finally {
      db.close();
    }
  } catch {
    // arquivo em uso / sem node:sqlite
  }
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

function writeActiveDbPointer(dir, dest) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "data-source.txt"),
      `Banco em uso (somente esta pasta):\n${dest}\nAtualizado: ${new Date().toISOString()}\n`,
      "utf8"
    );
  } catch {
    // ignore
  }
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
    // backup local não pode impedir o app de abrir
  }
}

function ensurePackagedDatabase(dest) {
  const dir = path.dirname(dest);
  fs.mkdirSync(dir, { recursive: true });
  writeActiveDbPointer(dir, dest);

  if (fs.existsSync(dest) && dbSize(dest) > 0) {
    snapshotDb(dest, "startup");
    checkpointSqlite(dest);
    logMigrate(dir, `usando somente ${dest}`);
    return;
  }

  const template = emptyTemplatePath();
  if (template && fs.existsSync(template)) {
    fs.copyFileSync(template, dest);
    logMigrate(dir, `primeira instalação: template vazio -> ${dest}`);
  }
}

function sqliteUrl() {
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, "cashflow-desktop.db");

  if (isPackaged()) {
    ensurePackagedDatabase(dest);
    markPortable();
  }

  return "file:" + dest.replace(/\\/g, "/");
}

function desktopEnv() {
  const licenseApi = (
    process.env.LICENSE_API_BASE_URL ||
    process.env.NEXT_PUBLIC_LICENSE_API_BASE_URL ||
    (isPackaged() ? "https://getcashflow.pro" : "")
  ).replace(/\/$/, "");

  const env = {
    ...process.env,
    DATABASE_URL: sqliteUrl(),
    CASHFLOW_DATA_DIR: dataDir(),
    DESKTOP_MODE: "true",
    NEXT_PUBLIC_DESKTOP_MODE: "true",
    DESKTOP_EDITION: desktopEdition(),
    CASHFLOW_PACKAGED: isPackaged() ? "true" : "false",
    DESKTOP_APP_VERSION: app.getVersion(),
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

    const prismaClientDir = path.join(
      found.cwd,
      "node_modules",
      ".prisma",
      "client"
    );
    const engineNames =
      process.platform === "win32"
        ? ["query_engine-windows.dll.node"]
        : process.platform === "darwin"
          ? [
              process.arch === "arm64"
                ? "libquery_engine-darwin-arm64.dylib.node"
                : "libquery_engine-darwin.dylib.node",
              "libquery_engine-darwin-arm64.dylib.node",
              "libquery_engine-darwin.dylib.node",
            ]
          : [];
    for (const name of engineNames) {
      const engine = path.join(prismaClientDir, name);
      if (fs.existsSync(engine)) {
        env.PRISMA_QUERY_ENGINE_LIBRARY = engine;
        break;
      }
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
  const iconSrc = appIconDataUrl();
  const iconHtml = iconSrc
    ? `<img src="${iconSrc}" width="64" height="64" alt="" style="border-radius:16px;margin:0 auto 14px;display:block;" />`
    : "";
  const splash = new BrowserWindow({
    width: 420,
    height: 260,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    backgroundColor: "#0b0f14",
    show: true,
    icon: appIconPath(),
  });
  splash.loadURL(
    "data:text/html;charset=utf-8," +
      encodeURIComponent(`<!doctype html>
<html><body style="margin:0;background:#0b0f14;color:#e8eaed;font-family:Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
  <div style="text-align:center">
    ${iconHtml}
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
    icon: appIconPath(),
    autoHideMenuBar: true,
    backgroundColor: "#0b0f14",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openHttpUrl(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, navUrl) => {
    if (navUrl.startsWith(`http://${HOST}:`)) return;
    event.preventDefault();
    openHttpUrl(navUrl);
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
    if (process.platform === "win32") {
      app.setAppUserModelId(desktopAppId());
    }
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
