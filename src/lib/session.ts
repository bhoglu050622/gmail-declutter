import { cookies } from "next/headers";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

export { SESSION_COOKIE } from "./session-constants";
import { SESSION_COOKIE } from "./session-constants";

export interface UserSession {
  email: string;
  appPassword: string;
}

function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET ?? "fallback-local-secret-change-me";
  return createHash("sha256").update(secret).digest();
}

function encrypt(data: UserSession): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

function decrypt(token: string): UserSession | null {
  try {
    const buf = Buffer.from(token, "base64url");
    const key = getKey();
    const iv = buf.subarray(0, 16);
    const tag = buf.subarray(16, 32);
    const enc = buf.subarray(32);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(enc), decipher.final()]);
    return JSON.parse(plain.toString("utf8")) as UserSession;
  } catch {
    return null;
  }
}

export function encryptSession(data: UserSession): string {
  return encrypt(data);
}

export async function getAuthSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decrypt(token);
}
