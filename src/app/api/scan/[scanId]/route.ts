import { NextResponse } from "next/server";
import { getAuthSession } from "../../../../lib/session";
import { getScanSession } from "../../../../lib/db/scans";
import { getEmailsByScan } from "../../../../lib/db/emails";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scanId } = await params;
  const scan = getScanSession(scanId);

  if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  if (scan.userEmail !== session.email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const emails = getEmailsByScan(scanId, category);

  return NextResponse.json({ scan, emails });
}
