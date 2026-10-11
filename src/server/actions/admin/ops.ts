"use server";

import { db } from "@/lib/db";
import { getSmsProvider, renderTemplate } from "@/lib/sms";
import { normalizeMobile } from "@/lib/format";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";

/* ───────────── درخواست‌ها (Leads) ───────────── */

export async function toggleLeadHandled(id: string) {
  return adminAction("forms.write", async (admin) => {
    const l = await db.lead.findUnique({ where: { id } });
    if (!l) throw new ActionError("یافت نشد.");
    await db.lead.update({ where: { id }, data: { isHandled: !l.isHandled } });
    await audit(admin.id, "lead.handled", "Lead", id, { value: !l.isHandled });
    return { ok: true, message: l.isHandled ? "به حالت رسیدگی‌نشده برگشت." : "رسیدگی‌شده علامت خورد." };
  });
}

export async function deleteLead(id: string) {
  return adminAction("forms.write", async (admin) => {
    await db.lead.delete({ where: { id } });
    await audit(admin.id, "lead.delete", "Lead", id);
    return { ok: true, message: "حذف شد." };
  });
}

/* ───────────── قالب‌های اعلان و پیامک ───────────── */

export async function saveTemplate(id: string, f: FormData) {
  return adminAction("notifications.write", async (admin) => {
    const data = {
      body: fd.str(f, "body", { required: "متن قالب خالی است.", max: 1000 }),
      kavenegarTemplate: fd.opt(f, "kavenegarTemplate"),
      isActive: fd.bool(f, "isActive"),
    };
    await db.notificationTemplate.update({ where: { id }, data });
    await audit(admin.id, "template.update", "NotificationTemplate", id, data);
    return { ok: true, message: "قالب ذخیره شد." };
  });
}

/** ارسال پیامک گروهی به گروهی از مشتریان یا فهرست شماره‌ها (حداکثر ۵۰۰ شماره در هر بار) */
export async function sendBulkSms(f: FormData) {
  return adminAction<{ sent: number; failed: number }>("notifications.send", async (admin) => {
    const body = fd.str(f, "body", { required: "متن پیامک را بنویسید.", max: 600 });
    const audience = fd.str(f, "audience");
    let targets: Array<{ mobile: string; name: string }> = [];
    if (audience === "custom") {
      targets = fd
        .str(f, "mobiles")
        .split(/[\s,،]+/)
        .map((m) => normalizeMobile(m))
        .filter((m): m is string => !!m)
        .map((mobile) => ({ mobile, name: "" }));
    } else {
      const where =
        audience === "licensed"
          ? { type: "CUSTOMER" as const, isBlocked: false, licenses: { some: { status: "ACTIVE" as const } } }
          : audience === "product"
            ? { type: "CUSTOMER" as const, isBlocked: false, licenses: { some: { productId: fd.str(f, "productId"), status: "ACTIVE" as const } } }
            : { type: "CUSTOMER" as const, isBlocked: false };
      targets = (await db.user.findMany({ where, select: { mobile: true, name: true }, take: 501 })).map((u) => ({ mobile: u.mobile, name: u.name ?? "" }));
    }
    targets = [...new Map(targets.map((t) => [t.mobile, t])).values()];
    if (!targets.length) throw new ActionError("گیرنده‌ای یافت نشد.");
    if (targets.length > 500) throw new ActionError("حداکثر ۵۰۰ گیرنده در هر ارسال؛ گروه را محدودتر کنید.");
    if (fd.bool(f, "dryRun")) return { ok: true, message: `${targets.length.toLocaleString("fa-IR")} گیرنده — ارسالی انجام نشد (پیش‌نمایش).`, data: { sent: 0, failed: 0 } };
    const sms = await getSmsProvider();
    let sent = 0;
    let failed = 0;
    for (const t of targets) {
      try {
        await sms.send(t.mobile, renderTemplate(body, { name: t.name || "مشتری" }));
        sent++;
        await db.smsLog.create({ data: { mobile: t.mobile, template: "bulk", status: "sent", provider: sms.name } });
      } catch {
        failed++;
        await db.smsLog.create({ data: { mobile: t.mobile, template: "bulk", status: "failed", provider: sms.name } });
      }
    }
    await audit(admin.id, "sms.bulk", "SmsLog", null, { audience, count: targets.length, sent, failed });
    return { ok: true, message: `ارسال شد: ${sent.toLocaleString("fa-IR")} موفق، ${failed.toLocaleString("fa-IR")} ناموفق.`, data: { sent, failed } };
  });
}
