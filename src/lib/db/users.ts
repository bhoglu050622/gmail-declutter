import { db, initDb } from "./client";
import { userPreferences } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

let initialized = false;
function ensureInit() {
  if (!initialized) {
    initDb();
    initialized = true;
  }
}

export function getUserPreferences(userEmail: string) {
  ensureInit();
  const prefs = db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userEmail, userEmail))
    .get();

  if (!prefs) {
    const now = new Date();
    db.insert(userPreferences)
      .values({
        userEmail,
        maxMessages: 5000,
        scanMode: "smart",
        deleteMode: "TRASH",
        createdAt: now,
        updatedAt: now,
      })
      .run();
    return { userEmail, maxMessages: 5000, scanMode: "smart", deleteMode: "TRASH" as const };
  }

  return prefs;
}

export function updateUserPreferences(
  userEmail: string,
  data: Partial<{
    maxMessages: number;
    scanMode: string;
    deleteMode: "TRASH" | "PERMANENT";
  }>
) {
  ensureInit();
  db.update(userPreferences)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(userPreferences.userEmail, userEmail))
    .run();
}
