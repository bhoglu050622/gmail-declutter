export interface EmailMetadata {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  labels: string[];
  hasListUnsub: boolean;
  listUnsubHeader?: string;
  listUnsubPostHeader?: string;
  inReplyTo?: string;
  references?: string;
  dateMs?: number;
  // Extra headers for enhanced rule classification
  precedence?: string;
  xMailer?: string;
  xCampaignId?: string;
  xSpamStatus?: string;
}
