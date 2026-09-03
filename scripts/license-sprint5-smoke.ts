import { config } from "dotenv";

config();

async function main() {
  const { evaluateDesktopLease, licenseGraceMs, DEFAULT_LICENSE_GRACE_DAYS } =
    await import("../lib/license/lease");
  const { ensureSqliteSchemaOnce } = await import("../lib/sqlite-schema-compat");
  const { prisma } = await import("../lib/db");
  const license = await import("../lib/license");
  const { verifyLicenseCopy } = await import("../lib/license/heartbeat");

  const graceMs = licenseGraceMs(DEFAULT_LICENSE_GRACE_DAYS);
  const now = new Date("2026-09-02T18:00:00.000Z");

  const withinGrace = evaluateDesktopLease(
    {
      activatedAt: "2026-08-28T18:00:00.000Z",
      lastYesAt: "2026-08-28T18:00:00.000Z",
      expiresAt: "2026-12-01T00:00:00.000Z",
      lifetime: false,
      lastCloudStatus: "active",
    },
    now,
    graceMs
  );
  if (!withinGrace.allowed) {
    throw new Error("3 dias sem internet ainda está na folga de 7");
  }

  const pastGrace = evaluateDesktopLease(
    {
      activatedAt: "2026-08-01T18:00:00.000Z",
      lastYesAt: "2026-08-20T18:00:00.000Z",
      expiresAt: "2026-12-01T00:00:00.000Z",
      lifetime: false,
      lastCloudStatus: "active",
    },
    now,
    graceMs
  );
  if (pastGrace.allowed || pastGrace.reason !== "grace_over") {
    throw new Error("depois da folga o caixa tem de fechar");
  }

  const revoked = evaluateDesktopLease(
    {
      activatedAt: now.toISOString(),
      lastYesAt: now.toISOString(),
      expiresAt: null,
      lifetime: true,
      lastCloudStatus: "revoked",
    },
    now,
    graceMs
  );
  if (revoked.allowed || revoked.reason !== "revoked") {
    throw new Error("nuvem revogada fecha na hora");
  }

  const periodOver = evaluateDesktopLease(
    {
      activatedAt: "2026-01-01T00:00:00.000Z",
      lastYesAt: now.toISOString(),
      expiresAt: "2026-09-01T00:00:00.000Z",
      lifetime: false,
      lastCloudStatus: "active",
    },
    now,
    graceMs
  );
  if (periodOver.allowed || periodOver.reason !== "period_over") {
    throw new Error("prazo da chave acabou: folga não estende o plano");
  }

  const freshInstall = evaluateDesktopLease(null, now, graceMs);
  if (freshInstall.allowed || freshInstall.reason !== "missing") {
    throw new Error("instalador novo sem chave não abre");
  }

  await ensureSqliteSchemaOnce();
  const sessionId = `sprint5-smoke-${Date.now()}`;
  const created = await license.createPaidLicense({
    edition: "pro",
    duration: "3m",
    email: "sprint5@cashflow.demo",
    stripeSessionId: sessionId,
  });
  const issued = await license.issueLicenseSerial(created.license.id);
  const serial = issued.serial!;
  await license.markLicenseActivated({
    serial,
    machineId: "copy-heartbeat-a",
  });

  const active = await verifyLicenseCopy({ machineId: "copy-heartbeat-a" });
  if (active.status !== "active") throw new Error("heartbeat deveria ser active");

  const unknown = await verifyLicenseCopy({ machineId: "instalador-novo-sem-copia" });
  if (unknown.status !== "unknown") {
    throw new Error("máquina desconhecida deveria ser unknown");
  }

  await license.markLicenseRevoked(created.license.id);
  const revokedHb = await verifyLicenseCopy({ machineId: "copy-heartbeat-a" });
  if (revokedHb.status !== "revoked") throw new Error("heartbeat revoked");

  const dated = await license.createPaidLicense({
    edition: "pro",
    duration: "3m",
    email: "sprint5-exp@cashflow.demo",
    stripeSessionId: `${sessionId}-exp`,
  });
  const datedIssued = await license.issueLicenseSerial(dated.license.id);
  await license.markLicenseActivated({
    serial: datedIssued.serial!,
    machineId: "copy-heartbeat-exp",
  });
  await prisma.license.update({
    where: { id: dated.license.id },
    data: { expiresAt: new Date("2026-01-01T00:00:00.000Z") },
  });
  const expiredHb = await verifyLicenseCopy({ machineId: "copy-heartbeat-exp" });
  if (expiredHb.status !== "expired") throw new Error("heartbeat expired");
  const storedExp = await prisma.license.findUnique({
    where: { id: dated.license.id },
  });
  if (storedExp?.status !== "expired") {
    throw new Error("heartbeat deveria marcar expired no banco");
  }

  await prisma.license.deleteMany({
    where: { stripeSessionId: { startsWith: "sprint5-smoke-" } },
  });

  console.log(
    "Sprint 5 ok: folga de 7 dias; fora da folga fecha; nuvem active/expired/revoked/unknown."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
