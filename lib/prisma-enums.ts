export type ExpenseType = "VARIABLE" | "FIXED";
export type CategoryType = "INCOME" | "EXPENSE" | "BOTH";
export type MetricLevel = "INFO" | "WARN" | "ERROR";
export type UserPlan = "FREE" | "PRO" | "BUSINESS";
export type SubscriptionPlan = "PRO" | "BUSINESS";
export type AccountType = "PF" | "PJ";
export type OfferStatus = "ACTIVE" | "PAUSED" | "DEAD";
export type OfferCountry = "AR" | "BR" | "US" | "MX" | "CO";
export type Currency = "BRL" | "USD" | "ARS" | "MXN" | "COP";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";
export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type InviteStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
export type ReportType = "CASHFLOW" | "BY_CATEGORY" | "BY_PERIOD";
export type ReportVisualization = "TABLE" | "LINE_CHART" | "BAR_CHART";
export type BudgetPeriodType = "MONTHLY" | "CUSTOM";
export type NotificationType =
  | "BUDGET_WARNING_75"
  | "BUDGET_WARNING_90"
  | "BUDGET_EXCEEDED_100"
  | "BUDGET_CRITICAL_EXCEEDED";
export type NotificationStatus = "UNREAD" | "READ" | "DISMISSED";
export type LicenseEdition = "pro" | "pessoal";
export type LicenseDuration = "1d" | "3m" | "5m" | "annual" | "lifetime";
export type LicenseStatus = "paid" | "active" | "revoked" | "expired";
export type LicenseOrderStatus =
  | "generated"
  | "paid"
  | "failed"
  | "canceled";
