import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";

/** دریافت پیوست خصوصی؛ فقط مالک تیکت/سفارش یا مدیران */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const media = await db.media.findUnique({
    where: { id },
    include: {
      ticketMessages: { select: { ticket: { select: { userId: true } } } },
      customOrders: { select: { userId: true } },
    },
  });
  if (!media) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const uid = session.user.id;
  const allowed =
    session.user.type === "ADMIN" ||
    media.uploadedById === uid ||
    media.ticketMessages.some((m) => m.ticket.userId === uid) ||
    media.customOrders.some((o) => o.userId === uid);
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const data = await getStorage().get(media.path);
  const name = encodeURIComponent(media.alt ?? "attachment");
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": media.mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${name}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
