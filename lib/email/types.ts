/**
 * Tipos para sistema de emails transacionais
 * Server-only
 */

export type EmailTemplate =
  | "welcome"
  | "reset-password"
  | "magic-link"
  | "subscription-confirmed"
  | "subscription-canceled"
  | "subscription-failed"
  | "password-changed"
  | "workspace-invite"
  | "license-serial";

export interface EmailPayload {
  to: string;
  subject: string;
  template: EmailTemplate;
  props: Record<string, unknown>;
}

export interface WelcomeEmailProps {
  name: string;
  loginUrl: string;
}

export interface ResetPasswordEmailProps {
  resetUrl: string;
  expiresIn: string;
}

export interface MagicLinkEmailProps {
  loginUrl: string;
  expiresIn: string;
}

export interface SubscriptionConfirmedEmailProps {
  plan: string;
  amount: string;
  billingUrl: string;
}

export interface SubscriptionCanceledEmailProps {
  plan: string;
  billingUrl: string;
}

export interface SubscriptionFailedEmailProps {
  plan: string;
  amount: string;
  billingUrl: string;
}

export interface PasswordChangedEmailProps {
  name: string;
  timestamp: string;
}

export interface WorkspaceInviteEmailProps {
  workspaceName: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  acceptUrl: string;
  expiresIn: string;
}

export interface LicenseSerialEmailProps {
  editionLabel: string;
  durationLabel: string;
  serial: string;
  installerUrl: string | null;
  successUrl: string;
}

