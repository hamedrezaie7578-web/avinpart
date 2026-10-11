import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";

/** سرو فایل‌های عمومی کتابخانه‌ی رسانه با کش طولانی (نام فایل‌ها یکتا و تغییرناپذیرند) */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = `media/${path.join("/")}`;
  if (key.includes("..")) return new NextResponse(null, { status: 400 });
  const media = await db.media.findFirst({ where: { path: key, isPrivate: false } });
  if (!media) return new NextResponse(null, { status: 404 });
  try {
    const data = await getStorage().get(key);
    return new NextResponse(new Uint8Array(data), {
      headers: { "Content-Type": media.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
