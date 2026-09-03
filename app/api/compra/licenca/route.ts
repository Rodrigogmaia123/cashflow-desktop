import { NextRequest, NextResponse } from "next/server";
import { revealLicenseForCheckoutSession } from "@/lib/license/deliver";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id") ?? "";
  const result = await revealLicenseForCheckoutSession(sessionId);
  return NextResponse.json(result);
}
