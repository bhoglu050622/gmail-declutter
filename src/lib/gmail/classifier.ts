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
  "sendgrid.com", "sg-links.com", "mcsv.net", "mailjet.com",
  "createsend.com", "cmail20.com", "cmail19.com", "em.example.com",
  "exacttarget.com", "mkt51.net", "mkt61.net", "eloqua.com",
  "responsys.net", "dotmailer.com", "dotdigital.com",
]);

const SOCIAL_DOMAINS = new Set([
  "facebookmail.com", "twitter.com", "linkedin.com", "instagram.com",
  "notification.instagram.com", "notify.twitter.com", "community.twitter.com",
  "mail.instagram.com", "groups.linkedin.com", "e.linkedin.com",
  "pinterest.com", "tiktok.com", "reddit.com", "notification.youtube.com",
  "quora.com", "tumblr.com", "snapchat.com", "discord.com",
  "notifications.google.com", "plus.google.com",
]);

// Local parts of sender addresses that are always automated
const AUTOMATED_LOCALS = new Set([
  "noreply", "no-reply", "no_reply", "donotreply", "do-not-reply",
  "do_not_reply", "mailer", "mailer-daemon", "postmaster", "bounce",
  "bounces", "notifications", "notification", "newsletter", "news",
  "updates", "update", "alerts", "alert", "digest", "weekly", "daily",
  "monthly", "bulletin", "announce", "broadcast", "campaign",
  "info", "hello", "hi", "hey", "greetings", "welcome",
  "team", "support", "help", "feedback", "contact", "admin",
  "service", "account", "billing", "payments", "sales", "marketing",
  "offers", "deals", "promo", "promotions", "offers", "coupons",
  "reply", "auto-reply", "auto_reply", "automated", "system",
  "webmaster", "hostmaster", "abuse", "security",
  "membership", "subscriptions", "unsubscribe", "mail",
  "send", "sender", "from", "email",
]);

// Subdomains that indicate automated/bulk mail infrastructure
const AUTOMATED_SUBDOMAIN_PREFIXES = [
  "email.", "mail.", "em.", "e.", "send.", "sends.", "news.",
  "info.", "notify.", "alerts.", "messages.", "notification.",
  "mailout.", "bulk.", "blast.", "campaigns.", "campaign.",
  "mg.", "sg.", "relay.", "bounce.", "bounces.", "sp.",
  "m.", "go.", "click.", "links.", "track.", "tracking.",
];

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
  "mailerlite", "drip", "aweber", "activecampaign", "postmark",
  "mailjet", "eloqua", "responsys", "dotmailer",
];

// ── Subject pattern matchers ───────────────────────────────────────────────
const PROMO_SUBJECT =
  /\b(\d+%\s*off|free\s+shipping|sale|deal|offer|discount|promo(\s*code)?|coupon|flash\s+sale|limited\s+time|exclusive|special\s+offer|today\s+only|act\s+now|last\s+chance|save\s+(up\s+to\s+)?\d|buy\s+\d|get\s+\d+%|shop\s+now|new\s+arrivals?|just\s+dropped|back\s+in\s+stock|members?\s+only|vip\s+access|early\s+access|introducing|don.t\s+miss)\b/i;

const SECURITY_SUBJECT =
  /\b(security\s+(alert|notice|code|check)|verify|2fa|two.factor|mfa|password\s+(reset|changed?)|login\s+(attempt|alert)|sign.in\s+(alert|request)|account\s+(activity|access|alert|verify)|unusual\s+activity|suspicious\s+login)\b/i;

