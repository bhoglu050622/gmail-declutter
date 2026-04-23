import { NextResponse } from "next/server";
import { getAuthSession } from "../../../../lib/session";
import { createImapClient } from "../../../../lib/imap/client";

export async function POST() {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = createImapClient(session.email, session.appPassword);

  try {
    await client.connect();

    // Find trash folder by \Trash special-use flag
    const boxes = await client.list();
    const trashBox = boxes.find((b) => b.flags?.has("\\Trash"));
    if (!trashBox) {
      await client.logout();
      return NextResponse.json({ error: "Could not find Bin/Trash folder" }, { status: 404 });
    }

    const trashFolder = trashBox.path;
    const lock = await client.getMailboxLock(trashFolder);
    let deleted = 0;

    try {
      const searchResult = await client.search({ all: true }, { uid: true });
      const uids: number[] = Array.isArray(searchResult) ? searchResult : [];

      if (uids.length === 0) {
        return NextResponse.json({ deleted: 0, folder: trashFolder });
      }

      // Flag all as \Deleted then expunge
      const CHUNK = 500;
      for (let i = 0; i < uids.length; i += CHUNK) {
        const chunk = uids.slice(i, i + CHUNK);
        await client.messageFlagsAdd(chunk, ["\\Deleted"], { uid: true });
        deleted += chunk.length;
      }

      await client.mailboxClose();
    } finally {
      lock.release();
      await client.logout().catch(() => {});
    }

    return NextResponse.json({ deleted, folder: trashFolder });
  } catch (e) {
    await client.logout().catch(() => {});
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
