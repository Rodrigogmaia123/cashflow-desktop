import { config } from "dotenv";

config();

async function main() {
  const { ensureSqliteSchemaOnce } = await import("../lib/sqlite-schema-compat");
  const { prisma } = await import("../lib/db");
  const license = await import("../lib/license");
  const { verifyLicenseCopy } = await import("../lib/license/heartbeat");
  const { LicenseError } = await import("../lib/license/types");

  await ensureSqliteSchemaOnce();
  const sessionId = `sprint6-smoke-${Date.now()}`;

  const created = await license.createPaidLicense({
    edition: "pro",
    duration: "3m",
    email: "sprint6@cashflow.demo",
    stripeSessionId: sessionId,
  });
  const issued = await license.issueLicenseSerial(created.license.id);
  const serial = issued.serial!;
  await license.markLicenseActivated({
    serial,
    machineId: "copy-to-cut",
  });

  const revoked = await license.markLicenseRevoked(created.license.id, {
    reason: "vazou o instalador",
    actorUserId: "admin-sprint6",
    actorEmail: "admin@nexpay.test",
  });
  if (revoked.status !== "revoked") throw new Error("status não ficou revoked");
  if (!revoked.revokedAt) throw new Error("falta log de quando");
  if (revoked.revokedByEmail !== "admin@nexpay.test") {
    throw new Error("falta log de quem");
  }
  if (revoked.revokeReason !== "vazou o instalador") {
    throw new Error("motivo não gravou");
  }

  const firstRevokedAt = revoked.revokedAt.getTime();
  const again = await license.markLicenseRevoked(created.license.id, {
    reason: "segunda tentativa",
    actorEmail: "outro@nexpay.test",
  });
  if (again.revokedByEmail !== "admin@nexpay.test") {
    throw new Error("re-revogar não pode apagar o log original");
  }
  if (again.revokedAt.getTime() !== firstRevokedAt) {
    throw new Error("data original de revogação mudou");
  }

  const hb = await verifyLicenseCopy({ machineId: "copy-to-cut" });
  if (hb.status !== "revoked") {
    throw new Error("heartbeat seguinte tem de fechar o app");
  }

  try {
    await license.markLicenseActivated({
      serial,
      machineId: "instalador-novo",
    });
    throw new Error("instalador novo não pode reabrir chave revogada");
  } catch (error) {
    if (!(error instanceof LicenseError) || error.code !== "revoked") {
      throw error;
    }
  }

  const found = await license.listLicenses({ query: serial });
  if (found.length !== 1 || found[0]?.id !== created.license.id) {
    throw new Error("busca por serial no admin falhou");
  }

  const life = await license.createPaidLicense({
    edition: "pro",
    duration: "lifetime",
    email: "sprint6-life@cashflow.demo",
    stripeSessionId: `${sessionId}-life`,
  });
  const lifeIssued = await license.issueLicenseSerial(life.license.id);
  await license.markLicenseActivated({
    serial: lifeIssued.serial!,
    machineId: "copy-life-cut",
  });
  const lifeRevoked = await license.markLicenseRevoked(life.license.id, {
    actorEmail: "admin@nexpay.test",
    reason: "vitalício também corta",
  });
  if (lifeRevoked.status !== "revoked" || lifeRevoked.expiresAt !== null) {
    throw new Error("vitalício revoga sem inventar data de validade");
  }
  const lifeHb = await verifyLicenseCopy({ machineId: "copy-life-cut" });
  if (lifeHb.status !== "revoked") {
    throw new Error("heartbeat de vitalício revogado deveria ser revoked");
  }

  await prisma.license.deleteMany({
    where: { stripeSessionId: { startsWith: "sprint6-smoke-" } },
  });

  console.log(
    "Sprint 6 ok: revoga com log; heartbeat fecha; instalador novo não reabre; vitalício também cai."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