const FINANCIAL_SUBJECT =
  /\b(receipt|invoice|order\s*(confirm|#|number)|booking\s*confirm|reservation|e.?ticket|payment\s*(confirm|receipt|success)|subscription\s+(confirm|receipt)|renewal\s+notice|bank\s+statement|tax\s+(form|document)|payslip|salary|refund\s+(processed|issued)|statement\s+ready)\b/i;

const SOCIAL_NOTIFICATION_SUBJECT =
  /\b(has\s+(commented|liked|shared|followed|mentioned|tagged)|new\s+message|accepted\s+your|connected\s+with|viewed\s+your|sent\s+you|request\s+to\s+connect|wants\s+to\s+connect|reacted\s+to|replied\s+to\s+your)\b/i;

// Generic notification/automated emails — nearly always safe to delete
const NOTIFICATION_SUBJECT =
  /\b(you\s+have\s+(a\s+new|been|an?\s+new?)|new\s+(activity|notification|update|message|comment|reply|follower|like|connection)|your\s+(account|profile|subscription|order|package|delivery|shipment|trial|membership|plan)\s+(has\s+been|is|will\s+be|was)|has\s+shipped|out\s+for\s+delivery|delivered|tracking\s+(update|number)|confirm\s+your\s+(email|account|subscription)|action\s+required|important\s+(update|notice|information)|we.ve\s+(updated|changed|improved)|new\s+terms|privacy\s+policy|summary\s+for|weekly\s+(digest|summary|roundup)|monthly\s+(digest|summary|report)|here.s\s+(what\s+you\s+missed|your|this\s+week)|catch\s+up\s+on|top\s+stories|trending\s+now|this\s+week\s+in|this\s+month\s+in|recap|roundup)\b/i;

// ── Gmail labels ───────────────────────────────────────────────────────────
const SPAM_LABELS = new Set(["\\Spam", "\\Junk"]);
const PROMO_LABELS = new Set(["Promotions", "Category_Promotions"]);
const SOCIAL_LABELS = new Set(["Social", "Category_Social"]);
const UPDATES_LABELS = new Set(["Updates", "Category_Updates"]);
const FORUMS_LABELS = new Set(["Forums", "Category_Forums"]);

// One year in ms — emails older than this with no thread are almost certainly safe to delete
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

// ── Helpers ────────────────────────────────────────────────────────────────
function isAutomatedSubdomain(domain: string): boolean {
  return AUTOMATED_SUBDOMAIN_PREFIXES.some((prefix) => domain.startsWith(prefix));
}

function isOlderThan(dateMs: number | undefined, thresholdMs: number): boolean {
  if (!dateMs) return false;
  return Date.now() - dateMs > thresholdMs;
}

// ── Main classifier ────────────────────────────────────────────────────────
export function classifyByRules(email: EmailMetadata): RuleClassification {
  const { subject, fromEmail, labels, hasListUnsub } = email;
  const subjectLower = subject.toLowerCase();

  // ── Hard KEEP signals (check these first) ──────────────────────────────
  if (labels.some((l) => SPAM_LABELS.has(l))) {
    return { category: "DELETE", reason: "Marked as spam by Gmail", confident: true };
  }

  if (email.xSpamStatus?.toLowerCase().startsWith("yes")) {
    return { category: "DELETE", reason: "Spam score header positive", confident: true };
  }

  // Conversation thread = almost certainly important
  if (email.inReplyTo || email.references) {
    return { category: "KEEP", reason: "Part of a conversation thread", confident: true };
  }

  if (SECURITY_SUBJECT.test(subjectLower)) {
    return { category: "KEEP", reason: "Security or authentication notification", confident: true };
  }

  if (FINANCIAL_SUBJECT.test(subjectLower)) {
    return { category: "KEEP", reason: "Receipt, invoice, or financial notification", confident: true };
  }

  // ── Hard DELETE/UNSUBSCRIBE signals ────────────────────────────────────
  const senderDomain = fromEmail.split("@")[1]?.toLowerCase() ?? "";
  const senderLocal = fromEmail.split("@")[0]?.toLowerCase() ?? "";

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

  // Updates/Forums tabs are automated digests and forum posts
  if (labels.some((l) => UPDATES_LABELS.has(l))) {
    return { category: "DELETE", reason: "Automated update email (Gmail Updates category)", confident: true };
  }

  if (labels.some((l) => FORUMS_LABELS.has(l))) {
    return { category: "DELETE", reason: "Forum or group notification", confident: true };
  }

  // Automated sender local part (noreply, info, support, etc.)
  if (
    AUTOMATED_LOCALS.has(senderLocal) ||
    senderLocal.startsWith("no-reply") ||
    senderLocal.startsWith("noreply") ||
    senderLocal.startsWith("do-not-reply") ||
    senderLocal.startsWith("donotreply") ||
    senderLocal.startsWith("bounce") ||
    senderLocal.startsWith("notification") ||
    senderLocal.endsWith("-noreply") ||
    senderLocal.endsWith(".noreply")
  ) {
    return { category: "DELETE", reason: "Automated sender address", confident: true };
  }

  // Automated subdomain (email.brand.com, mail.brand.com, em.brand.com, etc.)
  if (isAutomatedSubdomain(senderDomain)) {
    return hasListUnsub
      ? { category: "UNSUBSCRIBE", reason: "Automated mail subdomain with unsubscribe option", confident: true }
      : { category: "DELETE", reason: "Sent from automated mail subdomain", confident: true };
  }

  // Promotional subject keywords
  if (PROMO_SUBJECT.test(subjectLower)) {
    return { category: "DELETE", reason: "Promotional keywords in subject", confident: true };
  }

  // Social notification subject
  if (SOCIAL_NOTIFICATION_SUBJECT.test(subjectLower)) {
    return { category: "DELETE", reason: "Social media notification pattern", confident: true };
  }

  // Generic automated notification subjects
  if (NOTIFICATION_SUBJECT.test(subjectLower)) {
    return { category: "DELETE", reason: "Automated notification or digest email", confident: true };
  }

  // Newsletter-style sender local (secondary check for ones not in AUTOMATED_LOCALS)
  if (NEWSLETTER_LOCALS.has(senderLocal)) {
    return { category: "DELETE", reason: "Newsletter-style sender", confident: true };
  }

  // Age-based heuristic: email > 1 year old with no thread → very likely clutter
  if (isOlderThan(email.dateMs, ONE_YEAR_MS)) {
    return { category: "DELETE", reason: "Unthreaded email older than 1 year", confident: true };
  }

  // 6 months old + no strong personal signal → probably clutter
  if (isOlderThan(email.dateMs, SIX_MONTHS_MS)) {
    return { category: "DELETE", reason: "Unthreaded email older than 6 months", confident: false };
  }

  // True ambiguous — recent one-way email from an unknown sender
  return { category: "REVIEW", reason: "Recent email — could not auto-classify", confident: true };
}
