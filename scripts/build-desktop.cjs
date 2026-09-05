const { execSync } = require("child_process");
const path = require("path");
const { cleanStaleInstallers } = require("./clean-stale-installers.cjs");

const root = path.join(__dirname, "..");

const desktopEnv = {
  ...process.env,
  DESKTOP_MODE: "true",
  NEXT_PUBLIC_DESKTOP_MODE: "true",
};

function run(command) {
  execSync(command, { cwd: root, stdio: "inherit", env: desktopEnv, shell: true });
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
console.log("Instaladores Pro e Pessoal prontos em dist/ e public/installers/");
