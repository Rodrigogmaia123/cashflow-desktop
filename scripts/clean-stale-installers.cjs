const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const version = require(path.join(root, "package.json")).version;

const keep = new Set([
  `Cashflow-Pro-Setup-${version}.exe`,
  `Cashflow-Pro-Setup-${version}.exe.blockmap`,
  `Cashflow-Pessoal-Setup-${version}.exe`,
  `Cashflow-Pessoal-Setup-${version}.exe.blockmap`,
]);

function cleanStaleInstallers() {
  if (!fs.existsSync(dist)) return;
  for (const name of fs.readdirSync(dist)) {
    if (!/^Cashflow-(Pro|Pessoal)-Setup-/i.test(name)) continue;
    if (keep.has(name)) continue;
    fs.unlinkSync(path.join(dist, name));
    console.log("Removido instalador antigo:", name);
  }
}

module.exports = { cleanStaleInstallers };

if (require.main === module) {
  cleanStaleInstallers();
}
