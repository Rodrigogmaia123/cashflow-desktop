import { stripe } from "@/lib/billing/stripe";
import { sendLicenseSerialEmail } from "@/lib/email/send-email";
import {
  editionLabel,
  licenseDurationLabel,
} from "./catalog";
import { fulfillDesktopLicenseSession } from "./fulfill-checkout";
import { installerUrlForEdition } from "./installers";
import {
  createAdminIssuedLicense,
  findLicenseById,
  findLicenseByStripeSession,
  issueLicenseSerial,
  markLicenseSerialEmailed,
} from "./store";
import type { LicenseDuration, LicenseEdition } from "@/lib/prisma-enums";
import { LicenseError, type LicenseReveal } from "./types";

export type { LicenseReveal };

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:3456"
  );
}

function isCheckoutSessionId(value: string) {
  return value.startsWith("cs_test_") || value.startsWith("cs_live_");
}

async function sendSerialEmail(
  licenseId: string,
  serial: string,
  force: boolean
): Promise<boolean> {
  const license = await findLicenseById(licenseId);
  if (!license) return false;
  if (!force && license.serialEmailedAt) return true;

  const sent = await sendLicenseSerialEmail({
    to: license.email,
    serial,
    editionLabel: editionLabel(license.edition),
    durationLabel: licenseDurationLabel(license.duration),
    installerUrl: installerUrlForEdition(license.edition),
    successUrl: license.stripeSessionId.startsWith("admin:")
      ? `${appBaseUrl()}/ativar`
      : `${appBaseUrl()}/compra/sucesso?session_id=${encodeURIComponent(license.stripeSessionId)}`,
  });

  await markLicenseSerialEmailed(licenseId);
  return sent;
}

export async function issueAdminLicense(input: {
  email: string;
  edition: LicenseEdition;
  duration: LicenseDuration;
  sendEmail: boolean;
}): Promise<{
  ok: true;
  serial: string;
  emailed: boolean;
  licenseId: string;
} | {
  ok: false;
  reason: string;
}> {
  try {
    const created = await createAdminIssuedLicense({
      email: input.email,
      edition: input.edition,
      duration: input.duration,
    });

    let emailed = false;
    if (input.sendEmail) {
      emailed = await sendSerialEmail(created.license.id, created.serial, true);
    }

    return {
      ok: true,
      serial: created.serial,
      emailed,
      licenseId: created.license.id,
    };
  } catch (error) {
    if (error instanceof LicenseError) {
      return { ok: false, reason: error.message };
    }
    console.error("[license/admin-issue]", error);
    return { ok: false, reason: "Não foi possível criar a chave." };
  }
}

export async function deliverIssuedLicenseById(licenseId: string) {
  const issued = await issueLicenseSerial(licenseId);
  if (!issued.serial) {
    return { ok: false as const, reason: "no_serial" };
  }
  const emailed = await sendSerialEmail(licenseId, issued.serial, false);
  return { ok: true as const, serial: issued.serial, emailed };
}

export async function resendLicenseEmail(licenseId: string): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const issued = await issueLicenseSerial(licenseId);
  if (!issued.serial) {
    return {
      ok: false,
      reason: "Esta licença ainda não tem chave para reenviar.",
    };
  }
  const sent = await sendSerialEmail(licenseId, issued.serial, true);
  if (!sent) {
    return { ok: false, reason: "Não foi possível enviar o e-mail agora." };
  }
  return { ok: true };
}

export async function revealLicenseForCheckoutSession(
  sessionId: string
): Promise<LicenseReveal> {
  const id = sessionId.trim();
  if (!isCheckoutSessionId(id)) {
    return { status: "invalid" };
  }

  let license = await findLicenseByStripeSession(id);

  if (!license) {
    try {
      const session = await stripe.checkout.sessions.retrieve(id);
      const fulfilled = await fulfillDesktopLicenseSession(session);
      if (fulfilled.outcome === "ignored") {
        if (fulfilled.reason === "not_paid") return { status: "unpaid" };
        if (
          fulfilled.reason === "not_desktop_license" ||
          fulfilled.reason === "not_one_time_payment"
        ) {
          return { status: "invalid" };
        }
      }
    } catch (error) {
      console.warn("[license/deliver] sessão Stripe ainda não disponível", id, error);
    }
    license = await findLicenseByStripeSession(id);
  }

  if (!license) return { status: "waiting" };

  const issued = await issueLicenseSerial(license.id);
  if (!issued.serial) {
    console.error(
      "[license/deliver] serial emitido sem envelope; não dá para mostrar a chave",
      license.id
    );
    return { status: "waiting" };
  }

  const emailed = await sendSerialEmail(license.id, issued.serial, false);

  return {
    status: "ready",
    serial: issued.serial,
    edition: issued.license.edition,
    duration: issued.license.duration,
    editionLabel: editionLabel(issued.license.edition),
    durationLabel: licenseDurationLabel(issued.license.duration),
    installerUrl: installerUrlForEdition(issued.license.edition),
    email: issued.license.email,
    emailed,
  };
}
