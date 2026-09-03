/**
 * Helper genérico para envio de emails
 * Server-only
 */

import { resend, EMAIL_FROM } from "./resend";
import { renderEmailTemplate } from "./templates";
import type { EmailPayload, EmailTemplate } from "./types";

/**
 * Envia um email transacional usando Resend
 * 
 * @param payload - Dados do email (to, subject, template, props)
 * @returns Promise que resolve quando o email é enviado
 * 
 * @example
 * await sendEmail({
 *   to: "user@example.com",
 *   subject: "Bem-vindo ao Cashflow Pro",
 *   template: "welcome",
 *   props: { name: "João", loginUrl: "https://..." }
 * });
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    // Obtém o cliente Resend (lazy initialization)
    const resendClient = resend();
    
    // Se Resend não estiver configurado, apenas loga e retorna
    if (!resendClient) {
      console.warn(
        `[email] Resend não configurado. Email ${payload.template} não enviado para ${payload.to}`
      );
      return false;
    }

    // Renderiza o template para HTML
    let html: string;
    try {
      html = await renderEmailTemplate(payload.template, payload.props);
    } catch (renderError) {
      console.error(
        `[email] Erro ao renderizar template ${payload.template}:`,
        renderError
      );
      // Não lança erro - email é side-effect
      return false;
    }

    // Envia via Resend
    const { error } = await resendClient.emails.send({
      from: EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html,
    });

    if (error) {
      console.error(`[email] Erro ao enviar email ${payload.template}:`, error);
      // Não lança erro - email é side-effect, não deve quebrar o fluxo
      return false;
    }

    console.log(`[email] ✅ Email ${payload.template} enviado para ${payload.to}`);
    return true;
  } catch (error) {
    console.error(`[email] ❌ Erro ao processar email ${payload.template}:`, error);
    // Não lança erro - email é side-effect
    return false;
  }
}

/**
 * Helper para enviar email de boas-vindas
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  await sendEmail({
    to: email,
    subject: "Bem-vindo ao Cashflow Pro! 🎉",
    template: "welcome",
    props: {
      name,
      loginUrl: `${appUrl}/app/overview`,
    },
  });
}

/**
 * Helper para enviar email de reset de senha
 */
export async function sendResetPasswordEmail(
  email: string,
  token: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Redefinir sua senha - Cashflow Pro",
    template: "reset-password",
    props: {
      resetUrl,
      expiresIn: "1 hora",
    },
  });
}

/**
 * Helper para enviar magic link
 */
export async function sendMagicLinkEmail(
  email: string,
  url: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Seu link de acesso - Cashflow Pro",
    template: "magic-link",
    props: {
      loginUrl: url,
      expiresIn: "15 minutos",
    },
  });
}

/**
 * Helper para enviar email de assinatura confirmada
 */
export async function sendSubscriptionConfirmedEmail(
  email: string,
  plan: string,
  amount: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  await sendEmail({
    to: email,
    subject: "Assinatura confirmada - Cashflow Pro",
    template: "subscription-confirmed",
    props: {
      plan,
      amount,
      billingUrl: `${appUrl}/app/billing`,
    },
  });
}

/**
 * Helper para enviar email de assinatura cancelada
 */
export async function sendSubscriptionCanceledEmail(
  email: string,
  plan: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  await sendEmail({
    to: email,
    subject: "Assinatura cancelada - Cashflow Pro",
    template: "subscription-canceled",
    props: {
      plan,
      billingUrl: `${appUrl}/app/billing`,
    },
  });
}

/**
 * Helper para enviar email de falha de pagamento
 */
export async function sendSubscriptionFailedEmail(
  email: string,
  plan: string,
  amount: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  await sendEmail({
    to: email,
    subject: "Falha no pagamento - Cashflow Pro",
    template: "subscription-failed",
    props: {
      plan,
      amount,
      billingUrl: `${appUrl}/app/billing`,
    },
  });
}

/**
 * Helper para enviar email de convite para workspace
 */
export async function sendWorkspaceInviteEmail(
  email: string,
  workspaceName: string,
  inviterName: string,
  inviterEmail: string,
  role: string,
  token: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const acceptUrl = `${appUrl}/app/accept-invite?token=${token}`;

  await sendEmail({
    to: email,
    subject: `Convite para ${workspaceName} - Cashflow Pro`,
    template: "workspace-invite",
    props: {
      workspaceName,
      inviterName,
      inviterEmail,
      role,
      acceptUrl,
      expiresIn: "7 dias",
    },
  });
}

export async function sendLicenseSerialEmail(input: {
  to: string;
  serial: string;
  editionLabel: string;
  durationLabel: string;
  installerUrl: string | null;
  successUrl: string;
}): Promise<boolean> {
  return sendEmail({
    to: input.to,
    subject: `Sua chave do ${input.editionLabel}`,
    template: "license-serial",
    props: {
      editionLabel: input.editionLabel,
      durationLabel: input.durationLabel,
      serial: input.serial,
      installerUrl: input.installerUrl,
      successUrl: input.successUrl,
    },
  });
}

