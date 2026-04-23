import { createImapClient } from "./client";

export interface BulkActionResult {
  success: number;
  failed: number;
  errors: string[];
}

function parseMessageId(messageId: string): { mailbox: string; uid: number } | null {
  const colonIdx = messageId.indexOf(":");
  if (colonIdx === -1) return null;
  const mailbox = messageId.slice(0, colonIdx);
  const uid = parseInt(messageId.slice(colonIdx + 1), 10);
  if (isNaN(uid)) return null;
  return { mailbox, uid };
}

function groupByMailbox(messageIds: string[]): Map<string, number[]> {
  const groups = new Map<string, number[]>();
  for (const id of messageIds) {
    const parsed = parseMessageId(id);
    if (!parsed) continue;
    const list = groups.get(parsed.mailbox) ?? [];
    list.push(parsed.uid);
    groups.set(parsed.mailbox, list);
  }
  return groups;
}

async function detectSpecialFolder(
  client: ReturnType<typeof createImapClient>,
  flag: string,
  fallback: string
): Promise<string> {
  try {
    const boxes = await client.list();
    const found = boxes.find((b) => b.flags?.has(flag));
    return found?.path ?? fallback;
  } catch {
    return fallback;
  }
}

export async function trashMessages(
  email: string,
  password: string,
  messageIds: string[]
): Promise<BulkActionResult> {
  const result: BulkActionResult = { success: 0, failed: 0, errors: [] };
  const groups = groupByMailbox(messageIds);

  for (const [mailbox, uids] of groups) {
    const client = createImapClient(email, password);
    try {
      await client.connect();

      // Auto-detect the trash folder (\Trash special-use flag)
      const trashFolder = await detectSpecialFolder(client, "\\Trash", "[Gmail]/Trash");

      const lock = await client.getMailboxLock(mailbox);
      try {
        const CHUNK = 100;
        for (let i = 0; i < uids.length; i += CHUNK) {
          const chunk = uids.slice(i, i + CHUNK);
          try {
            await client.messageMove(chunk, trashFolder, { uid: true });
            result.success += chunk.length;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            result.failed += chunk.length;
            result.errors.push(`Chunk ${i}: ${msg}`);
          }
        }
      } finally {
        lock.release();
        await client.logout().catch(() => {});
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      result.failed += uids.length;
      result.errors.push(`Connect error: ${msg}`);
    }
  }

  return result;
}

export async function permanentlyDeleteMessages(
  email: string,
  password: string,
  messageIds: string[]
): Promise<BulkActionResult> {
  const result: BulkActionResult = { success: 0, failed: 0, errors: [] };
  const groups = groupByMailbox(messageIds);

  for (const [mailbox, uids] of groups) {
    const client = createImapClient(email, password);
    try {
      await client.connect();
      const lock = await client.getMailboxLock(mailbox);
      try {
        const CHUNK = 100;
        for (let i = 0; i < uids.length; i += CHUNK) {
          const chunk = uids.slice(i, i + CHUNK);
          try {
            await client.messageFlagsAdd(chunk, ["\\Deleted"], { uid: true });
            result.success += chunk.length;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            result.failed += chunk.length;
            result.errors.push(`Chunk ${i}: ${msg}`);
          }
        }
        await client.mailboxClose();
      } finally {
        lock.release();
        await client.logout().catch(() => {});
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      result.failed += uids.length;
      result.errors.push(`Connect error: ${msg}`);
    }
  }

  return result;
}
