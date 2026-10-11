import { SITE_URL } from "@/lib/site";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";

/**
 * دانلود فایل نصب: نسخه‌ی دمو برای همه؛ نسخه‌ی کامل فقط برای دارنده‌ی لایسنس فعال همان محصول.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ releaseId: string }> },
) {
  const { releaseId } = await params;
  const release = await db.release.findFirst({
    where: { id: releaseId, isPublished: true },
    include: { file: true },
  });
  if (!release?.file) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!release.isDemo) {
    const session = await auth();
    if (!session?.user)
      return NextResponse.redirect(new URL(`/login?callbackUrl=/dashboard/downloads`, SITE_URL));
    const owns =
      session.user.type === "ADMIN" ||
      (await db.license.count({
        where: {
          userId: session.user.id,
          status: "ACTIVE",
          plan: { platforms: { has: release.platform } },
          ...(release.productId ? { productId: release.productId } : {}),
        },
      })) > 0;
    if (!owns) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const data = await getStorage().get(release.file.path);
  await db.release.update({ where: { id: release.id }, data: { downloads: { increment: 1 } } });
  const ext = release.file.path.slice(release.file.path.lastIndexOf("."));
  const filename = `AvinApps-${release.platform}-${release.version}${ext}`;
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": release.file.mime || "application/octet-stream",
      "Content-Length": String(data.length),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
