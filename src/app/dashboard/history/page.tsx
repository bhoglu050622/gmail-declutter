import { getAuthSession } from "../../../lib/session";
import { listScanSessions } from "../../../lib/db/scans";
import { getDeletionLogs } from "../../../lib/db/emails";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800",
  SCANNING: "bg-blue-100 text-blue-800",
  FAILED: "bg-red-100 text-red-800",
  ACTED: "bg-gray-100 text-gray-800",
};

const ACTION_COLORS: Record<string, string> = {
  TRASH: "bg-yellow-100 text-yellow-800",
  DELETE: "bg-red-100 text-red-800",
  UNSUBSCRIBE: "bg-orange-100 text-orange-800",
};

export default async function HistoryPage() {
  const session = await getAuthSession();
  const userEmail = session?.email ?? "";

  let scans: ReturnType<typeof listScanSessions> = [];
  let logs: ReturnType<typeof getDeletionLogs> = [];

  try {
    scans = listScanSessions(userEmail, 20);
    logs = getDeletionLogs(userEmail);
  } catch {
    // DB not initialized yet
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-muted-foreground text-sm">
          Past scans and cleanup actions
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Scan Sessions
        </h2>
        {scans.length === 0 ? (
          <p className="text-muted-foreground text-sm">No scans yet.</p>
        ) : (
          <div className="space-y-2">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="p-3 rounded-lg border bg-card flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">
                      {scan.scanMode} scan
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[scan.status] ?? ""}`}
                    >
                      {scan.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {scan.totalClassified} emails ·{" "}
                    {formatDistanceToNow(new Date(scan.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                  {scan.status === "COMPLETED" && (
                    <p className="text-xs text-muted-foreground">
                      Keep: {scan.countKeep} · Delete: {scan.countDelete} ·
                      Unsub: {scan.countUnsubscribe} · Review: {scan.countReview}
                    </p>
                  )}
                </div>
                {scan.status === "COMPLETED" && (
                  <Link
                    href={`/dashboard/review?scanId=${scan.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    View
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Cleanup Actions
        </h2>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No cleanup actions yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg border bg-card flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] ?? ""}`}
                    >
                      {log.action}
                    </span>
                    <span className="text-sm">
                      {log.successCount} / {log.totalCount} succeeded
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.executedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {log.errorCount > 0 && (
                  <span className="text-xs text-destructive">
                    {log.errorCount} failed
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
