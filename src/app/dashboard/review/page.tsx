"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Loader2, Inbox, Trash2, Eye, Mail } from "lucide-react";
import { ActionPanel } from "../../../components/ActionPanel";

const CATEGORIES = [
  {
    key: "DELETE",
    label: "Delete",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    icon: Trash2,
    description: "Junk, spam, and unwanted mass emails",
  },
  {
    key: "UNSUBSCRIBE",
    label: "Unsubscribe",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    icon: Mail,
    description: "Newsletters and mailing lists you can unsubscribe from",
  },
  {
    key: "REVIEW",
    label: "Review",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    icon: Eye,
    description: "Ambiguous emails — manually decide",
  },
  {
    key: "KEEP",
    label: "Keep",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    icon: Inbox,
    description: "Important emails to preserve",
  },
];

export default function ReviewPage() {
  const params = useSearchParams();
  const scanId = params.get("scanId");

  const { data, isLoading, error } = useQuery({
    queryKey: ["scan", scanId],
    queryFn: async () => {
      const res = await fetch(`/api/scan/${scanId}`);
      if (!res.ok) throw new Error("Failed to load scan");
      return res.json();
    },
    enabled: !!scanId,
  });

  if (!scanId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No scan selected. Start a scan first.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading scan results...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">Failed to load scan results.</p>
      </div>
    );
  }

  const scan = data?.scan;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review Scan Results</h1>
          <p className="text-muted-foreground text-sm">
            {scan?.totalClassified ?? 0} emails classified ·{" "}
            <span className="capitalize">{scan?.scanMode} scan</span>
          </p>
        </div>
      </div>

      <ActionPanel scanId={scanId} scan={scan} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => {
          const count =
            cat.key === "DELETE"
              ? scan?.countDelete
              : cat.key === "UNSUBSCRIBE"
                ? scan?.countUnsubscribe
                : cat.key === "REVIEW"
                  ? scan?.countReview
                  : scan?.countKeep;

          return (
            <Link
              key={cat.key}
              href={`/dashboard/review/${cat.key.toLowerCase()}?scanId=${scanId}`}
            >
              <Card
                className={`hover:shadow-md transition-shadow cursor-pointer border ${cat.bg}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className={`text-base flex items-center gap-2 ${cat.color}`}>
                    <cat.icon className="w-5 h-5" />
                    {cat.label}
                    <span className="ml-auto text-2xl font-bold">{count ?? 0}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
