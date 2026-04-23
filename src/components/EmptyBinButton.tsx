"use client";

import { useState } from "react";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";

export function EmptyBinButton() {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(false);

  function openDialog() {
    setConfirmed(false);
    setCountdown(5);
    setOpen(true);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function handleEmptyBin() {
    setLoading(true);
    try {
      const res = await fetch("/api/actions/empty-bin", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Permanently deleted ${data.deleted} emails from ${data.folder}`);
      setOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to empty bin");
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
        <div>
          <p className="text-sm font-medium flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-destructive" />
            Empty Bin
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Permanently delete all emails currently in your Gmail Bin — cannot be undone
          </p>
        </div>
        <Button variant="destructive" size="sm" onClick={openDialog}>
          Empty Bin Now
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Empty Gmail Bin
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              This will <strong className="text-foreground">permanently delete every email</strong> in
              your Gmail Bin right now. There is no way to recover them afterward.
            </p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="empty-confirm"
                checked={confirmed}
                onCheckedChange={(v) => setConfirmed(!!v)}
              />
              <label htmlFor="empty-confirm" className="cursor-pointer">
                I understand all binned emails will be gone forever
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEmptyBin}
              disabled={!confirmed || countdown > 0 || loading}
              className="gap-1.5"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {countdown > 0 ? `Empty Bin (${countdown}s)` : "Empty Bin Forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
