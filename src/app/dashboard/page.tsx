import { getAuthSession } from "../../lib/session";
import { listScanSessions } from "../../lib/db/scans";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ScanLauncher } from "../../components/ScanLauncher";
import { EmptyBinButton } from "../../components/EmptyBinButton";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Inbox, Trash2, MailX, Eye } from "lucide-react";

const statusColors: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800",
  SCANNING: "bg-blue-100 text-blue-800",
  FAILED: "bg-red-100 text-red-800",
  ACTED: "bg-gray-100 text-gray-800",
};

export default async function DashboardPage() {
  const session = await getAuthSession();
  const userEmail = session?.email ?? "";
  let recentScans: ReturnType<typeof listScanSessions> = [];

  try {
    recentScans = listScanSessions(userEmail, 5);
  } catch {
    // DB not yet initialized
  }

  const latestScan = recentScans[0];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Scan your inbox and start cleaning</p>
      </div>

      {latestScan?.status === "COMPLETED" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Keep", icon: Inbox, value: latestScan.countKeep, color: "text-green-600" },
            { label: "Delete", icon: Trash2, value: latestScan.countDelete, color: "text-red-600" },
            { label: "Unsubscribe", icon: MailX, value: latestScan.countUnsubscribe, color: "text-orange-600" },
            { label: "Review", icon: Eye, value: latestScan.countReview, color: "text-blue-600" },
          ].map(({ label, icon: Icon, value, color }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Icon className="w-4 h-4" /> {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {latestScan?.status === "COMPLETED" && (
        <div className="flex gap-3">
          <Link
            href={`/dashboard/review?scanId=${latestScan.id}`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Review & Act on Latest Scan
          </Link>
        </div>
      )}

      <ScanLauncher />

      <EmptyBinButton />

      {recentScans.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Scans
          </h2>
          <div className="space-y-2">
            {recentScans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{scan.scanMode} scan</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[scan.status] ?? ""}`}>
                      {scan.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {scan.totalClassified} emails ·{" "}
                    {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {scan.status === "COMPLETED" && (
                  <Link href={`/dashboard/review?scanId=${scan.id}`} className="text-xs text-primary hover:underline">
                    Review
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
