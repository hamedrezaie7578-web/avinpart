import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** فهرست تصاویر عمومی برای انتخابگر رسانه */
export async function GET(req: NextRequest) {
  const s = await auth();
  if (s?.user?.type !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const items = await db.media.findMany({
    where: { isPrivate: false, mime: { startsWith: "image/" }, ...(q ? { alt: { contains: q, mode: "insensitive" } } : {}) },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { id: true, url: true, alt: true, width: true, height: true },
  });
  return NextResponse.json({ items });
}
