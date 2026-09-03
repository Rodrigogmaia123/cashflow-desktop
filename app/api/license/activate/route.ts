import { NextRequest, NextResponse } from "next/server";
import {
  activateLicenseCopy,
  activationErrorPayload,
} from "@/lib/license/activate";

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
  let body: { serial?: string; machineId?: string; edition?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_payload", message: "Pedido inválido." },
      { status: 400, headers: CORS }
    );
  }

  const serial = typeof body.serial === "string" ? body.serial : "";
  const machineId = typeof body.machineId === "string" ? body.machineId : "";
  const edition = typeof body.edition === "string" ? body.edition : undefined;

  try {
    const result = await activateLicenseCopy({ serial, machineId, edition });
    return NextResponse.json(result, { headers: CORS });
  } catch (error) {
    const payload = activationErrorPayload(error);
    const status =
      payload.code === "invalid_serial" || payload.code === "missing_machine"
        ? 400
        : 200;
    return NextResponse.json(payload, { status, headers: CORS });
  }
}
