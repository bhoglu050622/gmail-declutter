import nodemailer from "nodemailer";

export type UnsubscribeResult = "SUCCESS" | "FAILED" | "MANUAL_REQUIRED";

export interface UnsubscribeOutcome {
  messageId: string;
  senderEmail: string;
  result: UnsubscribeResult;
  method?: string;
  unsubscribeUrl?: string;
  error?: string;
}

interface ParsedUnsubscribe {
  mailto?: string;
  https?: string;
}

function parseListUnsubHeader(header: string): ParsedUnsubscribe {
  const result: ParsedUnsubscribe = {};
  const parts = header.match(/<([^>]+)>/g) ?? [];
  for (const part of parts) {
    const url = part.slice(1, -1).trim();
    if (url.startsWith("mailto:")) {
      result.mailto = url.slice(7);
    } else if (url.startsWith("https://") || url.startsWith("http://")) {
      result.https = url;
    }
  }
  return result;
}

async function sendMailtoUnsubscribe(
  userEmail: string,
  appPassword: string,
  mailtoAddress: string
): Promise<void> {
  const [address, queryString] = mailtoAddress.split("?");
  const params = new URLSearchParams(queryString ?? "");
  const subject = params.get("subject") ?? "Unsubscribe";
  const body = params.get("body") ?? "Please unsubscribe me from this list.";

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: userEmail, pass: appPassword },
  });

  await transporter.sendMail({
    from: userEmail,
    to: address,
    subject,
    text: body,
  });
}

export async function unsubscribe(
  userEmail: string,
  appPassword: string,
  messageId: string,
  senderEmail: string,
  listUnsubHeader: string,
  listUnsubPostHeader?: string
): Promise<UnsubscribeOutcome> {
  const parsed = parseListUnsubHeader(listUnsubHeader);

  // RFC 8058 one-click POST (preferred)
  if (parsed.https && listUnsubPostHeader?.includes("List-Unsubscribe=One-Click")) {
    try {
      const res = await fetch(parsed.https, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "List-Unsubscribe=One-Click",
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok || res.status === 200 || res.status === 204) {
        return { messageId, senderEmail, result: "SUCCESS", method: "rfc8058" };
      }
    } catch {
      // fall through
    }
  }

  // mailto via Gmail SMTP
  if (parsed.mailto) {
    try {
      await sendMailtoUnsubscribe(userEmail, appPassword, parsed.mailto);
      return { messageId, senderEmail, result: "SUCCESS", method: "mailto" };
    } catch (e) {
      return {
        messageId,
        senderEmail,
        result: "FAILED",
        method: "mailto",
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  // HTTPS GET fallback
  if (parsed.https) {
    return {
      messageId,
      senderEmail,
      result: "MANUAL_REQUIRED",
      method: "https",
      unsubscribeUrl: parsed.https,
    };
  }

  return {
    messageId,
    senderEmail,
    result: "MANUAL_REQUIRED",
    error: "No supported unsubscribe method found",
  };
}
