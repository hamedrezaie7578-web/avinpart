"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toEnDigits } from "@/lib/format";

const digits = (len: number[], msg: string) =>
  z
    .string()
    .transform((v) => toEnDigits(v).replace(/\D/g, ""))
    .refine((v) => v === "" || len.includes(v.length), msg);

const schema = z.object({
  name: z.string().trim().min(2, "نام را کامل وارد کنید").max(80),
  email: z.string().trim().email("ایمیل معتبر نیست").max(120).optional().or(z.literal("")),
  businessName: z.string().trim().max(120).optional().or(z.literal("")),
  businessType: z.string().trim().max(80).optional().or(z.literal("")),
  nationalId: digits([10, 11], "شناسه‌ی ملی باید ۱۰ (حقیقی) یا ۱۱ (حقوقی) رقم باشد"),
  economicCode: digits([12, 14], "کد اقتصادی باید ۱۲ یا ۱۴ رقم باشد"),
  city: z.string().trim().max(60).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
});

export async function updateProfile(input: unknown) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, message: "ابتدا وارد شوید." };
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." };
  const d = parsed.data;
  if (d.email) {
    const taken = await db.user.findFirst({
      where: { email: d.email.toLowerCase(), id: { not: session.user.id } },
    });
    if (taken) return { ok: false as const, message: "این ایمیل قبلاً ثبت شده است." };
  }
  await db.user.update({
    where: { id: session.user.id },
    data: {
      name: d.name,
      email: d.email ? d.email.toLowerCase() : null,
      businessName: d.businessName || null,
      businessType: d.businessType || null,
      nationalId: d.nationalId || null,
      economicCode: d.economicCode || null,
      city: d.city || null,
      address: d.address || null,
    },
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true as const, message: "اطلاعات ذخیره شد." };
}
