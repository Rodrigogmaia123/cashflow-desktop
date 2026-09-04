import { NextRequest, NextResponse } from "next/server";
import { resolveSupportCustomer, type SupportProof } from "@/lib/support/identity";
import { allowSupportRate } from "@/lib/support/rate-limit";
import {
  SUPPORT_SEND_MAX_PER_WINDOW,
  SUPPORT_SEND_WINDOW_MS,
} from "@/lib/support/constants";
import { appendSupportMessage, customerSnapshot } from "@/lib/support/store";
import type { SupportCustomerSnapshot } from "@/lib/support/types";

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
  let body: SupportProof & { body?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Pedido inválido." },
      { status: 400, headers: CORS }
    );
  }

  const customer = await resolveSupportCustomer({
    machineId: typeof body.machineId === "string" ? body.machineId : undefined,
    serial: typeof body.serial === "string" ? body.serial : undefined,
    email: typeof body.email === "string" ? body.email : undefined,
  });
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
      `send:${customer.email}`,
      SUPPORT_SEND_MAX_PER_WINDOW,
      SUPPORT_SEND_WINDOW_MS
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        code: "rate",
        message: "Muitas mensagens seguidas. Espere um pouco.",
      },
      { status: 429, headers: CORS }
    );
  }

  try {
    const result = await appendSupportMessage({
      email: customer.email,
      author: "customer",
      body: typeof body.body === "string" ? body.body : "",
    });
    if ("ok" in result && result.ok) {
      return NextResponse.json(result, { headers: CORS });
    }
    const snapshot = await customerSnapshot(customer.email);
    return NextResponse.json(snapshot, { headers: CORS });
  } catch (error) {
    if (error instanceof Error && error.message === "empty") {
      return NextResponse.json(
        { ok: false, code: "empty", message: "Escreva uma mensagem." },
        { headers: CORS }
      );
    }
    console.error("[support/send]", error);
    return NextResponse.json(
      { ok: false, code: "error", message: "Não foi possível enviar agora." },
      { status: 500, headers: CORS }
    );
  }
}

export type SupportSendResponse = SupportCustomerSnapshot;
