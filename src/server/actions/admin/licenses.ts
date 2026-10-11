"use server";

import { db } from "@/lib/db";
import { normalizeMobile } from "@/lib/format";
import { generateLicenseKey } from "@/lib/license";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";

export async function updateLicense(id: string, f: FormData) {
  return adminAction("licenses.write", async (admin) => {
    const status = fd.str(f, "status") as "ACTIVE" | "SUSPENDED" | "REVOKED" | "EXPIRED";
    if (!["ACTIVE", "SUSPENDED", "REVOKED", "EXPIRED"].includes(status)) throw new ActionError("وضعیت نامعتبر است.");
    const before = await db.license.findUniqueOrThrow({ where: { id } });
    if (status === "REVOKED" && before.status !== "REVOKED") {
      // ابطال نیازمند مجوز جداگانه است
      const can = admin.permissions.includes("*") || admin.permissions.includes("licenses.revoke");
      if (!can) throw new ActionError("مجوز ابطال لایسنس را ندارید.");
    }
    const data = {
      status,
      maxDevices: fd.int(f, "maxDevices", { required: "تعداد دستگاه را وارد کنید.", min: 1 })!,
      expiresAt: fd.date(f, "expiresAt"),
      webUrl: fd.opt(f, "webUrl"),
      note: fd.opt(f, "note"),
    };
    await db.license.update({ where: { id }, data: { ...data, logs: { create: { action: "admin_update", result: `by:${admin.mobile}` } } } });
    await audit(admin.id, "license.update", "License", id, { before: { status: before.status, maxDevices: before.maxDevices, expiresAt: before.expiresAt }, after: data });
  });
}

export async function adminDeactivateDevice(deviceId: string) {
  return adminAction("licenses.write", async (admin) => {
    const d = await db.licenseDevice.update({ where: { id: deviceId }, data: { isActive: false } });
    await db.licenseLog.create({ data: { licenseId: d.licenseId, action: "deactivate", result: `admin:${admin.mobile}`, hardwareId: d.hardwareId } });
    await audit(admin.id, "license.device_deactivate", "License", d.licenseId);
    return { ok: true, message: "دستگاه غیرفعال شد." };
  });
}

/** صدور لایسنس دستی (فروش حضوری، هدیه، نسخه‌ی نمایندگی) */
export async function createManualLicense(f: FormData) {
  return adminAction<{ id: string }>("licenses.write", async (admin) => {
    const mobile = normalizeMobile(fd.str(f, "mobile", { required: "موبایل مشتری را وارد کنید." }));
    if (!mobile) throw new ActionError("موبایل نامعتبر است.");
    const product = await db.product.findUnique({ where: { id: fd.str(f, "productId", { required: "محصول را انتخاب کنید." }) } });
    const plan = await db.plan.findUnique({ where: { id: fd.str(f, "planId", { required: "پلن را انتخاب کنید." }) } });
    if (!product || !plan) throw new ActionError("محصول یا پلن نامعتبر است.");
    const user = await db.user.upsert({ where: { mobile }, update: {}, create: { mobile, name: fd.opt(f, "name") } });
    let key = generateLicenseKey();
    while (await db.license.findUnique({ where: { key } })) key = generateLicenseKey();
    const lic = await db.license.create({
      data: {
        key,
        userId: user.id,
        productId: product.id,
        planId: plan.id,
        maxDevices: fd.int(f, "maxDevices") ?? plan.maxDevices,
        expiresAt: fd.date(f, "expiresAt") ?? (plan.durationDays ? new Date(Date.now() + plan.durationDays * 86400_000) : null),
        note: fd.opt(f, "note"),
        logs: { create: { action: "issue", result: `manual:${admin.mobile}` } },
      },
    });
    await audit(admin.id, "license.create_manual", "License", lic.id, { mobile, product: product.slug, plan: plan.code });
    return { ok: true, message: "لایسنس صادر شد.", data: { id: lic.id } };
  });
}
