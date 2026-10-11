"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { themeSchema, BRAND_THEME } from "@/lib/theme";
import { sectionSchemas, type SectionType } from "@/lib/sections";
import { cleanHtml } from "@/lib/sanitize";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";
import { invalidate } from "@/server/admin/revalidate";

function json<T>(f: FormData, schema: z.ZodType<T>, key = "payload"): T {
  let raw: unknown;
  try {
    raw = JSON.parse(String(f.get(key) ?? "null"));
  } catch {
    throw new ActionError("داده‌ی ارسالی نامعتبر است.");
  }
  const r = schema.safeParse(raw);
  if (!r.success) throw new ActionError("داده‌ها کامل نیست: " + (r.error.issues[0]?.message ?? ""));
  return r.data;
}

/* ───────────── اطلاعات کلی ───────────── */

export async function saveProductGeneral(id: string | null, f: FormData) {
  return adminAction<{ id: string }>("products.write", async (admin) => {
    const status = fd.str(f, "status");
    const data = {
      slug: fd.slug(f, "slug"),
      name: fd.str(f, "name", { required: "نام محصول را وارد کنید.", max: 60 }),
      industryName: fd.str(f, "industryName", { required: "نام صنف را وارد کنید.", max: 80 }),
      shortDesc: fd.str(f, "shortDesc", { required: "توضیح کوتاه را وارد کنید.", max: 300 }),
      icon: fd.str(f, "icon") || "Package",
      categoryId: fd.opt(f, "categoryId"),
      logoId: fd.opt(f, "logoId"),
      status: (["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status) ? status : "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      isFeatured: fd.bool(f, "isFeatured"),
      sortOrder: fd.int(f, "sortOrder") ?? 0,
      ratingValue: fd.float(f, "ratingValue"),
      ratingCount: fd.int(f, "ratingCount"),
    };
    if (data.ratingValue !== null && (data.ratingValue < 1 || data.ratingValue > 5)) throw new ActionError("امتیاز باید بین ۱ تا ۵ باشد.");
    const relatedIds = fd.arr(f, "relatedIds").filter((r) => r !== id);
    const p = id
      ? await db.product.update({ where: { id }, data: { ...data, related: { set: relatedIds.map((r) => ({ id: r })) } } })
      : await db.product.create({ data: { ...data, theme: BRAND_THEME, related: { connect: relatedIds.map((r) => ({ id: r })) } } });
    await audit(admin.id, id ? "product.update" : "product.create", "Product", p.id, data);
    invalidate.products();
    return { ok: true, message: "محصول ذخیره شد.", data: { id: p.id } };
  });
}

export async function deleteProduct(id: string) {
  return adminAction("products.delete", async (admin) => {
    const sold = await db.license.count({ where: { productId: id } });
    if (sold) {
      await db.product.update({ where: { id }, data: { status: "ARCHIVED" } });
      await audit(admin.id, "product.archive", "Product", id);
      invalidate.products();
      return { ok: true, message: "این محصول لایسنس فعال دارد؛ به‌جای حذف بایگانی شد." };
    }
    await db.product.delete({ where: { id } });
    await audit(admin.id, "product.delete", "Product", id);
    invalidate.products();
    return { ok: true, message: "محصول حذف شد." };
  });
}

/** کپی کامل یک محصول (برای ساخت سریع صنف جدید) */
export async function duplicateProduct(id: string) {
  return adminAction<{ id: string }>("products.write", async (admin) => {
    const src = await db.product.findUnique({ where: { id }, include: { sections: true, features: true, faqs: true } });
    if (!src) throw new ActionError("محصول یافت نشد.");
    let slug = `${src.slug}-copy`;
    for (let i = 2; await db.product.findUnique({ where: { slug } }); i++) slug = `${src.slug}-copy-${i}`;
    const p = await db.product.create({
      data: {
        slug,
        name: `${src.name} (کپی)`,
        industryName: src.industryName,
        shortDesc: src.shortDesc,
        icon: src.icon,
        categoryId: src.categoryId,
        theme: src.theme ?? BRAND_THEME,
        status: "DRAFT",
        keywords: src.keywords,
        sections: { create: src.sections.map((s) => ({ type: s.type, enabled: s.enabled, sortOrder: s.sortOrder, data: s.data ?? {} })) },
        features: { create: src.features.map((x) => ({ title: x.title, description: x.description, icon: x.icon, isKey: x.isKey, sortOrder: x.sortOrder })) },
        faqs: { create: src.faqs.map((x) => ({ question: x.question, answer: x.answer, group: x.group, sortOrder: x.sortOrder })) },
      },
    });
    await audit(admin.id, "product.duplicate", "Product", p.id, { from: id });
    return { ok: true, message: "کپی ساخته شد (پیش‌نویس).", data: { id: p.id } };
  });
}

/* ───────────── پالت رنگ ───────────── */

export async function saveProductTheme(id: string, f: FormData) {
  return adminAction("products.write", async (admin) => {
    const r = themeSchema.safeParse(Object.fromEntries(f));
    if (!r.success) throw new ActionError("رنگ‌ها باید کد hex معتبر باشند.");
    await db.product.update({ where: { id }, data: { theme: r.data } });
    await audit(admin.id, "product.theme", "Product", id, r.data);
    invalidate.products();
    return { ok: true, message: "پالت رنگ ذخیره شد." };
  });
}

/* ───────────── سکشن‌ها (Section builder) ───────────── */

const sectionInput = z.array(
  z.object({
    type: z.enum(Object.keys(sectionSchemas) as [SectionType, ...SectionType[]]),
    enabled: z.boolean(),
    data: z.unknown(),
  }),
);

/** اعتبارسنجی کامل سکشن‌ها؛ برمی‌گرداند داده‌ی تمیزشده برای ذخیره */
function validateSections(list: z.infer<typeof sectionInput>) {
  return list.map((s, i) => {
    const r = sectionSchemas[s.type].safeParse(s.data);
    if (!r.success) {
      const issue = r.error.issues[0];
      throw new ActionError(`سکشن #${i + 1} (${s.type}): ${issue?.path.join(".") || ""} ${issue?.message ?? "نامعتبر"}`);
    }
    const data = r.data as Record<string, unknown>;
    if (s.type === "RICH_TEXT") data.html = cleanHtml(String(data.html ?? ""));
    return { type: s.type, enabled: s.enabled, sortOrder: i, data: data as object };
  });
}

export async function saveSections(target: { productId?: string; pageId?: string }, f: FormData) {
  const perm = target.productId ? "products.write" : "pages.write";
  return adminAction(perm, async (admin) => {
    if (!target.productId && !target.pageId) throw new ActionError("مقصد نامعتبر است.");
    const rows = validateSections(json(f, sectionInput));
    const where = target.productId ? { productId: target.productId } : { pageId: target.pageId };
    await db.$transaction([
      db.landingSection.deleteMany({ where }),
      db.landingSection.createMany({ data: rows.map((r) => ({ ...r, ...where })) }),
    ]);
    await audit(admin.id, "sections.save", target.productId ? "Product" : "Page", target.productId ?? target.pageId, { count: rows.length });
    if (target.productId) invalidate.products();
    else invalidate.pages();
    return { ok: true, message: `${rows.length.toLocaleString("fa-IR")} سکشن ذخیره شد.` };
  });
}

/* ───────────── امکانات، FAQ، نظرات، اسکرین‌شات ───────────── */

const featureList = z.array(
  z.object({
    title: z.string().trim().min(2, { error: "عنوان امکان خالی است." }).max(120),
    description: z.string().trim().min(2, { error: "توضیح امکان خالی است." }).max(600),
    icon: z.string().default("Sparkles"),
    isKey: z.boolean().default(true),
  }),
);

export async function saveProductFeatures(id: string, f: FormData) {
  return adminAction("products.write", async (admin) => {
    const list = json(f, featureList);
    await db.$transaction([
      db.productFeature.deleteMany({ where: { productId: id } }),
      db.productFeature.createMany({ data: list.map((x, i) => ({ ...x, productId: id, sortOrder: i })) }),
    ]);
    await audit(admin.id, "product.features", "Product", id, { count: list.length });
    invalidate.products();
    return { ok: true, message: "امکانات ذخیره شد." };
  });
}

const faqList = z.array(
  z.object({
    question: z.string().trim().min(3, { error: "متن سؤال خالی است." }).max(300),
    answer: z.string().trim().min(3, { error: "متن پاسخ خالی است." }).max(3000),
  }),
);

export async function saveProductFaqs(id: string, f: FormData) {
  return adminAction("products.write", async (admin) => {
    const list = json(f, faqList);
    await db.$transaction([
      db.faq.deleteMany({ where: { productId: id } }),
      db.faq.createMany({ data: list.map((x, i) => ({ ...x, productId: id, sortOrder: i })) }),
    ]);
    await audit(admin.id, "product.faqs", "Product", id, { count: list.length });
    invalidate.products();
    return { ok: true, message: "سؤالات متداول ذخیره شد." };
  });
}

const testimonialItem = z.object({
  name: z.string().trim().min(2, { error: "نام خالی است." }).max(80),
  role: z.string().trim().max(160).default(""),
  body: z.string().trim().min(5, { error: "متن نظر خالی است." }).max(1500),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  isSample: z.boolean().default(true),
  isPublished: z.boolean().default(true),
});

export async function saveProductTestimonials(id: string, f: FormData) {
  return adminAction("products.write", async (admin) => {
    const list = json(f, z.array(testimonialItem));
    await db.$transaction([
      db.testimonial.deleteMany({ where: { productId: id } }),
      db.testimonial.createMany({ data: list.map((x, i) => ({ ...x, productId: id, sortOrder: i })) }),
    ]);
    await audit(admin.id, "product.testimonials", "Product", id, { count: list.length });
    invalidate.products();
    return { ok: true, message: "نظرات ذخیره شد." };
  });
}

const shotList = z.array(
  z.object({
    mediaId: z.string().min(1),
    caption: z.string().max(200).nullable().optional(),
    platform: z.enum(["WINDOWS", "ANDROID", "WEB", "IOS"]).nullable().optional(),
  }),
);

export async function saveProductScreenshots(id: string, f: FormData) {
  return adminAction("products.write", async (admin) => {
    const list = json(f, shotList);
    const found = await db.media.count({ where: { id: { in: list.map((s) => s.mediaId) } } });
    if (found !== new Set(list.map((s) => s.mediaId)).size) throw new ActionError("برخی تصاویر در کتابخانه یافت نشدند.");
    await db.$transaction([
      db.productScreenshot.deleteMany({ where: { productId: id } }),
      db.productScreenshot.createMany({ data: list.map((x, i) => ({ productId: id, mediaId: x.mediaId, caption: x.caption || null, platform: x.platform ?? null, sortOrder: i })) }),
    ]);
    await audit(admin.id, "product.screenshots", "Product", id, { count: list.length });
    invalidate.products();
    return { ok: true, message: "گالری ذخیره شد." };
  });
}

/* ───────────── قیمت اختصاصی پلن‌ها ───────────── */

export async function saveProductPricing(id: string, f: FormData) {
  return adminAction("products.write", async (admin) => {
    const plans = await db.plan.findMany({ select: { id: true } });
    const ops = plans.map((pl) => {
      const price = fd.int(f, `price_${pl.id}`, { min: 0 });
      const compareAtPrice = fd.int(f, `compare_${pl.id}`, { min: 0 });
      const isAvailable = fd.bool(f, `available_${pl.id}`);
      if (price !== null && compareAtPrice !== null && compareAtPrice <= price) throw new ActionError("قیمت خط‌خورده باید بیشتر از قیمت فروش باشد.");
      const data = { price, compareAtPrice, isAvailable };
      return db.productPlanPrice.upsert({ where: { productId_planId: { productId: id, planId: pl.id } }, create: { productId: id, planId: pl.id, ...data }, update: data });
    });
    await db.$transaction(ops);
    await audit(admin.id, "product.pricing", "Product", id);
    invalidate.products();
    return { ok: true, message: "قیمت‌ها ذخیره شد." };
  });
}

/* ───────────── سئو ───────────── */

export async function saveProductSeo(id: string, f: FormData) {
  return adminAction("products.write", async (admin) => {
    const data = {
      seoTitle: fd.opt(f, "seoTitle"),
      seoDescription: fd.opt(f, "seoDescription"),
      focusKeyword: fd.opt(f, "focusKeyword"),
      keywords: fd.str(f, "keywords").split(/[,،\n]/).map((s) => s.trim()).filter(Boolean),
      ogImageId: fd.opt(f, "ogImageId"),
    };
    if (data.seoTitle && data.seoTitle.length > 70) throw new ActionError("عنوان سئو حداکثر ۷۰ کاراکتر.");
    if (data.seoDescription && data.seoDescription.length > 170) throw new ActionError("توضیحات متا حداکثر ۱۷۰ کاراکتر.");
    await db.product.update({ where: { id }, data });
    await audit(admin.id, "product.seo", "Product", id, data);
    invalidate.products();
    return { ok: true, message: "تنظیمات سئو ذخیره شد." };
  });
}

/* ───────────── دسته‌بندی صنف‌ها ───────────── */

export async function saveCategory(id: string | null, f: FormData) {
  return adminAction("industries.write", async (admin) => {
    const data = { name: fd.str(f, "name", { required: "نام دسته را وارد کنید." }), slug: fd.slug(f, "slug"), sortOrder: fd.int(f, "sortOrder") ?? 0 };
    const c = id ? await db.industryCategory.update({ where: { id }, data }) : await db.industryCategory.create({ data });
    await audit(admin.id, id ? "category.update" : "category.create", "IndustryCategory", c.id, data);
    invalidate.products();
    return { ok: true, message: "دسته ذخیره شد." };
  });
}

export async function deleteCategory(id: string) {
  return adminAction("industries.write", async (admin) => {
    await db.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    await db.industryCategory.delete({ where: { id } });
    await audit(admin.id, "category.delete", "IndustryCategory", id);
    invalidate.products();
    return { ok: true, message: "دسته حذف شد." };
  });
}

export async function reorderProducts(f: FormData) {
  return adminAction("industries.write", async (admin) => {
    const ids = json(f, z.array(z.object({ id: z.string(), categoryId: z.string().nullable() })));
    await db.$transaction(ids.map((x, i) => db.product.update({ where: { id: x.id }, data: { sortOrder: i, categoryId: x.categoryId } })));
    await audit(admin.id, "products.reorder", "Product", null, { count: ids.length });
    invalidate.products();
    return { ok: true, message: "ترتیب و دسته‌بندی ذخیره شد." };
  });
}
