"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { cleanHtml } from "@/lib/sanitize";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";
import { invalidate } from "@/server/admin/revalidate";

function payload<T>(f: FormData, schema: z.ZodType<T>): T {
  let raw: unknown;
  try {
    raw = JSON.parse(String(f.get("payload") ?? "null"));
  } catch {
    throw new ActionError("داده‌ی ارسالی نامعتبر است.");
  }
  const r = schema.safeParse(raw);
  if (!r.success) throw new ActionError(r.error.issues[0]?.message ?? "داده نامعتبر است.");
  return r.data;
}

/* ───────────── منوها ───────────── */

const MENU_KEYS = ["header", "footer-company", "footer-services", "footer-support"] as const;

const menuItems = z.array(
  z.object({
    label: z.string().trim().min(1, { error: "متن آیتم منو خالی است." }).max(60),
    href: z
      .string()
      .trim()
      .refine((h) => /^(\/|https?:\/\/|#|tel:|mailto:)/.test(h), { error: "لینک باید با / یا https:// شروع شود." }),
  }),
);

export async function saveMenu(key: string, f: FormData) {
  return adminAction("menus.write", async (admin) => {
    if (!(MENU_KEYS as readonly string[]).includes(key)) throw new ActionError("منو نامعتبر است.");
    const items = payload(f, menuItems);
    const menu = await db.menu.upsert({ where: { key }, create: { key }, update: {} });
    await db.$transaction([
      db.menuItem.deleteMany({ where: { menuId: menu.id } }),
      db.menuItem.createMany({ data: items.map((it, i) => ({ ...it, menuId: menu.id, sortOrder: i })) }),
    ]);
    await audit(admin.id, "menu.save", "Menu", key, items);
    invalidate.menus();
    return { ok: true, message: "منو ذخیره شد." };
  });
}

/* ───────────── سؤالات متداول عمومی ───────────── */

const FAQ_GROUPS = ["general", "payment", "license", "custom", "website"] as const;

export async function saveGeneralFaqs(group: string, f: FormData) {
  return adminAction("content.write", async (admin) => {
    if (!(FAQ_GROUPS as readonly string[]).includes(group)) throw new ActionError("گروه نامعتبر است.");
    const list = payload(
      f,
      z.array(z.object({ question: z.string().trim().min(3, { error: "سؤال خالی است." }).max(300), answer: z.string().trim().min(3, { error: "پاسخ خالی است." }).max(3000) })),
    );
    await db.$transaction([
      db.faq.deleteMany({ where: { productId: null, group } }),
      db.faq.createMany({ data: list.map((x, i) => ({ ...x, group, sortOrder: i })) }),
    ]);
    await audit(admin.id, "faq.save", "Faq", group, { count: list.length });
    invalidate.content();
    return { ok: true, message: "سؤالات ذخیره شد." };
  });
}

/* ───────────── نظرات عمومی (صفحه‌ی اصلی) ───────────── */

export async function saveGeneralTestimonials(f: FormData) {
  return adminAction("content.write", async (admin) => {
    const list = payload(
      f,
      z.array(
        z.object({
          name: z.string().trim().min(2, { error: "نام خالی است." }).max(80),
          role: z.string().trim().max(160).default(""),
          body: z.string().trim().min(5, { error: "متن نظر خالی است." }).max(1500),
          rating: z.coerce.number().int().min(1).max(5).default(5),
          isSample: z.boolean().default(true),
          isPublished: z.boolean().default(true),
        }),
      ),
    );
    await db.$transaction([
      db.testimonial.deleteMany({ where: { productId: null } }),
      db.testimonial.createMany({ data: list.map((x, i) => ({ ...x, sortOrder: i })) }),
    ]);
    await audit(admin.id, "testimonials.save", "Testimonial", null, { count: list.length });
    invalidate.content();
    return { ok: true, message: "نظرات ذخیره شد." };
  });
}

/** تغییر وضعیت «نمونه» یک نظر (از فهرست همه‌ی نظرات) */
export async function toggleTestimonial(id: string, field: "isSample" | "isPublished") {
  return adminAction("content.write", async (admin) => {
    if (field !== "isSample" && field !== "isPublished") throw new ActionError("فیلد نامعتبر.");
    const t = await db.testimonial.findUnique({ where: { id } });
    if (!t) throw new ActionError("یافت نشد.");
    await db.testimonial.update({ where: { id }, data: { [field]: !t[field] } });
    await audit(admin.id, `testimonial.${field}`, "Testimonial", id, { value: !t[field] });
    invalidate.content();
    return { ok: true, message: "به‌روزرسانی شد." };
  });
}

/* ───────────── نمونه‌کارها ───────────── */

export async function savePortfolio(id: string | null, f: FormData) {
  return adminAction<{ id: string }>("content.write", async (admin) => {
    const data = {
      slug: fd.slug(f, "slug"),
      title: fd.str(f, "title", { required: "عنوان را وارد کنید.", max: 120 }),
      client: fd.opt(f, "client"),
      summary: fd.str(f, "summary", { required: "خلاصه را وارد کنید.", max: 500 }),
      body: { html: cleanHtml(String(f.get("html") ?? "")) },
      coverId: fd.opt(f, "coverId"),
      tags: fd.str(f, "tags").split(/[,،]/).map((s) => s.trim()).filter(Boolean),
      type: fd.str(f, "type") === "WEBSITE" ? ("WEBSITE" as const) : ("CUSTOM_SOFTWARE" as const),
      isPublished: fd.bool(f, "isPublished"),
      sortOrder: fd.int(f, "sortOrder") ?? 0,
    };
    const p = id ? await db.portfolioItem.update({ where: { id }, data }) : await db.portfolioItem.create({ data });
    await audit(admin.id, id ? "portfolio.update" : "portfolio.create", "PortfolioItem", p.id, { title: data.title });
    invalidate.content();
    return { ok: true, message: "نمونه‌کار ذخیره شد.", data: { id: p.id } };
  });
}

export async function deletePortfolio(id: string) {
  return adminAction("content.write", async (admin) => {
    await db.portfolioItem.delete({ where: { id } });
    await audit(admin.id, "portfolio.delete", "PortfolioItem", id);
    invalidate.content();
    return { ok: true, message: "حذف شد." };
  });
}
