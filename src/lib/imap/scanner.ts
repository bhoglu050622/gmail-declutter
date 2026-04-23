import { createImapClient } from "./client";
import { classifyByRules } from "../gmail/classifier";
import { scanEmitter } from "../events";
import type { EmailMetadata } from "../gmail/types";
import type { EmailCategory } from "../../types/email";

export interface ScanResult {
  messageId: string;
  category: EmailCategory;
  reason: string;
  confidence: number;
  classifiedBy: "RULES";
  metadata: EmailMetadata;
}

const HEADER_NAMES = [
  "list-unsubscribe",
  "list-unsubscribe-post",
  "in-reply-to",
  "references",
  "precedence",
  "x-mailer",
  "x-campaign-id",
  "x-mailchimp-campaign-id",
  "x-klaviyo-campaign-id",
  "x-sendgrid-origin",
  "x-spam-status",
];

// Larger batch = fewer IMAP round trips. 200 is safe for Gmail without triggering limits.
const FETCH_BATCH = 200;

// Emit progress every N emails during classification
const CLASSIFY_EMIT_EVERY = 500;

function parseHeaderBuffer(buf: Buffer): Record<string, string> {
  const text = buf.toString("utf8");
  const unfolded = text.replace(/\r?\n[ \t]+/g, " ");
  const result: Record<string, string> = {};
  for (const line of unfolded.split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).toLowerCase().trim();
      const value = line.slice(colonIdx + 1).trim();
      if (!result[key]) result[key] = value;
    }
  }
  return result;
}

function parseFrom(raw: string): { display: string; email: string } {
  const match = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return {
      display: match[1].trim().replace(/^"|"$/g, ""),
      email: match[2].trim().toLowerCase(),
    };
  }
  const clean = raw.trim().toLowerCase();
  return { display: clean, email: clean };
}

type FetchedMessage = {
  messageId: string;
  headers: Record<string, string>;
  envelope: Record<string, unknown>;
  labels: Set<string>;
};

async function fetchMailboxMessages(
  email: string,
  password: string,
  mailbox: string,
  searchCriteria: Record<string, unknown>,
  maxMessages: number,
  mailboxPrefix: string,
  onProgress?: (fetched: number, total: number, label: string) => void
): Promise<FetchedMessage[]> {
  const client = createImapClient(email, password);
  const results: FetchedMessage[] = [];

  await client.connect();
  let lock;
  try {
    lock = await client.getMailboxLock(mailbox);
  } catch {
    await client.logout();
    return results;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allUids = await (client as any).search(searchCriteria, { uid: true }) as number[];
    // Take the most recent N (highest UIDs are newest)
    const uids: number[] = maxMessages >= Number.MAX_SAFE_INTEGER
      ? allUids
      : allUids.slice(-maxMessages);

    const label = mailboxPrefix === "INBOX" ? "inbox" : "spam";
    onProgress?.(0, uids.length, label);

    for (let i = 0; i < uids.length; i += FETCH_BATCH) {
      const chunk = uids.slice(i, i + FETCH_BATCH);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const msg of (client as any).fetch(chunk, {
        uid: true,
        envelope: true,
        headers: HEADER_NAMES,
        labels: true,
      }, { uid: true })) {
        const headers = msg.headers ? parseHeaderBuffer(msg.headers as Buffer) : {};
        results.push({
          messageId: `${mailboxPrefix}:${msg.uid}`,
          headers,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          envelope: msg.envelope as Record<string, unknown>,
          labels: (msg.labels as Set<string>) ?? new Set<string>(),
        });
      }
      onProgress?.(Math.min(i + FETCH_BATCH, uids.length), uids.length, label);
    }
  } finally {
    lock.release();
    await client.logout();
  }

  return results;
}

