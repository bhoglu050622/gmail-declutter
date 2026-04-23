import { NextResponse } from "next/server";
import { getAuthSession } from "../../../../lib/session";
import { permanentlyDeleteMessages } from "../../../../lib/imap/trasher";
import { getScanSession } from "../../../../lib/db/scans";
import { getEmailsByScan, markEmailsActioned, createDeletionLog } from "../../../../lib/db/emails";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { scanId, categories, confirmed } = await request.json();
  if (!confirmed) {
    return NextResponse.json({ error: "Must explicitly confirm permanent deletion" }, { status: 400 });
  }
  if (!scanId || !Array.isArray(categories) || categories.length === 0) {
    return NextResponse.json({ error: "Missing scanId or categories" }, { status: 400 });
  }

  const scan = getScanSession(scanId);
  if (!scan || scan.userEmail !== session.email) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const messageIds: string[] = [];
  const senderDomains = new Set<string>();

  for (const category of categories) {
    for (const email of getEmailsByScan(scanId, category)) {
      if (email.userOverride === "KEEP") continue;
      messageIds.push(email.messageId);
      const domain = email.senderEmail.split("@")[1];
      if (domain) senderDomains.add(domain);
    }
  }

  if (messageIds.length === 0) return NextResponse.json({ success: 0, failed: 0, errors: [] });

  const result = await permanentlyDeleteMessages(session.email, session.appPassword, messageIds);

  if (result.success > 0) markEmailsActioned(messageIds, scanId, "DELETED");

  createDeletionLog({
    id: crypto.randomUUID(),
    scanId,
    userEmail: session.email,
    action: "DELETE",
    messageIds,
    senderDomains: Array.from(senderDomains),
    totalCount: messageIds.length,
    successCount: result.success,
    errorCount: result.failed,
  });

  return NextResponse.json(result);
}
