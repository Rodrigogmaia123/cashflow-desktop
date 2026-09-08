const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const dest = path.join(root, "public", "installers");
const version = require(path.join(root, "package.json")).version;

fs.mkdirSync(dest, { recursive: true });

const files = fs.existsSync(dist)
  ? fs.readdirSync(dist).filter((name) =>
      /^Cashflow-(Pro|Pessoal)-Setup.*\.dmg$/i.test(name)
    )
  : [];

let copied = 0;
for (const name of files) {
  const from = path.join(dist, name);
  if (!fs.existsSync(from)) continue;
  const edition = /Pessoal/i.test(name) ? "Pessoal" : "Pro";
  const unversioned = `Cashflow-${edition}-Setup.dmg`;
  fs.copyFileSync(from, path.join(dest, name));
  fs.copyFileSync(from, path.join(dest, unversioned));
  fs.copyFileSync(from, path.join(dist, unversioned));
  console.log("Publicado para download:", name, "e", unversioned);
  copied += 1;
}

if (copied === 0) {
  console.log("Nenhum instalador Mac em dist/ para publicar.");
}
