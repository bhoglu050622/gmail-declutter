import { NextResponse } from "next/server";
import { getAuthSession } from "../../../../lib/session";
import { unsubscribe } from "../../../../lib/gmail/unsubscriber";
import { trashMessages } from "../../../../lib/imap/trasher";
import { getScanSession } from "../../../../lib/db/scans";
import { getEmailsByScan, markEmailsActioned, createDeletionLog } from "../../../../lib/db/emails";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { scanId } = await request.json();
  if (!scanId) return NextResponse.json({ error: "Missing scanId" }, { status: 400 });

  const scan = getScanSession(scanId);
  if (!scan || scan.userEmail !== session.email) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const emails = getEmailsByScan(scanId, "UNSUBSCRIBE").filter(
    (e) => e.userOverride !== "KEEP"
  );

  if (emails.length === 0) return NextResponse.json({ outcomes: [], trashResult: null });

  const outcomes: {
    messageId: string;
    senderEmail: string;
    result: string;
    method?: string;
    unsubscribeUrl?: string;
    error?: string;
  }[] = [];

  for (const email of emails) {
    if (!email.listUnsubHeader) {
      outcomes.push({ messageId: email.messageId, senderEmail: email.senderEmail, result: "MANUAL_REQUIRED", error: "No List-Unsubscribe header" });
      continue;
    }

    const outcome = await unsubscribe(
      session.email,
      session.appPassword,
      email.messageId,
      email.senderEmail,
      email.listUnsubHeader,
      email.listUnsubPostHeader ?? undefined
    );
    outcomes.push(outcome);
    await new Promise((r) => setTimeout(r, 200));
  }

  const allIds = emails.map((e) => e.messageId);
  const trashResult = await trashMessages(session.email, session.appPassword, allIds);

  if (allIds.length > 0) markEmailsActioned(allIds, scanId, "UNSUBSCRIBED");

  const successCount = outcomes.filter((o) => o.result === "SUCCESS").length;
  createDeletionLog({
    id: crypto.randomUUID(),
    scanId,
    userEmail: session.email,
    action: "UNSUBSCRIBE",
    messageIds: allIds,
    senderDomains: [...new Set(emails.map((e) => e.senderEmail.split("@")[1]).filter(Boolean))],
    totalCount: allIds.length,
    successCount,
    errorCount: allIds.length - successCount,
  });

  return NextResponse.json({ outcomes, trashResult });
}
