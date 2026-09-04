import { redirect } from "next/navigation";
import { markLicenseOrderCanceled } from "@/lib/license/orders";

export const dynamic = "force-dynamic";

export default async function PurchaseCanceledPage({
  searchParams,
}: {
  searchParams?: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params?.session_id?.trim() ?? "";

  if (sessionId.startsWith("cs_test_") || sessionId.startsWith("cs_live_")) {
    try {
      await markLicenseOrderCanceled({ stripeSessionId: sessionId });
    } catch (error) {
      console.error("[compra/cancelado]", sessionId, error);
    }
  }

  redirect("/#planos");
}
