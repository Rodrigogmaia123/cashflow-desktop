import { createReadStream, existsSync, readFileSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function appVersion() {
  try {
    const raw = readFileSync(path.join(process.cwd(), "package.json"), "utf8");
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version?.trim() || "0.1.5";
  } catch {
    return "0.1.5";
  }
}

function installerCandidates(edition: "pro" | "pessoal") {
  const version = appVersion();
  const names =
    edition === "pessoal"
      ? [
          "Cashflow-Pessoal-Setup.exe",
          `Cashflow-Pessoal-Setup-${version}.exe`,
        ]
      : ["Cashflow-Pro-Setup.exe", `Cashflow-Pro-Setup-${version}.exe`];
  const dirs = [
    path.join(process.cwd(), "public", "installers"),
    path.join(process.cwd(), "dist"),
  ];
  const files: string[] = [];
  for (const dir of dirs) {
    for (const name of names) {
      files.push(path.join(dir, name));
    }
  }
  return files;
}

function downloadName(edition: "pro" | "pessoal") {
  return edition === "pessoal"
    ? `Cashflow-Pessoal-Setup-${appVersion()}.exe`
    : `Cashflow-Pro-Setup-${appVersion()}.exe`;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ edition: string }> }
) {
  const { edition } = await context.params;
  if (edition !== "pro" && edition !== "pessoal") {
    return new Response("Edição inválida.", { status: 404 });
  }

  const file = installerCandidates(edition).find((candidate) =>
    existsSync(candidate)
  );

  if (!file) {
    return new Response(
      "O instalador desta edição ainda não foi publicado. O serial já vale — o download entra quando o .exe estiver no servidor.",
      {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }
    );
  }

  const { size } = statSync(file);
  const stream = Readable.toWeb(createReadStream(file));
  return new Response(stream as ReadableStream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${downloadName(edition)}"`,
      "Content-Length": String(size),
      "Cache-Control": "private, no-store",
    },
  });
}
