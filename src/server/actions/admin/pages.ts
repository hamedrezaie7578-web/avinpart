"use server";

import { db } from "@/lib/db";
import { cleanHtml } from "@/lib/sanitize";
import { SYSTEM_PAGES } from "@/lib/pages";
import { HOME_TEXT_FIELDS } from "@/lib/home-texts";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";
import { invalidate } from "@/server/admin/revalidate";

export async function savePage(id: string | null, f: FormData) {
  return adminAction<{ id: string }>("pages.write", async (admin) => {
    const existing = id ? await db.page.findUnique({ where: { id } }) : null;
    if (id && !existing) throw new ActionError("صفحه یافت نشد.");
    // نامک صفحات سیستمی قابل تغییر نیست
    const slug = existing && existing.slug in SYSTEM_PAGES ? existing.slug : fd.slug(f, "slug");
    if (!existing && slug in SYSTEM_PAGES) throw new ActionError("این نامک رزرو شده است.");
    const html = cleanHtml(String(f.get("html") ?? ""));
    const data = {
      slug,
      title: fd.str(f, "title", { required: "عنوان صفحه را وارد کنید.", max: 120 }),
      content: { html },
      seoTitle: fd.opt(f, "seoTitle"),
      seoDescription: fd.opt(f, "seoDescription"),
    };
    const p = id ? await db.page.update({ where: { id }, data }) : await db.page.create({ data });
    await audit(admin.id, id ? "page.update" : "page.create", "Page", p.id, { slug, title: data.title, length: html.length });
    invalidate.pages();
    return { ok: true, message: "صفحه ذخیره شد.", data: { id: p.id } };
  });
}

export async function deletePage(id: string) {
  return adminAction("pages.write", async (admin) => {
    const p = await db.page.findUnique({ where: { id } });
    if (!p) throw new ActionError("صفحه یافت نشد.");
    if (p.slug in SYSTEM_PAGES) throw new ActionError("صفحات سیستمی قابل حذف نیستند.");
    await db.page.delete({ where: { id } });
    await audit(admin.id, "page.delete", "Page", id, { slug: p.slug });
    invalidate.pages();
    return { ok: true, message: "صفحه حذف شد." };
  });
}

export async function saveHomeTexts(f: FormData) {
  return adminAction("pages.write", async (admin) => {
    const value = Object.fromEntries(HOME_TEXT_FIELDS.map(([k]) => [k, fd.str(f, k, { max: 600 })]));
    await db.setting.upsert({ where: { key: "home.texts" }, create: { key: "home.texts", value }, update: { value } });
    await audit(admin.id, "home.texts", "Setting", "home.texts");
    invalidate.settings();
    return { ok: true, message: "متن‌های صفحه‌ی اصلی ذخیره شد." };
  });
}
