import { NextRequest, NextResponse } from "next/server";
import { resolveSupportCustomer, type SupportProof } from "@/lib/support/identity";
import { allowSupportRate } from "@/lib/support/rate-limit";
import {
  SUPPORT_SYNC_MAX_PER_WINDOW,
  SUPPORT_SYNC_WINDOW_MS,
} from "@/lib/support/constants";
import { customerSnapshot } from "@/lib/support/store";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function proofFromBody(body: SupportProof): SupportProof {
  return {
    machineId: typeof body.machineId === "string" ? body.machineId : undefined,
    serial: typeof body.serial === "string" ? body.serial : undefined,
    email: typeof body.email === "string" ? body.email : undefined,
  };
}

export async function POST(req: NextRequest) {
  let body: SupportProof;
  try {
    body = (await req.json()) as SupportProof;
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Pedido inválido." },
      { status: 400, headers: CORS }
    );
  }

  const customer = await resolveSupportCustomer(proofFromBody(body));
  if (!customer) {
    return NextResponse.json(
      {
        ok: false,
        code: "not_found",
        message:
          "Não achamos uma compra com esses dados. Use o e-mail do pagamento ou a chave.",
      },
      { headers: CORS }
    );
  }

  if (
    !allowSupportRate(
      `sync:${customer.email}`,
      SUPPORT_SYNC_MAX_PER_WINDOW,
      SUPPORT_SYNC_WINDOW_MS
    )
  ) {
    return NextResponse.json(
      { ok: false, code: "rate", message: "Aguarde um instante e tente de novo." },
      { status: 429, headers: CORS }
    );
  }

  const snapshot = await customerSnapshot(customer.email);
  return NextResponse.json(snapshot, { headers: CORS });
}
