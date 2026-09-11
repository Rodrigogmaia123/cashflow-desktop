import { config } from "dotenv";

config();

async function main() {
  const { ensureSqliteSchemaOnce } = await import("../lib/sqlite-schema-compat");
  const { prisma } = await import("../lib/db");
  const license = await import("../lib/license");
  const { activateLicenseCopy } = await import("../lib/license/activate");

  await ensureSqliteSchemaOnce();

  const sessionId = `sprint4-smoke-${Date.now()}`;
  const created = await license.createPaidLicense({
    edition: "pro",
    duration: "3m",
    email: "sprint4@cashflow.demo",
    stripeSessionId: sessionId,
  });
  const issued = await license.issueLicenseSerial(created.license.id);
  if (!issued.serial) throw new Error("precisa do serial do sprint 3");
  const serial = issued.serial;

  const first = await activateLicenseCopy({
    serial,
    machineId: "copy-pendrive-pasta-a",
    edition: "pro",
  });
  if (!first.ok) throw new Error("primeira ativação deveria passar");
  if (first.lifetime) throw new Error("3m não é vitalício");
  if (!first.expiresAt || !first.activatedAt) {
    throw new Error("ativação deve gravar activatedAt e expiresAt");
  }
  if (!first.validUntilLabel.startsWith("Válido até")) {
    throw new Error(`rótulo de validade inesperado: ${first.validUntilLabel}`);
  }

  const stored = await prisma.license.findUnique({
    where: { id: created.license.id },
  });
  if (stored?.status !== "active") throw new Error("status deveria ser active");
  if (stored.machineId !== "copy-pendrive-pasta-a") {
    throw new Error("não amarrou a cópia");
  }
  if (!stored.activatedAt || !stored.expiresAt) {
    throw new Error("prazo não começou na ativação");
  }

  const sameCopy = await activateLicenseCopy({
    serial,
    machineId: "copy-pendrive-pasta-a",
    edition: "pro",
  });
  if (sameCopy.activatedAt !== first.activatedAt) {
    throw new Error("mesma cópia (pendrive) não pode recomeçar o prazo");
  }

  const reinstalled = await activateLicenseCopy({
    serial,
    machineId: "pasta-depois-do-install",
    edition: "pro",
  });
  if (reinstalled.activatedAt !== first.activatedAt) {
    throw new Error("reativar após reinstalar não pode recomeçar o prazo");
  }
  const afterTransfer = await prisma.license.findUnique({
    where: { id: created.license.id },
  });
  if (afterTransfer?.machineId !== "pasta-depois-do-install") {
    throw new Error("serial deveria passar para a cópia nova");
  }

  try {
    await activateLicenseCopy({
      serial,
      machineId: "copy-pendrive-pasta-a",
      edition: "pessoal",
    });
    throw new Error("edição errada deveria recusar");
  } catch (error) {
    if (!(error instanceof LicenseError) || error.code !== "edition_mismatch") {
      throw error;
    }
  }

  const life = await license.createPaidLicense({
    edition: "pro",
    duration: "lifetime",
    email: "sprint4-life@cashflow.demo",
    stripeSessionId: `${sessionId}-life`,
  });
  const lifeIssued = await license.issueLicenseSerial(life.license.id);
  const lifeResult = await activateLicenseCopy({
    serial: lifeIssued.serial!,
    machineId: "copy-life",
    edition: "pro",
  });
  if (!lifeResult.lifetime || lifeResult.expiresAt !== null) {
    throw new Error("vitalício deve responder sem data");
  }
  if (lifeResult.validUntilLabel !== "Vitalício") {
    throw new Error("rótulo vitalício");
  }

  await prisma.license.deleteMany({
    where: { stripeSessionId: { startsWith: "sprint4-smoke-" } },
  });

  console.log(
    "Sprint 4 ok: ativa e amarra 1 cópia; reinstalar reamarra sem resetar prazo; vitalício sem expiresAt."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
