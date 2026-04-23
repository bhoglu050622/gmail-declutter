"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Email {
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  dateMs?: number | null;
  category: string;
  reason?: string | null;
  confidence: number;
  classifiedBy: string;
  hasListUnsub: boolean;
}

interface EmailPreviewModalProps {
  email: Email;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  KEEP: "bg-green-100 text-green-800",
  DELETE: "bg-red-100 text-red-800",
  UNSUBSCRIBE: "bg-orange-100 text-orange-800",
  REVIEW: "bg-blue-100 text-blue-800",
};

export function EmailPreviewModal({ email, onClose }: EmailPreviewModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug">
            {email.subject || "(no subject)"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{email.sender || email.senderEmail}</p>
              {email.dateMs && (
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(email.dateMs), { addSuffix: true })}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{email.senderEmail}</p>
          </div>

          <div className="rounded-md bg-muted p-3">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
              {email.snippet || "(no preview available)"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                CATEGORY_COLORS[email.category] ?? ""
              }`}
            >
              {email.category}
            </span>
            <Badge variant="outline" className="text-xs">
              {email.classifiedBy}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {Math.round(email.confidence * 100)}% confidence
            </Badge>
            {email.hasListUnsub && (
              <Badge variant="outline" className="text-xs">
                Has unsubscribe
              </Badge>
            )}
          </div>

          {email.reason && (
            <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-3">
              {email.reason}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
