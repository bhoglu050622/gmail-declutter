export type ScanStatus = "SCANNING" | "COMPLETED" | "FAILED" | "ACTED";
export type ScanMode = "smart" | "full" | "recent";

export interface ScanSession {
  id: string;
  userId: string;
  userEmail: string;
  status: ScanStatus;
  phase: string;
  scanMode: ScanMode;
  totalFound: number;
  totalClassified: number;
  countKeep: number;
  countDelete: number;
  countUnsubscribe: number;
  countReview: number;
  errorMessage?: string | null;
  createdAt: Date;
  completedAt?: Date | null;
}

export interface ScanProgressEvent {
  phase: string;
  processed?: number;
  total?: number;
  message?: string;
  counts?: {
    keep: number;
    delete: number;
    unsubscribe: number;
    review: number;
  };
  error?: string;
}

export interface ActionResult {
  success: number;
  failed: number;
  errors: string[];
}
