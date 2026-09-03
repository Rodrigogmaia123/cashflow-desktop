const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const unpacked = path.join(root, "dist", "win-unpacked");
const dest = path.join(root, "dist", "Cashflow-Pro-Portatil");
const personalDb = path.join(root, "data", "cashflow-desktop.db");

if (!fs.existsSync(path.join(unpacked, "Cashflow Pro.exe"))) {
  throw new Error("Rode o build do desktop antes (dist/win-unpacked).");
}
if (!fs.existsSync(personalDb)) {
  throw new Error("Banco pessoal não encontrado em data/cashflow-desktop.db");
}

function copyDir(src, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  try {
    execSync(
      `robocopy "${src}" "${destDir}" /E /NFL /NDL /NJH /NJS /nc /ns /np`,
      { stdio: "pipe" }
    );
  } catch (error) {
    if (!error.status || error.status >= 8) {
      throw error;
    }
  }
}

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
copyDir(unpacked, dest);

const dataDir = path.join(dest, "data");
fs.mkdirSync(dataDir, { recursive: true });
fs.copyFileSync(personalDb, path.join(dataDir, "cashflow-desktop.db"));

console.log("Pasta portátil pronta:");
console.log(dest);
console.log("Copie essa pasta inteira para o HD externo e abra Cashflow Pro.exe");
