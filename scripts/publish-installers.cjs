const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const dest = path.join(root, "public", "installers");
const version = require(path.join(root, "package.json")).version;

fs.mkdirSync(dest, { recursive: true });

const files = [
  `Cashflow-Pro-Setup-${version}.exe`,
  `Cashflow-Pessoal-Setup-${version}.exe`,
];

let copied = 0;
for (const name of files) {
  const from = path.join(dist, name);
  if (!fs.existsSync(from)) continue;
  fs.copyFileSync(from, path.join(dest, name));
  fs.copyFileSync(from, path.join(dest, name.replace(`-${version}`, "")));
  console.log("Publicado para download:", name);
  copied += 1;
}

if (copied === 0) {
  console.log("Nenhum instalador em dist/ para publicar.");
}
