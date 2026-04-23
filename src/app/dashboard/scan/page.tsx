"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Progress } from "../../../components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { ScanProgressEvent } from "../../../types/scan";

const PHASE_LABELS: Record<string, string> = {
  INIT: "Initializing...",
  LISTING: "Listing messages...",
  FETCHING: "Fetching email metadata...",
  CLASSIFYING_RULES: "Applying classification rules...",
  CLASSIFYING_AI: "AI classifying remaining emails...",
  COMPLETE: "Scan complete!",
  ERROR: "Scan failed",
};

export default function ScanPage() {
  const params = useSearchParams();
  const router = useRouter();
  const scanId = params.get("scanId");
  const [events, setEvents] = useState<ScanProgressEvent[]>([]);
  const [latest, setLatest] = useState<ScanProgressEvent | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId) return;

    const es = new EventSource(`/api/scan/progress?scanId=${scanId}`);

    es.onmessage = (e) => {
      try {
        const event: ScanProgressEvent = JSON.parse(e.data);
        setLatest(event);
        setEvents((prev) => [...prev.slice(-20), event]);

        if (event.phase === "COMPLETE") {
          setDone(true);
          es.close();
          setTimeout(() => router.push(`/dashboard/review?scanId=${scanId}`), 1500);
        } else if (event.phase === "ERROR") {
          setError(event.error ?? "Scan failed");
          es.close();
        }
      } catch {}
    };

    es.onerror = () => {
      setError("Connection lost");
      es.close();
    };

    return () => es.close();
  }, [scanId, router]);

  const progress =
    latest?.processed && latest?.total
      ? Math.round((latest.processed / latest.total) * 100)
      : done
        ? 100
        : 0;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Scanning Inbox</h1>
        <p className="text-muted-foreground text-sm">
          This may take a minute depending on inbox size
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {error ? (
              <XCircle className="w-5 h-5 text-destructive" />
            ) : done ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            )}
            {error
              ? "Scan Failed"
              : done
                ? "Scan Complete — Redirecting..."
                : PHASE_LABELS[latest?.phase ?? "INIT"]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-2" />

          {latest?.processed !== undefined && latest?.total !== undefined && (
            <p className="text-sm text-muted-foreground">
              {latest.processed} / {latest.total} emails processed
            </p>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {done && latest?.counts && (
            <div className="grid grid-cols-4 gap-3 pt-2">
              {[
                { label: "Keep", value: latest.counts.keep, color: "text-green-600" },
                { label: "Delete", value: latest.counts.delete, color: "text-red-600" },
                { label: "Unsubscribe", value: latest.counts.unsubscribe, color: "text-orange-600" },
                { label: "Review", value: latest.counts.review, color: "text-blue-600" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className={`text-xl font-bold ${item.color}`}>
                    {item.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {[...events].reverse().slice(0, 8).map((e, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                {e.message ?? PHASE_LABELS[e.phase] ?? e.phase}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
