export type EmailCategory = "KEEP" | "DELETE" | "UNSUBSCRIBE" | "REVIEW";
export type ActionStatus =
  | "PENDING"
  | "TRASHED"
  | "DELETED"
  | "UNSUBSCRIBED"
  | "FAILED";
export type ClassifiedBy = "RULES" | "AI";

export interface ClassifiedEmail {
  id: string;
  scanId: string;
  messageId: string;
  category: EmailCategory;
  confidence: number;
  reason?: string | null;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  dateMs?: number | null;
  hasListUnsub: boolean;
  listUnsubHeader?: string | null;
  listUnsubPostHeader?: string | null;
  userOverride?: "KEEP" | "DELETE" | "UNSUBSCRIBE" | null;
  actionStatus?: ActionStatus | null;
  classifiedBy: ClassifiedBy;
}

export interface EmailSummary {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  labels: string[];
  hasListUnsub: boolean;
  listUnsubHeader?: string;
  listUnsubPostHeader?: string;
  inReplyTo?: string;
  dateMs?: number;
}
