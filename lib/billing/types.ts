/**
 * Tipos compartilhados do sistema de billing
 */

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";

export interface SubscriptionInfo {
  plan: "FREE" | "PRO" | "BUSINESS";
  isLifetime: boolean;
  status: SubscriptionStatus | "none";
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface BillingActionResult {
  success: boolean;
  url?: string;
  error?: string;
}

