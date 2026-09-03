import { config } from "dotenv";
import { createHash } from "crypto";

config();

async function main() {
  const { ensureSqliteSchemaOnce } = await import("../lib/sqlite-schema-compat");
  const { prisma } = await import("../lib/db");
  const license = await import("../lib/license");

  await ensureSqliteSchemaOnce();

  const sessionId = `sprint1-smoke-${Date.now()}`;
  const created = await license.createPaidLicense({
    edition: "pro",
    duration: "3m",
    email: "sprint1@cashflow.demo",
    stripeSessionId: sessionId,
  });

  if (created.serial) throw new Error("Sprint 2: serial não nasce no pagamento");
  if (created.license.status !== "paid") throw new Error("status inicial deve ser paid");
  if (created.license.activatedAt || created.license.expiresAt || created.license.machineId) {
    throw new Error("prazo não pode começar no pagamento");
  }
  if (!created.license.serialHash.startsWith("pending:")) {
    throw new Error("antes de emitir, o hash deve ser pending");
  }

  const issued = await license.issueLicenseSerial(created.license.id);
  if (!issued.serial) throw new Error("issueLicenseSerial deve devolver o serial uma vez");
  const serial = issued.serial;

  const rawInDb = await prisma.$queryRawUnsafe<{ n: number }[]>(
    `SELECT COUNT(*) AS n FROM License WHERE serialHash = ? OR email = ?`,
    serial,
    serial
  );
  if (Number(rawInDb[0]?.n) !== 0) {
    throw new Error("texto do serial vazou no banco");
  }

  const hashed = createHash("sha256").update(serial).digest("hex");
  const stored = await prisma.license.findUnique({
    where: { id: created.license.id },
  });
  if (stored?.serialHash === hashed) {
    throw new Error("hash sem pepper (sha256 cru) — recusar");
  }
  if (stored?.serialHash === serial) {
    throw new Error("serial gravado em texto");
  }

  const found = await license.findLicenseBySerial(serial);
  const bySession = await license.findLicenseByStripeSession(sessionId);
  if (!found || found.id !== created.license.id) throw new Error("find por serial falhou");
  if (!bySession || bySession.id !== created.license.id) {
    throw new Error("find por session falhou");
  }

  const again = await license.createPaidLicense({
    edition: "pro",
    duration: "3m",
    email: "sprint1@cashflow.demo",
    stripeSessionId: sessionId,
  });
  if (!again.alreadyExisted || again.serial !== null) {
    throw new Error("session duplicada não pode gerar outro serial");
  }

  const activated = await license.markLicenseActivated({
    serial,
    machineId: "copy-pendrive-1",
  });
  if (activated.status !== "active") throw new Error("mark active falhou");
  if (!activated.activatedAt || !activated.expiresAt) {
    throw new Error("ativação deve começar o prazo (3m)");
  }
  if (activated.machineId !== "copy-pendrive-1") {
    throw new Error("machineId não gravou");
  }

  try {
    await license.markLicenseActivated({
    serial,
      machineId: "outra-copia-clonada",
    });
    throw new Error("clonar para outra cópia deveria recusar");
  } catch (error) {
    if (!(error instanceof license.LicenseError) || error.code !== "bound_other_copy") {
      throw error;
    }
  }

  const sameCopy = await license.markLicenseActivated({
    serial,
    machineId: "copy-pendrive-1",
  });
  if (sameCopy.machineId !== "copy-pendrive-1") {
    throw new Error("mesma cópia (pendrive) deveria reativar");
  }

  const lifetime = await license.createPaidLicense({
    edition: "pessoal",
    duration: "lifetime",
    email: "sprint1-life@cashflow.demo",
    stripeSessionId: `${sessionId}-life`,
  });
  const lifeIssued = await license.issueLicenseSerial(lifetime.license.id);
  const lifeSerial = lifeIssued.serial!;
  const lifeActive = await license.markLicenseActivated({
    serial: lifeSerial,
    machineId: "copy-life-1",
  });
  if (lifeActive.expiresAt !== null) {
    throw new Error("vitalício deve ter expiresAt nulo");
  }
  try {
    await license.markLicenseExpired(lifeActive.id);
    throw new Error("vitalício não expira");
  } catch (error) {
    if (!(error instanceof license.LicenseError) || error.code !== "lifetime") {
      throw error;
    }
  }

  const revoked = await license.markLicenseRevoked(activated.id);
  if (revoked.status !== "revoked") throw new Error("revogar falhou");

  await prisma.license.deleteMany({
    where: { stripeSessionId: { startsWith: "sprint1-smoke-" } },
  });

  console.log("Sprint 1 ok: criar, buscar e marcar chave no banco.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
