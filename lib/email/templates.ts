/**
 * Mapeamento de templates de email
 * Server-only
 */

import * as React from "react";
import type { EmailTemplate } from "./types";
import { WelcomeEmail } from "@/emails/welcome-email";
import { ResetPasswordEmail } from "@/emails/reset-password";
import { MagicLinkEmail } from "@/emails/magic-link";
import { SubscriptionConfirmedEmail } from "@/emails/subscription-confirmed";
import { SubscriptionCanceledEmail } from "@/emails/subscription-canceled";
import { SubscriptionFailedEmail } from "@/emails/subscription-failed";
import { PasswordChangedEmail } from "@/emails/password-changed";
import { WorkspaceInviteEmail } from "@/emails/workspace-invite";
import { LicenseSerialEmail } from "@/emails/license-serial";
import { render } from "@react-email/render";

/**
 * Renderiza um template de email para HTML
 */
export async function renderEmailTemplate(
  template: EmailTemplate,
  props: Record<string, unknown>
): Promise<string> {
  try {
    let component: React.ReactElement;
    
    switch (template) {
      case "welcome":
        component = WelcomeEmail(props as { name: string; loginUrl: string });
        break;
      case "reset-password":
        component = ResetPasswordEmail(
          props as { resetUrl: string; expiresIn: string }
        );
        break;
      case "magic-link":
        component = MagicLinkEmail(
          props as { loginUrl: string; expiresIn: string }
        );
        break;
      case "subscription-confirmed":
        component = SubscriptionConfirmedEmail(
          props as { plan: string; amount: string; billingUrl: string }
        );
        break;
      case "subscription-canceled":
        component = SubscriptionCanceledEmail(
          props as { plan: string; billingUrl: string }
        );
        break;
      case "subscription-failed":
        component = SubscriptionFailedEmail(
          props as { plan: string; amount: string; billingUrl: string }
        );
        break;
      case "password-changed":
        component = PasswordChangedEmail(
          props as { name: string; timestamp: string }
        );
        break;
      case "workspace-invite":
        component = WorkspaceInviteEmail(
          props as {
            workspaceName: string;
            inviterName: string;
            inviterEmail: string;
            role: string;
            acceptUrl: string;
            expiresIn: string;
          }
        );
        break;
      case "license-serial":
        component = LicenseSerialEmail(
          props as {
            editionLabel: string;
            durationLabel: string;
            serial: string;
            installerUrl: string | null;
            successUrl: string;
          }
        );
        break;
      default:
        throw new Error(`Template desconhecido: ${template}`);
    }

    // Render pode ser síncrono ou assíncrono dependendo da versão
    const html = await Promise.resolve(render(component));
    return html;
  } catch (error) {
    console.error(`[email] Erro ao renderizar template ${template}:`, error);
    throw error; // Re-lança para ser capturado em send-email.ts
  }
}

