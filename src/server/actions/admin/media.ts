"use server";

import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { saveImage } from "@/server/media";

export async function uploadMedia(f: FormData) {
  return adminAction<{ items: Array<{ id: string; url: string; alt: string }> }>("media.write", async (admin) => {
    const files = f.getAll("files").filter((x): x is File => x instanceof File && x.size > 0);
    if (!files.length) throw new ActionError("فایلی انتخاب نشده است.");
    if (files.length > 20) throw new ActionError("حداکثر ۲۰ فایل در هر بار.");
    const items = [];
    for (const file of files) {
      try {
        const m = await saveImage(file, { uploadedById: admin.id });
        items.push({ id: m.id, url: m.url, alt: m.alt ?? "" });
      } catch (e) {
        throw new ActionError(e instanceof Error ? e.message : "پردازش تصویر ناموفق بود.");
      }
    }
    await audit(admin.id, "media.upload", "Media", null, { count: items.length });
    return { ok: true, message: `${items.length} تصویر بارگذاری و به WebP تبدیل شد.`, data: { items } };
  });
}

export async function updateMediaAlt(id: string, f: FormData) {
  return adminAction("media.write", async () => {
    await db.media.update({ where: { id }, data: { alt: String(f.get("alt") ?? "").trim().slice(0, 200) } });
  });
}

export async function deleteMedia(id: string) {
  return adminAction("media.delete", async (admin) => {
    const m = await db.media.findUniqueOrThrow({ where: { id }, include: { _count: { select: { screenshots: true, productLogos: true, postCovers: true, portfolioCovers: true } } } });
    const used = m._count.screenshots + m._count.productLogos + m._count.postCovers + m._count.portfolioCovers;
    if (used) throw new ActionError("این تصویر در محصول، مقاله یا نمونه‌کار استفاده شده است؛ ابتدا آن را جایگزین کنید.");
    await db.media.delete({ where: { id } });
    await getStorage().delete(m.path);
    await audit(admin.id, "media.delete", "Media", id);
    return { ok: true, message: "حذف شد." };
  });
}
