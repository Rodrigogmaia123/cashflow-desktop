const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const desktop =
  process.env.DESKTOP_MODE === "true" ||
  process.env.NEXT_PUBLIC_DESKTOP_MODE === "true";

const host = desktop ? "127.0.0.1" : "0.0.0.0";
const port = desktop ? "3456" : String(process.env.PORT || "3000");

process.env.HOSTNAME = host;
process.env.HOST = host;
process.env.PORT = port;

if (!desktop) {
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("file:")) {
    process.env.DATABASE_URL = "file:../data/cashflow-desktop.db";
  }
}

const nextBin = path.join(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

const child = spawn(process.execPath, [nextBin, "start", "-H", host, "-p", port], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 1));
