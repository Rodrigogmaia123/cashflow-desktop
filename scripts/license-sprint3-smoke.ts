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
  const {
    findLicenseByStripeSession,
    issueLicenseSerial,
    revealLicenseForCheckoutSession,
    resendLicenseEmail,
  } = await import("../lib/license");

  await ensureSqliteSchemaOnce();

  const offer = getPricedLicenseOffer("pro", "3m");
  if (!offer) throw new Error("3m precisa ter preço");

  const sessionId = `cs_test_sprint3_${Date.now()}`;
  const session = {
    id: sessionId,
    mode: "payment" as const,
    payment_status: "paid" as const,
    amount_total: offer.amountCents,
    customer_email: "sprint3@cashflow.demo",
    metadata: {
      product: DESKTOP_LICENSE_PRODUCT,
      edition: "pro",
      duration: "3m",
    },
  };

  const created = await fulfillDesktopLicenseSession(session);
  if (created.outcome !== "created") {
    throw new Error("pagamento pago deveria criar paid");
  }

  const pending = await findLicenseByStripeSession(sessionId);
  if (!pending?.serialHash.startsWith("pending:")) {
    throw new Error("antes do reveal o serial ainda é pending");
  }
  if (pending.activatedAt) {
    throw new Error("prazo não pode começar no pagamento");
  }

  const first = await revealLicenseForCheckoutSession(sessionId);
  if (first.status !== "ready" || !first.serial) {
    throw new Error("reveal de sessão paga deveria devolver o serial");
  }
  if (!/^CF-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(first.serial)) {
    throw new Error(`formato ilegível: ${first.serial}`);
  }

  const second = await revealLicenseForCheckoutSession(sessionId);
  if (second.status !== "ready" || second.serial !== first.serial) {
    throw new Error("segunda consulta não pode inventar outra chave");
  }

  const issuedAgain = await issueLicenseSerial(pending.id);
  if (issuedAgain.serial !== first.serial) {
    throw new Error("issue de novo tem de devolver o mesmo serial");
  }

  const stored = await prisma.license.findUnique({ where: { id: pending.id } });
  if (!stored?.serialCipher) throw new Error("envelope cifrado não gravou");
  if (stored.serialHash === first.serial || stored.serialCipher.includes(first.serial)) {
    throw new Error("texto do serial vazou no banco");
  }
  if (stored.activatedAt || stored.expiresAt || stored.machineId) {
    throw new Error("relógio andou no sprint 3");
  }
  if (!stored.serialEmailedAt) {
    throw new Error("tentativa de e-mail deveria marcar serialEmailedAt");
  }

  const count = await prisma.license.count({
    where: { stripeSessionId: sessionId },
  });
  if (count !== 1) throw new Error("duplicou a licença");

  await resendLicenseEmail(pending.id);
  const afterResend = await prisma.license.findUnique({ where: { id: pending.id } });
  if (afterResend?.serialHash !== stored.serialHash) {
    throw new Error("reenvio gerou outro serial");
  }

  const invalid = await revealLicenseForCheckoutSession("nao-e-sessao");
  if (invalid.status !== "invalid") {
    throw new Error("session_id falso não pode gerar chave");
  }

  await prisma.license.deleteMany({
    where: { stripeSessionId: { startsWith: "cs_test_sprint3_" } },
  });

  console.log("Sprint 3 ok: serial no reveal, mesmo serial no reenvio, prazo parado.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
