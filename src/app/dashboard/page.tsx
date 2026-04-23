import { getAuthSession } from "../../lib/session";
import { listScanSessions } from "../../lib/db/scans";
import { ScanLauncher } from "../../components/ScanLauncher";
import { EmptyBinButton } from "../../components/EmptyBinButton";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Inbox, Trash2, MailX, Eye, History, ArrowRight, Sparkles } from "lucide-react";

const STAT_CARDS = [
  {
    key: "keep",
    label: "Keep",
    icon: Inbox,
    color: "text-emerald-600",
    iconBg: "bg-emerald-100",
    waveFill: "#D1FAE5",
    waveStroke: "#10B981",
    desc: "Emails to keep",
  },
  {
    key: "delete",
    label: "Delete",
    icon: Trash2,
    color: "text-red-500",
    iconBg: "bg-red-100",
    waveFill: "#FEE2E2",
    waveStroke: "#EF4444",
    desc: "Emails to delete",
  },
  {
    key: "unsubscribe",
    label: "Unsubscribe",
    icon: MailX,
    color: "text-amber-500",
    iconBg: "bg-amber-100",
    waveFill: "#FEF3C7",
    waveStroke: "#F59E0B",
    desc: "Emails to unsubscribe",
  },
  {
    key: "review",
    label: "Review",
    icon: Eye,
    color: "text-blue-500",
    iconBg: "bg-blue-100",
    waveFill: "#DBEAFE",
    waveStroke: "#3B82F6",
    desc: "Emails to review",
  },
];

function MiniWave({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg width="80" height="32" viewBox="0 0 80 32" fill="none" className="absolute bottom-0 right-0 opacity-60">
      <path d="M0 28 C10 28, 15 12, 25 16 S40 24, 50 14 S65 4, 80 8 L80 32 L0 32 Z" fill={fill}/>
      <path d="M0 28 C10 28, 15 12, 25 16 S40 24, 50 14 S65 4, 80 8" stroke={stroke} strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

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
  const hasResults = latestScan?.status === "COMPLETED";

  const statValues: Record<string, number> = {
    keep: latestScan?.countKeep ?? 0,
    delete: latestScan?.countDelete ?? 0,
    unsubscribe: latestScan?.countUnsubscribe ?? 0,
    review: latestScan?.countReview ?? 0,
  };

  return (
    <div className="p-8 space-y-6 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-0.5">Scan your inbox and start cleaning</p>
        </div>
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 max-w-xs">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Keep it clean, stay focused.</p>
            <p className="text-xs text-muted-foreground">You&apos;re in control of your inbox.</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, iconBg, waveFill, waveStroke, desc }) => (
          <div key={key} className="bg-white rounded-2xl p-5 shadow-sm border border-border relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <p className={`text-3xl font-bold ${color} mb-1`}>{statValues[key]}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
            <MiniWave fill={waveFill} stroke={waveStroke} />
          </div>
        ))}
      </div>

      {/* CTA */}
      {hasResults && (
        <Link
          href={`/dashboard/review?scanId=${latestScan.id}`}
          className="inline-flex items-center gap-2.5 bg-[#1E1B4B] hover:bg-[#2d2a5e] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Review &amp; Act on Latest Scan
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}

      {/* Scan Launcher */}
      <ScanLauncher />

      {/* Empty Bin */}
      <EmptyBinButton />

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Recent Scans</h2>
            </div>
            <Link href="/dashboard/history" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View all history <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentScans.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    scan.status === "COMPLETED" ? "bg-emerald-500" :
                    scan.status === "SCANNING" ? "bg-blue-500 animate-pulse" :
                    scan.status === "FAILED" ? "bg-red-500" : "bg-gray-400"
                  }`} />
                  <div>
                    <p className="text-sm font-medium capitalize">{scan.scanMode} scan</p>
                    <p className="text-xs text-muted-foreground">
                      {scan.totalClassified} emails · {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {scan.status === "COMPLETED" && (
                  <Link href={`/dashboard/review?scanId=${scan.id}`} className="text-xs text-primary font-medium hover:underline">
                    Review →
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
