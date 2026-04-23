import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../../../drizzle/schema";

const dbPath = process.env.DATABASE_URL?.startsWith("/")
  ? process.env.DATABASE_URL
  : `${process.cwd()}/${process.env.DATABASE_URL ?? "data/inbox.db"}`;

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS scan_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SCANNING',
      phase TEXT NOT NULL DEFAULT 'INIT',
      scan_mode TEXT NOT NULL DEFAULT 'smart',
      total_found INTEGER NOT NULL DEFAULT 0,
      total_classified INTEGER NOT NULL DEFAULT 0,
      count_keep INTEGER NOT NULL DEFAULT 0,
      count_delete INTEGER NOT NULL DEFAULT 0,
      count_unsubscribe INTEGER NOT NULL DEFAULT 0,
      count_review INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      created_at INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS classified_emails (
      id TEXT PRIMARY KEY,
      scan_id TEXT NOT NULL REFERENCES scan_sessions(id) ON DELETE CASCADE,
      message_id TEXT NOT NULL,
      category TEXT NOT NULL,
      confidence REAL NOT NULL DEFAULT 1.0,
      reason TEXT,
      sender TEXT NOT NULL DEFAULT '',
      sender_email TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL DEFAULT '',
      snippet TEXT NOT NULL DEFAULT '',
      date_ms INTEGER,
      has_list_unsub INTEGER NOT NULL DEFAULT 0,
      list_unsub_header TEXT,
      list_unsub_post_header TEXT,
      user_override TEXT,
      action_status TEXT,
      classified_by TEXT NOT NULL DEFAULT 'RULES'
    );

    CREATE TABLE IF NOT EXISTS deletion_logs (
      id TEXT PRIMARY KEY,
      scan_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      action TEXT NOT NULL,
      message_ids TEXT NOT NULL,
      sender_domains TEXT NOT NULL DEFAULT '[]',
      total_count INTEGER NOT NULL DEFAULT 0,
      success_count INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      executed_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_email TEXT PRIMARY KEY,
      max_messages INTEGER NOT NULL DEFAULT 5000,
      scan_mode TEXT NOT NULL DEFAULT 'smart',
      delete_mode TEXT NOT NULL DEFAULT 'TRASH',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}
