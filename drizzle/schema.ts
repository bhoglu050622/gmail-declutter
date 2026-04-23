import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const scanSessions = sqliteTable("scan_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  userEmail: text("user_email").notNull(),
  status: text("status", {
    enum: ["SCANNING", "COMPLETED", "FAILED", "ACTED"],
  })
    .notNull()
    .default("SCANNING"),
  phase: text("phase").notNull().default("INIT"),
  scanMode: text("scan_mode").notNull().default("smart"),
  totalFound: integer("total_found").notNull().default(0),
  totalClassified: integer("total_classified").notNull().default(0),
  countKeep: integer("count_keep").notNull().default(0),
  countDelete: integer("count_delete").notNull().default(0),
  countUnsubscribe: integer("count_unsubscribe").notNull().default(0),
  countReview: integer("count_review").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
});

export const classifiedEmails = sqliteTable("classified_emails", {
  id: text("id").primaryKey(),
  scanId: text("scan_id")
    .notNull()
    .references(() => scanSessions.id, { onDelete: "cascade" }),
  messageId: text("message_id").notNull(),
  category: text("category", {
    enum: ["KEEP", "DELETE", "UNSUBSCRIBE", "REVIEW"],
  }).notNull(),
  confidence: real("confidence").notNull().default(1.0),
  reason: text("reason"),
  sender: text("sender").notNull().default(""),
  senderEmail: text("sender_email").notNull().default(""),
  subject: text("subject").notNull().default(""),
  snippet: text("snippet").notNull().default(""),
  dateMs: integer("date_ms"),
  hasListUnsub: integer("has_list_unsub", { mode: "boolean" })
    .notNull()
    .default(false),
  listUnsubHeader: text("list_unsub_header"),
  listUnsubPostHeader: text("list_unsub_post_header"),
  userOverride: text("user_override", {
    enum: ["KEEP", "DELETE", "UNSUBSCRIBE"],
  }),
  actionStatus: text("action_status", {
    enum: ["PENDING", "TRASHED", "DELETED", "UNSUBSCRIBED", "FAILED"],
  }),
  classifiedBy: text("classified_by", {
    enum: ["RULES", "AI"],
  })
    .notNull()
    .default("RULES"),
});

export const deletionLogs = sqliteTable("deletion_logs", {
  id: text("id").primaryKey(),
  scanId: text("scan_id").notNull(),
  userEmail: text("user_email").notNull(),
  action: text("action", {
    enum: ["TRASH", "DELETE", "UNSUBSCRIBE"],
  }).notNull(),
  messageIds: text("message_ids").notNull(),
  senderDomains: text("sender_domains").notNull().default("[]"),
  totalCount: integer("total_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  executedAt: integer("executed_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const userPreferences = sqliteTable("user_preferences", {
  userEmail: text("user_email").primaryKey(),
  maxMessages: integer("max_messages").notNull().default(5000),
  scanMode: text("scan_mode").notNull().default("smart"),
  deleteMode: text("delete_mode", { enum: ["TRASH", "PERMANENT"] })
    .notNull()
    .default("TRASH"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
