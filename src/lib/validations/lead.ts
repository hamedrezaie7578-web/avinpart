import { z } from "zod";
import { normalizeMobile } from "@/lib/format";

export const mobileSchema = z.string({ error: "شماره موبایل را وارد کنید" }).transform((v, ctx) => {
  const m = normalizeMobile(v);
  if (!m) {
    ctx.addIssue({ code: "custom", message: "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)" });
    return z.NEVER;
  }
  return m;
});

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const demoRequestSchema = z.object({
  name: z.string().trim().min(2, "نام را کامل وارد کنید").max(80),
  mobile: mobileSchema,
  businessName: optionalText(120),
  productSlug: optionalText(40),
  type: z.enum(["DEMO", "CONSULT"]).default("DEMO"),
  message: optionalText(1000),
  source: z.string().max(300).optional(),
  // فیلد تله برای ربات‌ها؛ باید خالی بماند
  website: optionalText(0),
});
export type DemoRequestInput = z.input<typeof demoRequestSchema>;

export const newsletterSchema = z.object({
  mobile: mobileSchema,
  website: optionalText(0),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "نام را کامل وارد کنید").max(80),
  mobile: mobileSchema,
  subject: z.enum(["sales", "support", "custom", "other"]).default("other"),
  message: z.string().trim().min(10, "پیام کوتاه است؛ کمی بیشتر توضیح دهید").max(3000),
  website: optionalText(0),
});
