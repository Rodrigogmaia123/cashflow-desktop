import { NextRequest, NextResponse } from "next/server";
import { verifyLicenseCopy } from "@/lib/license/heartbeat";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  let body: { machineId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { status: "unknown" },
      { status: 400, headers: CORS }
    );
  }

  const machineId = typeof body.machineId === "string" ? body.machineId : "";
  if (!machineId.trim()) {
    return NextResponse.json({ status: "unknown" }, { headers: CORS });
  }

  const result = await verifyLicenseCopy({ machineId });
  return NextResponse.json(result, { headers: CORS });
}
