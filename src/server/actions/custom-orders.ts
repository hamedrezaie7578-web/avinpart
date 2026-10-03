"use server";

import { randomInt } from "node:crypto";
import { format } from "date-fns-jalali";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { sendTemplateSms } from "@/lib/sms";
import { customOrderSchema } from "@/lib/validations/custom-order";
import type { ActionResult } from "./leads";

function trackingCode(type: "CUSTOM_SOFTWARE" | "WEBSITE") {
  return `${type === "WEBSITE" ? "WD" : "CS"}-${format(new Date(), "yyMMdd")}-${randomInt(1000, 9999)}`;
}

export async function createCustomOrder(
  input: unknown,
): Promise<ActionResult & { trackingCode?: string }> {
  const parsed = customOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "لطفاً اطلاعات فرم را بررسی کنید.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }
  const d = parsed.data;
  if (d.website) return { ok: true, message: "ثبت شد." };

  const ip = await getClientIp();
  if (!(await rateLimit(`custom-order:${ip}`, 3, 3600)).ok) {
    return {
      ok: false,
      message: "تعداد درخواست‌های شما زیاد است؛ لطفاً یک ساعت دیگر تلاش کنید یا با ما تماس بگیرید.",
    };
  }

  // فقط پیوست‌هایی که همین تازگی آپلود شده و به جایی متصل نیستند قابل اتصال‌اند
  const attachments = d.attachmentIds.length
    ? await db.media.findMany({
        where: {
          id: { in: d.attachmentIds },
          isPrivate: true,
          path: { startsWith: "custom-orders/" },
          createdAt: { gte: new Date(Date.now() - 6 * 3600_000) },
          customOrders: { none: {} },
        },
        select: { id: true },
      })
    : [];

  // اگر کاربری با این موبایل ثبت‌نام کرده، سفارش به پنل او متصل می‌شود
  const user = await db.user.findUnique({ where: { mobile: d.mobile }, select: { id: true } });

  let code = trackingCode(d.type);
  for (
    let i = 0;
    i < 5 && (await db.customOrder.findUnique({ where: { trackingCode: code } }));
    i++
  )
    code = trackingCode(d.type);

  await db.customOrder.create({
    data: {
      trackingCode: code,
      type: d.type,
      userId: user?.id,
      contactName: d.contactName,
      mobile: d.mobile,
      email: d.email || null,
      businessName: d.businessName || null,
      businessField: d.businessField,
      projectTypes: d.projectTypes,
      platforms: d.platforms,
      features: d.features,
      description: d.description,
      budgetRange: d.budgetRange,
      timeline: d.timeline,
      attachments: { connect: attachments },
      events: {
        create: { status: "NEW", message: "درخواست ثبت شد و در صف بررسی کارشناسان قرار گرفت." },
      },
    },
  });
  await db.adminNotification.create({
    data: {
      type: "custom_order",
      title: `سفارش اختصاصی جدید: ${d.contactName} (${code})`,
      href: "/admin/custom-orders",
    },
  });
  await sendTemplateSms("custom_order_created", d.mobile, {
    trackingCode: code,
    name: d.contactName,
  });

  return { ok: true, message: "درخواست شما با موفقیت ثبت شد.", trackingCode: code };
}
