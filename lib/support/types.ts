export type SupportAuthor = "customer" | "admin";
export type SupportThreadStatus = "open" | "resolved" | "archived";

export type SupportMessageDTO = {
  id: string;
  author: SupportAuthor;
  body: string;
  createdAt: string;
};

export type SupportThreadDTO = {
  id: string;
  email: string;
  emailMasked: string;
  status: SupportThreadStatus;
  lastMessageAt: string | null;
  lastPreview: string | null;
  lastAuthor: SupportAuthor | null;
  unreadAdmin: number;
  resolvedAt: string | null;
  editionsLabel: string;
};

export type SupportCustomerSnapshot = {
  ok: true;
  emailMasked: string;
  status: SupportThreadStatus;
  resolvedAt: string | null;
  historyDays: number;
  messages: SupportMessageDTO[];
};

export type SupportCustomerError = {
  ok: false;
  code: string;
  message: string;
};
