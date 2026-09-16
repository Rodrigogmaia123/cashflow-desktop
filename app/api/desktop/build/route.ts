import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { isDesktopMode } from "@/lib/desktop";
import { appInstallerVersion } from "@/lib/license/installers";

export const dynamic = "force-dynamic";

/** Diagnóstico de deploy: diz qual build atende o domínio e em que modo. */
const BUILD_MARKER = "tailwind-devdeps-2";

function nextAuthHost(): string | null {
  try {
    return new URL(process.env.NEXTAUTH_URL ?? "").host;
  } catch {
    return null;
  }
}

/** Sem tailwindcss no container, o build sai sem estilo nenhum. */
function tailwindInstalled(): boolean {
  return fs.existsSync(
    path.join(process.cwd(), "node_modules", "tailwindcss", "package.json")
  );
}

export async function GET() {
  return NextResponse.json(
    {
      marker: BUILD_MARKER,
      version: appInstallerVersion(),
      desktopMode: isDesktopMode(),
      tailwind: tailwindInstalled(),
      env: {
        NODE_ENV: process.env.NODE_ENV ?? null,
        DESKTOP_MODE: process.env.DESKTOP_MODE ?? null,
        NEXT_PUBLIC_DESKTOP_MODE: process.env.NEXT_PUBLIC_DESKTOP_MODE ?? null,
        HOSTNAME: process.env.HOSTNAME ?? null,
        NEXTAUTH_HOST: nextAuthHost(),
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
