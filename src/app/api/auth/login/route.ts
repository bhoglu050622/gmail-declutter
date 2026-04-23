import { NextResponse } from "next/server";
import { testImapConnection } from "../../../../lib/imap/client";
import { encryptSession, SESSION_COOKIE } from "../../../../lib/session";

export async function POST(request: Request) {
  const { email, appPassword } = await request.json().catch(() => ({}));

  if (!email || !appPassword) {
    return NextResponse.json({ error: "Email and app password required" }, { status: 400 });
  }

  const { ok, error } = await testImapConnection(email.trim(), appPassword.trim());

  if (!ok) {
    return NextResponse.json(
      { error: `Could not connect to Gmail: ${error ?? "Authentication failed"}` },
      { status: 401 }
    );
  }

  const token = encryptSession({ email: email.trim(), appPassword: appPassword.trim() });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
