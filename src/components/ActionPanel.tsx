"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Loader2, Trash2, Mail, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ActionPanelProps {
  scanId: string;
  scan?: {
    countDelete: number;
    countUnsubscribe: number;
    status: string;
  };
}

export function ActionPanel({ scanId, scan }: ActionPanelProps) {
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [showUnsubDialog, setShowUnsubDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  async function doTrash() {
    setLoading("trash");
    try {
      const res = await fetch("/api/actions/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId, categories: ["DELETE", "UNSUBSCRIBE"] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Moved ${data.success} emails to Trash`);
      setShowTrashDialog(false);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  async function doUnsubscribe() {
    setLoading("unsub");
    try {
      const res = await fetch("/api/actions/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const success = (data.outcomes as { result: string }[]).filter(
        (o) => o.result === "SUCCESS"
      ).length;
      toast.success(`Unsubscribed from ${success} senders and trashed their emails`);
      setShowUnsubDialog(false);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  async function doPermanentDelete() {
    setLoading("delete");
    try {
      const res = await fetch("/api/actions/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanId,
          categories: ["DELETE"],
          confirmed: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Permanently deleted ${data.success} emails`);
      setShowDeleteDialog(false);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setLoading(null);
      setConfirmed(false);
    }
  }

  function openDeleteDialog() {
    setConfirmed(false);
    setCountdown(5);
    setShowDeleteDialog(true);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  return (
    <div className="flex flex-wrap gap-3 p-4 rounded-lg border bg-card">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Execute cleanup actions</p>
        <p className="text-xs text-muted-foreground">
          Review category pages first, then apply actions below
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowUnsubDialog(true)}
          disabled={!!loading || !scan?.countUnsubscribe}
        >
          <Mail className="w-3.5 h-3.5" />
          Unsubscribe ({scan?.countUnsubscribe ?? 0})
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowTrashDialog(true)}
          disabled={!!loading || (!scan?.countDelete && !scan?.countUnsubscribe)}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Trash All Junk ({(scan?.countDelete ?? 0) + (scan?.countUnsubscribe ?? 0)})
        </Button>
      </div>

      {/* Trash Dialog */}
      <Dialog open={showTrashDialog} onOpenChange={setShowTrashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Trash</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will move{" "}
            <strong>
              {(scan?.countDelete ?? 0) + (scan?.countUnsubscribe ?? 0)} emails
            </strong>{" "}
            (DELETE + UNSUBSCRIBE categories) to Gmail Trash. They will be
            automatically deleted after 30 days. You can recover them from
            Trash before then.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTrashDialog(false)}>
              Cancel
            </Button>
            <Button onClick={doTrash} disabled={loading === "trash"} className="gap-1.5">
              {loading === "trash" && <Loader2 className="w-4 h-4 animate-spin" />}
              Move to Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsubscribe Dialog */}
      <Dialog open={showUnsubDialog} onOpenChange={setShowUnsubDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsubscribe & Trash</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will execute List-Unsubscribe for all{" "}
            <strong>{scan?.countUnsubscribe ?? 0} UNSUBSCRIBE emails</strong>{" "}
            (via RFC 8058 one-click or mailto), then move them to Trash.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowUnsubDialog(false)}>
              Cancel
            </Button>
            <Button onClick={doUnsubscribe} disabled={loading === "unsub"} className="gap-1.5">
              {loading === "unsub" && <Loader2 className="w-4 h-4 animate-spin" />}
              Unsubscribe & Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Permanently Delete
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Warning:</strong> This will
              permanently delete {scan?.countDelete ?? 0} emails. They cannot
              be recovered.
            </p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(v) => setConfirmed(!!v)}
              />
              <label htmlFor="confirm" className="text-sm cursor-pointer">
                I understand this action is irreversible
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={doPermanentDelete}
              disabled={!confirmed || countdown > 0 || loading === "delete"}
              className="gap-1.5"
            >
              {loading === "delete" && <Loader2 className="w-4 h-4 animate-spin" />}
              {countdown > 0 ? `Delete Forever (${countdown})` : "Delete Forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
