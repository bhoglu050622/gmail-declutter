"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Checkbox } from "../../../../components/ui/checkbox";
import { Loader2, ChevronLeft, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { EmailPreviewModal } from "../../../../components/EmailPreviewModal";

const CATEGORY_LABELS: Record<string, string> = {
  keep: "Keep",
  delete: "Delete",
  unsubscribe: "Unsubscribe",
  review: "Review",
};

const CATEGORY_COLORS: Record<string, string> = {
  keep: "bg-green-100 text-green-800",
  delete: "bg-red-100 text-red-800",
  unsubscribe: "bg-orange-100 text-orange-800",
  review: "bg-blue-100 text-blue-800",
};

interface Email {
  id: string;
  messageId: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  dateMs?: number | null;
  category: string;
  reason?: string | null;
  confidence: number;
  classifiedBy: string;
  userOverride?: string | null;
  hasListUnsub: boolean;
  actionStatus?: string | null;
}

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const category = params.category as string;
  const scanId = searchParams.get("scanId");
  const [previewEmail, setPreviewEmail] = useState<Email | null>(null);
  const [keepSet, setKeepSet] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["scan-category", scanId, category],
    queryFn: async () => {
      const res = await fetch(
        `/api/scan/${scanId}?category=${category.toUpperCase()}`
      );
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ emails: Email[] }>;
    },
    enabled: !!scanId,
  });

  const emails = data?.emails ?? [];
  const visibleEmails = emails.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(emails.length / PAGE_SIZE);

  function toggleKeep(id: string) {
    setKeepSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/review?scanId=${scanId}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Overview
        </Link>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[category] ?? ""}`}
        >
          {CATEGORY_LABELS[category] ?? category}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{CATEGORY_LABELS[category]} Emails</h1>
          <p className="text-sm text-muted-foreground">{emails.length} emails in this category</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      )}

      {!isLoading && emails.length === 0 && (
        <p className="text-muted-foreground py-8 text-center">
          No emails in this category.
        </p>
      )}

      <div className="space-y-1">
        {visibleEmails.map((email) => (
          <div
            key={email.id}
            className={`flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors ${
              keepSet.has(email.id) ? "opacity-50" : ""
            } ${email.actionStatus ? "bg-muted" : "bg-card"}`}
          >
            {(category === "delete" || category === "unsubscribe") && (
              <Checkbox
                checked={keepSet.has(email.id)}
                onCheckedChange={() => toggleKeep(email.id)}
                title="Mark as Keep (exclude from deletion)"
                className="mt-0.5 shrink-0"
              />
            )}
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => setPreviewEmail(email)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{email.sender || email.senderEmail}</p>
                  <p className="text-sm text-foreground/80 truncate">{email.subject || "(no subject)"}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{email.snippet}</p>
                </div>
                <div className="shrink-0 text-right space-y-1">
                  {email.dateMs && (
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(email.dateMs), { addSuffix: true })}
                    </p>
                  )}
                  {email.actionStatus && (
                    <Badge variant="secondary" className="text-xs">
                      {email.actionStatus}
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground">{email.classifiedBy}</p>
                </div>
              </div>
              {email.reason && (
                <p className="text-xs text-muted-foreground mt-1 italic">{email.reason}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}

      {keepSet.size > 0 && (
        <div className="fixed bottom-4 right-4 bg-card border rounded-lg shadow-lg p-3 flex items-center gap-3">
          <p className="text-sm">{keepSet.size} emails marked to keep</p>
          <Button size="sm" variant="outline" onClick={() => setKeepSet(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {previewEmail && (
        <EmailPreviewModal
          email={previewEmail}
          onClose={() => setPreviewEmail(null)}
        />
      )}
    </div>
  );
}
