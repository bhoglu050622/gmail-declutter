import { ImapFlow } from "imapflow";

export function createImapClient(email: string, password: string) {
  return new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
    disableAutoIdle: true,
  });
}

export async function testImapConnection(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const client = createImapClient(email, password);
  try {
    await client.connect();
    await client.logout();
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
