import type { EmailMetadata } from "./types";
import type { EmailCategory } from "../../types/email";

export type RuleClassification = {
  category: EmailCategory;
  reason: string;
  confident: boolean;
};

// ── Sender domain lists ────────────────────────────────────────────────────
const MARKETING_TOOL_DOMAINS = new Set([
  "mailchimp.com", "list-manage.com", "klaviyo.com", "sendgrid.net",
  "constantcontact.com", "campaignmonitor.com", "hubspot.com", "marketo.net",
  "salesforce.com", "pardot.com", "aweber.com", "convertkit.com",
  "drip.com", "activecampaign.com", "brevo.com", "sendinblue.com",
  "mailerlite.com", "getresponse.com", "omnisend.com", "postmark.app",
  "sendpulse.com", "elasticemail.com", "sparkpostmail.com", "mailgun.org",
]);

const SOCIAL_DOMAINS = new Set([
  "facebookmail.com", "twitter.com", "linkedin.com", "instagram.com",
  "notification.instagram.com", "notify.twitter.com", "community.twitter.com",
  "mail.instagram.com", "groups.linkedin.com", "e.linkedin.com",
  "pinterest.com", "tiktok.com", "reddit.com", "notification.youtube.com",
]);

const NEWSLETTER_LOCALS = new Set([
  "newsletter", "noreply", "no-reply", "mailer", "notifications",
  "updates", "news", "alerts", "digest", "weekly", "daily",
  "monthly", "bulletin", "announce", "broadcast", "campaign",
]);

// ── Header-based signals ───────────────────────────────────────────────────
const BULK_PRECEDENCE = new Set(["bulk", "list", "junk"]);

const MARKETING_MAILERS = [
  "mailchimp", "klaviyo", "sendgrid", "hubspot", "marketo", "salesforce",
  "constant contact", "campaign monitor", "brevo", "sendinblue",
  "mailerlite", "drip", "aweber", "activecampaign",
];

// ── Subject pattern matchers ───────────────────────────────────────────────
const PROMO_SUBJECT =
  /\b(\d+%\s*off|free\s+shipping|sale|deal|offer|discount|promo(\s*code)?|coupon|flash\s+sale|limited\s+time|exclusive|special\s+offer|today\s+only|act\s+now|last\s+chance|save\s+(up\s+to\s+)?\d|buy\s+\d|get\s+\d+%)\b/i;

const SECURITY_SUBJECT =
  /\b(security\s+(alert|notice|code|check)|verify|2fa|two.factor|mfa|password\s+(reset|changed?)|login\s+(attempt|alert)|sign.in\s+(alert|request)|account\s+(activity|access|alert|verify)|unusual\s+activity|suspicious\s+login)\b/i;

const FINANCIAL_SUBJECT =
  /\b(receipt|invoice|order\s*(confirm|#|number)|booking\s*confirm|reservation|e.?ticket|payment\s*(confirm|receipt|success)|subscription\s+(confirm|receipt)|renewal\s+notice|bank\s+statement|tax\s+(form|document)|payslip|salary)\b/i;

const SOCIAL_NOTIFICATION_SUBJECT =
  /\b(has\s+(commented|liked|shared|followed|mentioned|tagged)|new\s+message|accepted\s+your|connected\s+with|viewed\s+your|sent\s+you|request\s+to\s+connect|wants\s+to\s+connect)\b/i;

// ── Gmail labels ───────────────────────────────────────────────────────────
const SPAM_LABELS = new Set(["\\Spam", "\\Junk"]);
const PROMO_LABELS = new Set(["Promotions", "Category_Promotions"]);
const SOCIAL_LABELS = new Set(["Social", "Category_Social"]);

// ── Main classifier ────────────────────────────────────────────────────────
export function classifyByRules(email: EmailMetadata): RuleClassification {
  const { subject, fromEmail, labels, hasListUnsub } = email;
  const subjectLower = subject.toLowerCase();

  if (labels.some((l) => SPAM_LABELS.has(l))) {
    return { category: "DELETE", reason: "Marked as spam by Gmail", confident: true };
  }

  if (email.xSpamStatus?.toLowerCase().startsWith("yes")) {
    return { category: "DELETE", reason: "Spam score header positive", confident: true };
  }

  if (email.inReplyTo || email.references) {
    return { category: "KEEP", reason: "Part of a conversation thread", confident: true };
  }

  if (SECURITY_SUBJECT.test(subjectLower)) {
    return { category: "KEEP", reason: "Security or authentication notification", confident: true };
  }

  if (FINANCIAL_SUBJECT.test(subjectLower)) {
    return { category: "KEEP", reason: "Receipt, invoice, or financial notification", confident: true };
  }

  const senderDomain = fromEmail.split("@")[1]?.toLowerCase() ?? "";
  if (MARKETING_TOOL_DOMAINS.has(senderDomain)) {
    return hasListUnsub
      ? { category: "UNSUBSCRIBE", reason: "Sent via marketing platform with unsubscribe option", confident: true }
      : { category: "DELETE", reason: "Sent via marketing platform", confident: true };
  }

  if (SOCIAL_DOMAINS.has(senderDomain)) {
    return { category: "DELETE", reason: "Social media notification", confident: true };
  }

  if (BULK_PRECEDENCE.has(email.precedence?.toLowerCase().trim() ?? "")) {
    return hasListUnsub
      ? { category: "UNSUBSCRIBE", reason: "Bulk/list email with unsubscribe option", confident: true }
      : { category: "DELETE", reason: "Bulk/list email", confident: true };
  }

  const xMailer = email.xMailer?.toLowerCase() ?? "";
  if (MARKETING_MAILERS.some((m) => xMailer.includes(m))) {
    return hasListUnsub
      ? { category: "UNSUBSCRIBE", reason: "Sent via marketing platform (X-Mailer)", confident: true }
      : { category: "DELETE", reason: "Marketing email (X-Mailer)", confident: true };
  }

  if (email.xCampaignId) {
    return hasListUnsub
      ? { category: "UNSUBSCRIBE", reason: "Marketing campaign email", confident: true }
      : { category: "DELETE", reason: "Marketing campaign email", confident: true };
  }

  if (hasListUnsub) {
    return { category: "UNSUBSCRIBE", reason: "Newsletter or mailing list email", confident: true };
  }

  if (labels.some((l) => PROMO_LABELS.has(l))) {
    return { category: "DELETE", reason: "Promotional email (Gmail category)", confident: true };
  }

  if (labels.some((l) => SOCIAL_LABELS.has(l))) {
    return { category: "DELETE", reason: "Social notification (Gmail category)", confident: true };
  }

  if (PROMO_SUBJECT.test(subjectLower)) {
    return { category: "DELETE", reason: "Promotional keywords in subject", confident: false };
  }

  if (SOCIAL_NOTIFICATION_SUBJECT.test(subjectLower)) {
    return { category: "DELETE", reason: "Social media notification pattern", confident: false };
  }

  const senderLocal = fromEmail.split("@")[0]?.toLowerCase() ?? "";
  if (NEWSLETTER_LOCALS.has(senderLocal) || senderLocal.startsWith("no-reply") || senderLocal.startsWith("noreply")) {
    return { category: "REVIEW", reason: "Automated sender — needs review", confident: false };
  }

  return { category: "REVIEW", reason: "Could not auto-classify — please review", confident: false };
}
