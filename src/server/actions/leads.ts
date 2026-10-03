"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { contactSchema, demoRequestSchema, newsletterSchema } from "@/lib/validations/lead";

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function submitDemoRequest(input: unknown): Promise<ActionResult> {
  const parsed = demoRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "لطفاً خطاهای فرم را برطرف کنید.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }
  if (parsed.data.website) return { ok: true, message: "درخواست شما ثبت شد." }; // ربات

  const ip = await getClientIp();
  const rl = await rateLimit(`lead:${ip}`, 5, 600);
  if (!rl.ok)
    return {
      ok: false,
      message: "تعداد درخواست‌ها زیاد است؛ لطفاً چند دقیقه‌ی دیگر دوباره تلاش کنید.",
    };

  const { name, mobile, businessName, productSlug, type, message, source } = parsed.data;
  const product = productSlug
    ? await db.product.findUnique({ where: { slug: productSlug }, select: { id: true } })
    : null;
  await db.lead.create({
    data: {
      type,
      name,
      mobile,
      productId: product?.id,
      message:
        [businessName && `کسب‌وکار: ${businessName}`, message].filter(Boolean).join("\n") || null,
      source,
    },
  });
  await db.adminNotification.create({
    data: {
      type: "lead",
      title: `درخواست ${type === "DEMO" ? "دمو" : "مشاوره"}: ${name}`,
      href: "/admin/forms",
    },
  });
  return {
    ok: true,
    message: "درخواست شما ثبت شد. کارشناسان ما حداکثر تا یک روز کاری با شما تماس می‌گیرند.",
  };
}

export async function subscribeNewsletter(input: unknown): Promise<ActionResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };
  if (parsed.data.website) return { ok: true, message: "عضویت شما ثبت شد." };
  const ip = await getClientIp();
  if (!(await rateLimit(`newsletter:${ip}`, 5, 600)).ok)
    return { ok: false, message: "لطفاً کمی بعد دوباره تلاش کنید." };
  const exists = await db.lead.findFirst({
    where: { type: "NEWSLETTER", mobile: parsed.data.mobile },
  });
  if (!exists)
    await db.lead.create({
      data: { type: "NEWSLETTER", mobile: parsed.data.mobile, source: "footer" },
    });
  return { ok: true, message: "عضویت شما در خبرنامه ثبت شد. ممنون!" };
}

const SUBJECTS: Record<string, string> = {
  sales: "مشاوره‌ی خرید",
  support: "پشتیبانی",
  custom: "سفارش اختصاصی",
  other: "سایر",
};

export async function submitContact(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "لطفاً خطاهای فرم را برطرف کنید.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }
  if (parsed.data.website) return { ok: true, message: "پیام شما ارسال شد." };
  const ip = await getClientIp();
  if (!(await rateLimit(`contact:${ip}`, 5, 600)).ok)
    return { ok: false, message: "تعداد پیام‌ها زیاد است؛ لطفاً کمی بعد تلاش کنید." };
  const { name, mobile, subject, message } = parsed.data;
  await db.lead.create({
    data: {
      type: "CONTACT",
      name,
      mobile,
      message: `[${SUBJECTS[subject]}] ${message}`,
      source: "/contact",
    },
  });
  await db.adminNotification.create({
    data: { type: "lead", title: `پیام تماس جدید: ${name}`, href: "/admin/forms" },
  });
  return {
    ok: true,
    message: "پیام شما دریافت شد. همکاران ما در اولین فرصت (معمولاً همان روز کاری) پاسخ می‌دهند.",
  };
}
