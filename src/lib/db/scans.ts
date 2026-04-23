import { db, initDb } from "./client";
import { scanSessions } from "../../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import type { ScanSession } from "../../types/scan";

let initialized = false;
function ensureInit() {
  if (!initialized) {
    initDb();
    initialized = true;
  }
}

export function createScanSession(data: {
  id: string;
  userId: string;
  userEmail: string;
  scanMode: string;
}): ScanSession {
  ensureInit();
  const now = new Date();
  db.insert(scanSessions)
    .values({
      id: data.id,
      userId: data.userId,
      userEmail: data.userEmail,
      scanMode: data.scanMode,
      status: "SCANNING",
      phase: "INIT",
      createdAt: now,
    })
    .run();

  return {
    id: data.id,
    userId: data.userId,
    userEmail: data.userEmail,
    status: "SCANNING",
    phase: "INIT",
    scanMode: data.scanMode as ScanSession["scanMode"],
    totalFound: 0,
    totalClassified: 0,
    countKeep: 0,
    countDelete: 0,
    countUnsubscribe: 0,
    countReview: 0,
    createdAt: now,
  };
}

export function updateScanSession(
  id: string,
  data: Partial<{
    status: "SCANNING" | "COMPLETED" | "FAILED" | "ACTED";
    phase: string;
    totalFound: number;
    totalClassified: number;
    countKeep: number;
    countDelete: number;
    countUnsubscribe: number;
    countReview: number;
    errorMessage: string;
    completedAt: Date;
  }>
) {
  ensureInit();
  db.update(scanSessions).set(data).where(eq(scanSessions.id, id)).run();
}

export function getScanSession(id: string) {
  ensureInit();
  return db.select().from(scanSessions).where(eq(scanSessions.id, id)).get();
}

export function listScanSessions(userEmail: string, limit = 10) {
  ensureInit();
  return db
    .select()
    .from(scanSessions)
    .where(eq(scanSessions.userEmail, userEmail))
    .orderBy(desc(scanSessions.createdAt))
    .limit(limit)
    .all();
}
