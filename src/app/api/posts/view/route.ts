import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

/** شمارش بازدید مقاله (هر IP برای هر مقاله حداکثر یک بار در ۶ ساعت) */
export async function POST(req: NextRequest) {
  const slug = String(((await req.json().catch(() => ({}))) as { slug?: unknown }).slug ?? "").slice(0, 120);
  if (!/^[a-z0-9-]+$/.test(slug)) return new NextResponse(null, { status: 400 });
  const ip = await getClientIp();
  if ((await rateLimit(`view:${slug}:${ip}`, 1, 6 * 3600)).ok) {
    await db.post.updateMany({ where: { slug, status: "PUBLISHED" }, data: { views: { increment: 1 } } });
  }
  return new NextResponse(null, { status: 204 });
}
