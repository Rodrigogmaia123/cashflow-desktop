import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";
import {
  appInstallerVersion,
  githubInstallerAssetUrl,
} from "@/lib/license/installers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function installerCandidates(edition: "pro" | "pessoal") {
  const version = appInstallerVersion();
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
  const version = appInstallerVersion();
  return edition === "pessoal"
    ? `Cashflow-Pessoal-Setup-${version}.exe`
    : `Cashflow-Pro-Setup-${version}.exe`;
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
    return Response.redirect(githubInstallerAssetUrl(edition), 302);
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
