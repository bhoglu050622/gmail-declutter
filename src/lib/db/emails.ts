import { db, initDb } from "./client";
import { classifiedEmails, deletionLogs } from "../../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { ScanResult } from "../imap/scanner";

let initialized = false;
function ensureInit() {
  if (!initialized) {
    initDb();
    initialized = true;
  }
}

export function bulkInsertEmails(scanId: string, results: ScanResult[]) {
  ensureInit();
  const stmt = db.insert(classifiedEmails);
  const rows = results.map((r) => ({
    id: crypto.randomUUID(),
    scanId,
    messageId: r.messageId,
    category: r.category,
    confidence: r.confidence,
    reason: r.reason,
    sender: r.metadata.from,
    senderEmail: r.metadata.fromEmail,
    subject: r.metadata.subject,
    snippet: r.metadata.snippet,
    dateMs: r.metadata.dateMs,
    hasListUnsub: r.metadata.hasListUnsub,
    listUnsubHeader: r.metadata.listUnsubHeader,
    listUnsubPostHeader: r.metadata.listUnsubPostHeader,
    classifiedBy: r.classifiedBy,
  }));

  if (rows.length === 0) return;

  for (let i = 0; i < rows.length; i += 500) {
    stmt.values(rows.slice(i, i + 500)).run();
  }
}

export function getEmailsByScan(scanId: string, category?: string) {
  ensureInit();
  if (category) {
    return db
      .select()
      .from(classifiedEmails)
      .where(
        and(
          eq(classifiedEmails.scanId, scanId),
          eq(classifiedEmails.category, category as "KEEP" | "DELETE" | "UNSUBSCRIBE" | "REVIEW")
        )
      )
      .all();
  }
  return db
    .select()
    .from(classifiedEmails)
    .where(eq(classifiedEmails.scanId, scanId))
    .all();
}

export function updateEmailOverride(
  id: string,
  userOverride: "KEEP" | "DELETE" | "UNSUBSCRIBE" | null
) {
  ensureInit();
  db.update(classifiedEmails)
    .set({ userOverride })
    .where(eq(classifiedEmails.id, id))
    .run();
}

export function markEmailsActioned(
  messageIds: string[],
  scanId: string,
  status: "TRASHED" | "DELETED" | "UNSUBSCRIBED" | "FAILED"
) {
  ensureInit();
  if (messageIds.length === 0) return;
  db.update(classifiedEmails)
    .set({ actionStatus: status })
    .where(
      and(
        eq(classifiedEmails.scanId, scanId),
        inArray(classifiedEmails.messageId, messageIds)
      )
    )
    .run();
}

export function createDeletionLog(data: {
  id: string;
  scanId: string;
  userEmail: string;
  action: "TRASH" | "DELETE" | "UNSUBSCRIBE";
  messageIds: string[];
  senderDomains: string[];
  totalCount: number;
  successCount: number;
  errorCount: number;
}) {
  ensureInit();
  db.insert(deletionLogs)
    .values({
      id: data.id,
      scanId: data.scanId,
      userEmail: data.userEmail,
      action: data.action,
      messageIds: JSON.stringify(data.messageIds),
      senderDomains: JSON.stringify(data.senderDomains),
      totalCount: data.totalCount,
      successCount: data.successCount,
      errorCount: data.errorCount,
    })
    .run();
}

export function getDeletionLogs(userEmail: string) {
  ensureInit();
  return db
    .select()
    .from(deletionLogs)
    .where(eq(deletionLogs.userEmail, userEmail))
    .all();
}
