const { spawn } = require("child_process");
const path = require("path");

process.env.DESKTOP_EDITION = "pessoal";

const child = spawn("npx", ["electron", "./electron/main.cjs"], {
  cwd: path.join(__dirname, ".."),
  env: process.env,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
