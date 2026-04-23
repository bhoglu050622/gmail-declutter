import { NextResponse } from "next/server";
import { getAuthSession } from "../../../../lib/session";
import { runScan } from "../../../../lib/imap/scanner";
import { createScanSession, updateScanSession } from "../../../../lib/db/scans";
import { bulkInsertEmails } from "../../../../lib/db/emails";
import { getUserPreferences } from "../../../../lib/db/users";
import { scanEmitter } from "../../../../lib/events";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const scanMode = (body.scanMode as string) ?? "smart";
  const userEmail = session.email;
  const prefs = getUserPreferences(userEmail);
  const scanId = crypto.randomUUID();

  createScanSession({ id: scanId, userId: userEmail, userEmail, scanMode });

  (async () => {
    try {
      const results = await runScan(
        session.email,
        session.appPassword,
        scanId,
        scanMode,
        prefs.maxMessages
      );

      bulkInsertEmails(scanId, results);

      const counts = {
        keep: results.filter((r) => r.category === "KEEP").length,
        delete: results.filter((r) => r.category === "DELETE").length,
        unsubscribe: results.filter((r) => r.category === "UNSUBSCRIBE").length,
        review: results.filter((r) => r.category === "REVIEW").length,
      };

      updateScanSession(scanId, {
        status: "COMPLETED" as const,
        phase: "COMPLETE",
        totalFound: results.length,
        totalClassified: results.length,
        countKeep: counts.keep,
        countDelete: counts.delete,
        countUnsubscribe: counts.unsubscribe,
        countReview: counts.review,
        completedAt: new Date(),
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Scan failed";
      updateScanSession(scanId, { status: "FAILED" as const, errorMessage: msg, completedAt: new Date() });
      scanEmitter.emit(`scan:${scanId}`, { phase: "ERROR", error: msg });
    }
  })();

  return NextResponse.json({ scanId });
}
