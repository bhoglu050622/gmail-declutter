import { NextResponse } from "next/server";
import { getAuthSession } from "../../../../lib/session";
import { scanEmitter } from "../../../../lib/events";

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scanId = searchParams.get("scanId");
  if (!scanId) {
    return NextResponse.json({ error: "Missing scanId" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // client disconnected
        }
      };

      const handler = (event: unknown) => {
        send(event);
        const e = event as { phase?: string };
        if (e?.phase === "COMPLETE" || e?.phase === "ERROR") {
          scanEmitter.off(`scan:${scanId}`, handler);
          try { controller.close(); } catch { /* already closed */ }
        }
      };

      scanEmitter.on(`scan:${scanId}`, handler);

      request.signal.addEventListener("abort", () => {
        scanEmitter.off(`scan:${scanId}`, handler);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
