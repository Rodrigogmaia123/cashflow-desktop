const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const version = require(path.join(root, "package.json")).version;
const REPO = "Rodrigogmaia123/cashflow-desktop";

function findDmgs() {
  if (!fs.existsSync(dist)) return [];
  const wanted = [
    "Cashflow-Pro-Setup.dmg",
    `Cashflow-Pro-Setup-${version}.dmg`,
    "Cashflow-Pessoal-Setup.dmg",
    `Cashflow-Pessoal-Setup-${version}.dmg`,
  ];
  const found = fs
    .readdirSync(dist)
    .filter((name) => /^Cashflow-(Pro|Pessoal)-Setup.*\.dmg$/i.test(name))
    .map((name) => path.join(dist, name));

  const extras = wanted
    .map((name) => path.join(dist, name))
    .filter((file) => fs.existsSync(file));

  return [...new Set([...extras, ...found])];
}

function ensureLatestNames(files) {
  const mapped = [];
  for (const file of files) {
    const name = path.basename(file);
    const latestName = name.replace(`-${version}`, "").replace(/-universal/i, "").replace(/-arm64/i, "").replace(/-x64/i, "");
    const latest = path.join(dist, latestName);
    if (latest !== file && /Setup\.dmg$/i.test(latestName)) {
      fs.copyFileSync(file, latest);
      mapped.push(latest);
    } else {
      mapped.push(file);
    }
  }
  const unique = [];
  const seen = new Set();
  for (const file of mapped) {
    const base = path.basename(file);
    if (seen.has(base)) continue;
    seen.add(base);
    unique.push(file);
  }
  return unique.filter((file) => /Setup\.dmg$/i.test(path.basename(file)) && !/-(\d+\.)+\d+/.test(path.basename(file)));
}

function runGh(args) {
  const result = spawnSync("gh", args, {
    cwd: root,
    encoding: "utf8",
  });
  return result;
}

const discovered = findDmgs();
if (discovered.length === 0) {
  console.error("Nenhum .dmg em dist/.");
  console.error("No Mac, rode antes: npm run desktop:build:mac");
  process.exit(1);
}

const toUpload = ensureLatestNames(discovered);
if (toUpload.length === 0) {
  console.error("Achei .dmg, mas o nome não bateu com Cashflow-Pro-Setup.dmg.");
  console.error("Arquivos em dist/:", discovered.map((file) => path.basename(file)).join(", "));
  process.exit(1);
}

const probe = runGh(["--version"]);
if (probe.error || probe.status !== 0) {
  console.error("O GitHub CLI (gh) não está instalado neste Mac.");
  console.error("Instale com: brew install gh");
  console.error("Depois: gh auth login");
  console.error("");
  console.error("Ou envie pelo site: GitHub → cashflow-desktop → Releases → editar o último → anexar os .dmg");
  console.error("Arquivos:", toUpload.map((file) => path.basename(file)).join(", "));
  process.exit(1);
}

const list = runGh([
  "release",
  "list",
  "--repo",
  REPO,
  "--limit",
  "1",
  "--json",
  "tagName",
]);
if (list.status !== 0) {
  console.error("Não deu para listar o Release. Faça login: gh auth login");
  if (list.stderr) console.error(list.stderr.trim());
  process.exit(1);
}

let tag = "";
try {
  const parsed = JSON.parse(list.stdout || "[]");
  tag = parsed[0] && parsed[0].tagName ? String(parsed[0].tagName) : "";
} catch {
  tag = "";
}

if (!tag) {
  console.error("Não há Release no GitHub para anexar o .dmg.");
  console.error("Abra https://github.com/Rodrigogmaia123/cashflow-desktop/releases e crie/edite um release,");
  console.error("ou rode: gh release create v" + version + " --title \"v" + version + "\" --notes \"Instaladores\"");
  process.exit(1);
}

console.log("Enviando para o Release", tag, "…");
const upload = runGh([
  "release",
  "upload",
  tag,
  ...toUpload,
  "--repo",
  REPO,
  "--clobber",
]);
if (upload.status !== 0) {
  console.error("Falha ao enviar o .dmg.");
  if (upload.stderr) console.error(upload.stderr.trim());
  if (upload.stdout) console.error(upload.stdout.trim());
  process.exit(1);
}

console.log("DMG enviado.");
console.log(
  "Pro: https://github.com/" + REPO + "/releases/latest/download/Cashflow-Pro-Setup.dmg"
);
console.log(
  "Pessoal: https://github.com/" + REPO + "/releases/latest/download/Cashflow-Pessoal-Setup.dmg"
);
