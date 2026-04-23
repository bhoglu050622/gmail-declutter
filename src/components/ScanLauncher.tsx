"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Rocket, Calendar, Layers } from "lucide-react";
import { toast } from "sonner";

const SCAN_MODES = [
  {
    value: "smart",
    icon: Rocket,
    label: "Smart Scan",
    description: "Promotions, social & spam older than 30 days. Best for first-time cleanup.",
  },
  {
    value: "recent",
    icon: Calendar,
    label: "Recent Scan",
    description: "All inbox mail from the last 30 days.",
  },
  {
    value: "full",
    icon: Layers,
    label: "Full Scan",
    description: "Everything — inbox + spam. No limit, scans your entire Gmail.",
  },
];

export function ScanLauncher() {
  const [scanMode, setScanMode] = useState("smart");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function startScan() {
    setLoading(true);
    try {
      const res = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start scan");
      router.push(`/dashboard/scan?scanId=${data.scanId}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to start scan";
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Rocket className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Start a New Scan</h2>
          <p className="text-xs text-muted-foreground">Choose your scan type below</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {SCAN_MODES.map(({ value, icon: Icon, label, description }) => (
          <button
            key={value}
            onClick={() => setScanMode(value)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              scanMode === value
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/30 hover:bg-muted/30"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${
              scanMode === value ? "bg-primary/15" : "bg-muted"
            }`}>
              <Icon className={`w-4 h-4 ${scanMode === value ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <p className={`text-sm font-semibold mb-1 ${scanMode === value ? "text-primary" : "text-foreground"}`}>
              {label}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </button>
        ))}
      </div>

      <button
        onClick={startScan}
        disabled={loading}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)" }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Rocket className="w-4 h-4" />
        )}
        {loading ? "Starting..." : "Start Scan →"}
      </button>
    </div>
  );
}
