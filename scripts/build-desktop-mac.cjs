const { execSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");

if (process.platform !== "darwin") {
  console.error(
    "O instalador Mac (.dmg) precisa ser gerado em um Mac. O build Windows não foi alterado."
  );
  process.exit(1);
}

const desktopEnv = {
  ...process.env,
  DESKTOP_MODE: "true",
  NEXT_PUBLIC_DESKTOP_MODE: "true",
  CSC_IDENTITY_AUTO_DISCOVERY: "false",
  LICENSE_API_BASE_URL:
    process.env.LICENSE_API_BASE_URL || "https://getcashflow.pro",
  NEXT_PUBLIC_LICENSE_API_BASE_URL:
    process.env.NEXT_PUBLIC_LICENSE_API_BASE_URL || "https://getcashflow.pro",
};

function run(command) {
  execSync(command, { cwd: root, stdio: "inherit", env: desktopEnv, shell: true });
}

run("node scripts/ensure-empty-db.cjs");
run("npx next build");
run("node scripts/prepare-desktop-build.cjs");
run("npx electron-builder --mac dmg");
run("npx electron-builder --config electron-builder.pessoal.json --mac dmg");
run("node scripts/publish-installers-mac.cjs");
console.log("Instaladores Mac Pro e Pessoal prontos em dist/ e public/installers/");
