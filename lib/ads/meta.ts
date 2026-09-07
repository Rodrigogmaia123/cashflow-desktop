import { createHash } from "node:crypto";
import { headers } from "next/headers";

export type MetaStandardEvent =
  | "PageView"
  | "InitiateCheckout"
  | "Lead"
  | "Purchase";

export type MetaCustomEvent = "OrderCreated";

export type MetaEventName = MetaStandardEvent | MetaCustomEvent;

export type MetaAdsContext = {
  eventId?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  email?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  sourceUrl?: string | null;
};

export type MetaContent = {
  contentName: string;
  contentIds: string[];
  valueCents: number;
  currency?: string;
};

function pixelId() {
  return (
    process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ||
    process.env.META_PIXEL_ID?.trim() ||
    ""
  );
}

function accessToken() {
  return process.env.META_CAPI_ACCESS_TOKEN?.trim() || "";
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email?: string | null) {
  const next = email?.trim().toLowerCase() ?? "";
  return next.includes("@") ? next : "";
}

export function metaReady() {
  return Boolean(pixelId());
}

export function metaCapiReady() {
  return Boolean(pixelId() && accessToken());
}

export async function adsContextFromRequest(
  extras?: Partial<MetaAdsContext>
): Promise<MetaAdsContext> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for") ?? "";
  const clientIp =
    extras?.clientIp?.trim() ||
    forwarded.split(",")[0]?.trim() ||
    headerList.get("x-real-ip")?.trim() ||
    null;
  const origin =
    headerList.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://127.0.0.1:3456";

  return {
    eventId: extras?.eventId?.trim() || null,
    fbp: extras?.fbp?.trim() || null,
    fbc: extras?.fbc?.trim() || null,
    email: extras?.email?.trim() || null,
    clientIp,
    clientUserAgent:
      extras?.clientUserAgent?.trim() ||
      headerList.get("user-agent") ||
      null,
    sourceUrl: extras?.sourceUrl?.trim() || `${origin}/#planos`,
  };
}

function userData(ctx: MetaAdsContext) {
  const email = normalizeEmail(ctx.email);
  return {
    ...(email ? { em: [sha256(email)] } : {}),
    ...(ctx.clientIp ? { client_ip_address: ctx.clientIp } : {}),
    ...(ctx.clientUserAgent
      ? { client_user_agent: ctx.clientUserAgent }
      : {}),
    ...(ctx.fbp ? { fbp: ctx.fbp } : {}),
    ...(ctx.fbc ? { fbc: ctx.fbc } : {}),
  };
}

function customData(content?: MetaContent) {
  if (!content) return {};
  return {
    currency: content.currency ?? "BRL",
    value: content.valueCents / 100,
    content_name: content.contentName,
    content_ids: content.contentIds,
    content_type: "product",
    num_items: 1,
  };
}

export async function sendMetaCapiEvent(input: {
  eventName: MetaEventName;
  eventId: string;
  ads?: MetaAdsContext | null;
  content?: MetaContent;
}): Promise<void> {
  if (!metaCapiReady()) return;

  const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  const url = `https://graph.facebook.com/v21.0/${pixelId()}/events`;
  const payload = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.ads?.sourceUrl || undefined,
        user_data: userData(input.ads ?? {}),
        custom_data: customData(input.content),
      },
    ],
    ...(testCode ? { test_event_code: testCode } : {}),
  };

  try {
    const res = await fetch(`${url}?access_token=${accessToken()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[ads/meta] CAPI", input.eventName, res.status, body);
    }
  } catch (error) {
    console.error("[ads/meta] CAPI", input.eventName, error);
  }
}

export async function trackLicenseFunnel(input: {
  stage: "initiate" | "order" | "purchase";
  eventId: string;
  ads?: MetaAdsContext | null;
  content: MetaContent;
  email?: string | null;
}) {
  const ads = { ...(input.ads ?? {}), email: input.email ?? input.ads?.email };

  if (input.stage === "initiate") {
    await Promise.all([
      sendMetaCapiEvent({
        eventName: "InitiateCheckout",
        eventId: `${input.eventId}:checkout`,
        ads,
        content: input.content,
      }),
      sendMetaCapiEvent({
        eventName: "Lead",
        eventId: `${input.eventId}:lead`,
        ads,
        content: input.content,
      }),
    ]);
    return;
  }

  if (input.stage === "order") {
    await sendMetaCapiEvent({
      eventName: "OrderCreated",
      eventId: `${input.eventId}:order`,
      ads,
      content: input.content,
    });
    return;
  }

  await sendMetaCapiEvent({
    eventName: "Purchase",
    eventId: `${input.eventId}:purchase`,
    ads,
    content: input.content,
  });
}
