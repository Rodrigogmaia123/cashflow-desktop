import { config } from "dotenv";

config();

async function main() {
  const { ensureSqliteSchemaOnce } = await import("../lib/sqlite-schema-compat");
  const { prisma } = await import("../lib/db");
  const { fulfillDesktopLicenseSession } = await import(
    "../lib/license/fulfill-checkout"
  );
  const { DESKTOP_LICENSE_PRODUCT, getPricedLicenseOffer } = await import(
    "../lib/license/catalog"
  );
  const { findLicenseByStripeSession, issueLicenseSerial } = await import(
    "../lib/license"
  );

  await ensureSqliteSchemaOnce();

  const offer = getPricedLicenseOffer("pro", "3m");
  if (!offer) throw new Error("3m precisa ter preço");

  const sessionId = `sprint2-smoke-${Date.now()}`;
  const session = {
    id: sessionId,
    mode: "payment" as const,
    payment_status: "paid" as const,
    amount_total: offer.amountCents,
    customer_email: "sprint2@cashflow.demo",
    metadata: {
      product: DESKTOP_LICENSE_PRODUCT,
      edition: "pro",
      duration: "3m",
    },
  };

  const ignoredSaas = await fulfillDesktopLicenseSession({
    ...session,
    id: `${sessionId}-saas`,
    mode: "subscription",
    metadata: { plan: "PRO" },
  });
  if (ignoredSaas.outcome !== "ignored") {
    throw new Error("assinatura SaaS não pode criar licença desktop");
  }

  const ignoredUnpaid = await fulfillDesktopLicenseSession({
    ...session,
    id: `${sessionId}-unpaid`,
    payment_status: "unpaid",
  });
  if (ignoredUnpaid.outcome !== "ignored") {
    throw new Error("pagamento falho não pode criar serial");
  }

  const ignoredUnpriced = await fulfillDesktopLicenseSession({
    ...session,
    id: `${sessionId}-life`,
    metadata: {
      product: DESKTOP_LICENSE_PRODUCT,
      edition: "pro",
      duration: "lifetime",
    },
  });
  if (ignoredUnpriced.outcome !== "ignored") {
    throw new Error("prazo sem preço não vai para o Stripe/banco");
  }

  const ignoredAmount = await fulfillDesktopLicenseSession({
    ...session,
    amount_total: 1,
  });
  if (ignoredAmount.outcome !== "ignored") {
    throw new Error("valor diferente do catálogo não cria chave");
  }

  const first = await fulfillDesktopLicenseSession(session);
  if (first.outcome !== "created") throw new Error("pagamento pago deveria criar paid");

  const license = await findLicenseByStripeSession(sessionId);
  if (!license) throw new Error("registro não encontrado");
  if (license.status !== "paid") throw new Error("status deve ser paid");
  if (license.activatedAt || license.expiresAt || license.machineId) {
    throw new Error("não pode ativar no pagamento");
  }
  if (license.duration !== "3m" || license.edition !== "pro") {
    throw new Error("edition/duration do metadata não bateram");
  }
  if (!license.serialHash.startsWith("pending:")) {
    throw new Error("nesta etapa o serial ainda não existe");
  }

  const second = await fulfillDesktopLicenseSession(session);
  if (second.outcome !== "exists" || second.licenseId !== first.licenseId) {
    throw new Error("mesmo session_id não pode gerar duas chaves");
  }

  const count = await prisma.license.count({
    where: { stripeSessionId: sessionId },
  });
  if (count !== 1) throw new Error("duplicou a licença");

  const issued = await issueLicenseSerial(license.id);
  if (issued.alreadyIssued || !issued.serial) {
    throw new Error("emitir serial depois do pagamento falhou");
  }

  await prisma.license.deleteMany({
    where: { stripeSessionId: { startsWith: "sprint2-smoke-" } },
  });

  console.log("Sprint 2 ok: pagamento pago cria um paid, sem activatedAt.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
