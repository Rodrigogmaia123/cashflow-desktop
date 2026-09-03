const { execSync } = require("child_process");
const path = require("path");
const { cleanStaleInstallers } = require("./clean-stale-installers.cjs");

const root = path.join(__dirname, "..");

function run(command) {
  execSync(command, { cwd: root, stdio: "inherit", env: process.env, shell: true });
}

cleanStaleInstallers();
run("node scripts/ensure-empty-db.cjs");
run("npx next build");
run("node scripts/prepare-desktop-build.cjs");
run("npx electron-builder --win nsis");
cleanStaleInstallers();
run("npx electron-builder --config electron-builder.pessoal.json --win nsis");
cleanStaleInstallers();
run("node scripts/publish-installers.cjs");
console.log("Instaladores 0.1.5 Pro e Pessoal prontos em dist/ e public/installers/");
