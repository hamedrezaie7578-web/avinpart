import { OG_SIZE, renderOg } from "@/lib/og";
import { themeSchema } from "@/lib/theme";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { getLandingProduct } from "@/server/queries/landing";

async function customOgImage(mediaId: string) {
  try {
    const m = await db.media.findUnique({ where: { id: mediaId } });
    if (!m || m.isPrivate) return null;
    const sharp = (await import("sharp")).default;
    const png = await sharp(await getStorage().get(m.path)).resize(1200, 630, { fit: "cover" }).png().toBuffer();
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
  } catch {
    return null;
  }
}

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "معرفی نرم‌افزار";
export const revalidate = 86400;

/** تصویر OG هر محصول با پالت رنگ همان صنف */
export default async function Image({ params }: { params: Promise<{ productSlug: string }> }) {
  const { productSlug } = await params;
  const p = await getLandingProduct(productSlug);
  if (!p) return renderOg({ title: "AvinApps" });
  // تصویر OG دلخواه که مدیر در تب سئو انتخاب کرده
  if (p.ogImageId) {
    const custom = await customOgImage(p.ogImageId);
    if (custom) return custom;
  }
  const t = themeSchema.safeParse(p.theme);
  return renderOg({
    eyebrow: p.name,
    title: `نرم‌افزار حسابداری ${p.industryName}`,
    subtitle: p.shortDesc,
    ...(t.success ? { from: t.data.gradientFrom, to: t.data.gradientTo, fg: t.data.heroFg } : {}),
  });
}
