"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, Scan } from "lucide-react";
import { toast } from "sonner";

const SCAN_MODES = [
  {
    value: "smart",
    label: "Smart Scan",
    description: "Promotions, social, spam — older than 30 days. Best for first-time cleanup.",
  },
  {
    value: "recent",
    label: "Recent Scan",
    description: "All inbox mail from the last 30 days.",
  },
  {
    value: "full",
    label: "Full Scan",
    description: "Everything — inbox + spam. Slower, up to 5000 emails.",
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Scan className="w-4 h-4" />
          Start a New Scan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SCAN_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setScanMode(mode.value)}
              className={`text-left p-3 rounded-lg border transition-colors ${
                scanMode === mode.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent"
              }`}
            >
              <p className="text-sm font-medium">{mode.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mode.description}
              </p>
            </button>
          ))}
        </div>
        <Button onClick={startScan} disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Scan className="w-4 h-4" />
          )}
          {loading ? "Starting..." : "Start Scan"}
        </Button>
      </CardContent>
    </Card>
  );
}