export async function runScan(
  email: string,
  appPassword: string,
  scanId: string,
  scanMode: string,
  maxMessages = 5000
): Promise<ScanResult[]> {
  emit(scanId, { phase: "LISTING", message: "Connecting to Gmail IMAP..." });

  const isFullScan = scanMode === "full";
  const effectiveMax = isFullScan ? Number.MAX_SAFE_INTEGER : maxMessages;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  let inboxCriteria: Record<string, unknown>;
  const spamCriteria: Record<string, unknown> = { all: true };

  if (scanMode === "recent") {
    inboxCriteria = { since: thirtyDaysAgo };
  } else if (scanMode === "smart") {
    inboxCriteria = { before: thirtyDaysAgo };
  } else {
    inboxCriteria = { all: true };
  }

  const spamMax = scanMode === "recent" ? 0
    : isFullScan ? Number.MAX_SAFE_INTEGER
    : Math.min(500, Math.floor(effectiveMax * 0.1));

  // Track total across both mailboxes for unified progress
  let inboxTotal = 0;
  let spamTotal = 0;
  let fetchedCount = 0;

  emit(scanId, { phase: "LISTING", message: "Listing inbox messages..." });

  const inboxMessages = await fetchMailboxMessages(
    email, appPassword, "INBOX", inboxCriteria, effectiveMax, "INBOX",
    (fetched, total, label) => {
      if (label === "inbox") inboxTotal = total;
      fetchedCount = fetched;
      const grandTotal = inboxTotal + spamTotal;
      emit(scanId, {
        phase: "FETCHING",
        processed: fetchedCount,
        total: grandTotal || total,
        message: `Fetching inbox: ${fetched.toLocaleString()} / ${total.toLocaleString()} emails`,
      });
    }
  );

  fetchedCount = inboxMessages.length;

  const spamMessages = spamMax > 0
    ? await fetchMailboxMessages(
        email, appPassword, "[Gmail]/Spam", spamCriteria, spamMax, "[Gmail]/Spam",
        (fetched, total, label) => {
          if (label === "spam") spamTotal = total;
          const grandTotal = inboxTotal + total;
          emit(scanId, {
            phase: "FETCHING",
            processed: inboxMessages.length + fetched,
            total: grandTotal,
            message: `Fetching spam: ${fetched.toLocaleString()} / ${total.toLocaleString()} emails`,
          });
        }
      )
    : [];

  const allMessages = isFullScan
    ? [...inboxMessages, ...spamMessages]
    : [...inboxMessages, ...spamMessages].slice(0, effectiveMax);

  emit(scanId, {
    phase: "CLASSIFYING_RULES",
    processed: 0,
    total: allMessages.length,
    message: `Found ${allMessages.length.toLocaleString()} emails — classifying...`,
  });

  const results: ScanResult[] = [];

  for (let i = 0; i < allMessages.length; i++) {
    const msg = allMessages[i];
    const env = msg.envelope;

    const fromArr = env.from as Array<{ name?: string; address?: string }> | undefined;
    const firstFrom = fromArr?.[0];
    const rawFrom = firstFrom
      ? `${firstFrom.name ?? ""} <${firstFrom.address ?? ""}>`.trim()
      : "";
    const { display, email: fromEmail } = parseFrom(rawFrom || "unknown@unknown.com");

    const labels = Array.from(msg.labels);
    const listUnsub = msg.headers["list-unsubscribe"] ?? "";
    const dateVal = env.date as Date | string | undefined;

    const metadata: EmailMetadata = {
      id: msg.messageId,
      from: display || fromEmail,
      fromEmail,
      subject: (env.subject as string) ?? "",
      snippet: "",
      labels,
      hasListUnsub: !!listUnsub,
      listUnsubHeader: listUnsub || undefined,
      listUnsubPostHeader: msg.headers["list-unsubscribe-post"] || undefined,
      inReplyTo: msg.headers["in-reply-to"] || undefined,
      references: msg.headers["references"] || undefined,
      dateMs: dateVal ? new Date(dateVal).getTime() : undefined,
      precedence: msg.headers["precedence"],
      xMailer: msg.headers["x-mailer"],
      xCampaignId:
        msg.headers["x-campaign-id"] ||
        msg.headers["x-mailchimp-campaign-id"] ||
        msg.headers["x-klaviyo-campaign-id"],
      xSpamStatus: msg.headers["x-spam-status"],
    };

    const { category, reason, confident } = classifyByRules(metadata);

    results.push({
      messageId: msg.messageId,
      category,
      reason,
      confidence: confident ? 1.0 : 0.5,
      classifiedBy: "RULES",
      metadata,
    });

    if (i % CLASSIFY_EMIT_EVERY === 0 && i > 0) {
      emit(scanId, {
        phase: "CLASSIFYING_RULES",
        processed: i,
        total: allMessages.length,
        message: `Classifying: ${i.toLocaleString()} / ${allMessages.length.toLocaleString()} emails`,
      });
    }
  }

  const counts = {
    keep: results.filter((r) => r.category === "KEEP").length,
    delete: results.filter((r) => r.category === "DELETE").length,
    unsubscribe: results.filter((r) => r.category === "UNSUBSCRIBE").length,
    review: results.filter((r) => r.category === "REVIEW").length,
  };

  emit(scanId, {
    phase: "COMPLETE",
    processed: results.length,
    total: results.length,
    message: `Done — ${results.length.toLocaleString()} emails scanned`,
    counts,
  });

  return results;
}

function emit(scanId: string, data: Record<string, unknown>) {
  scanEmitter.emit(`scan:${scanId}`, data);
}
