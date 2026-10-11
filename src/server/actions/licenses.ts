"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { addTax } from "@/lib/pricing";
import { getUpgradeOptions } from "@/server/licenses";
import { startPayment } from "@/server/orders";
import { getSettings } from "@/server/queries/settings";

async function requireUser() {
  const s = await auth();
  if (!s?.user) throw new Error("UNAUTHORIZED");
  return s.user;
}

export async function createUpgradeOrder(licenseId: string, planCode: string) {
  const user = await requireUser();
  const data = await getUpgradeOptions(licenseId, user.id);
  const opt = data?.options.find((o) => o.plan.code === planCode);
  if (!data || !opt) return { ok: false as const, message: "ارتقا به این پلن امکان‌پذیر نیست." };
  if (data.license.status === "REVOKED")
    return { ok: false as const, message: "این لایسنس باطل شده است." };
  const { taxPercent } = await getSettings();
  const { tax, total } = addTax(opt.difference, taxPercent);
  const order = await db.order.create({
    data: {
      userId: user.id,
      kind: "UPGRADE",
      upgradeFromLicenseId: licenseId,
      subtotal: opt.difference,
      tax,
      total,
      items: {
        create: {
          productId: data.license.productId,
          planId: opt.plan.id,
          unitPrice: opt.difference,
          title: `ارتقای ${data.license.product.name} به ${opt.plan.name}`,
        },
      },
    },
  });
  return startPayment(order.id, user.mobile);
}

export async function createRenewalOrder(licenseId: string) {
  const user = await requireUser();
  const lic = await db.license.findFirst({
    where: { id: licenseId, userId: user.id },
    include: { plan: true, product: true },
  });
  if (!lic || !lic.plan.durationDays || !lic.plan.renewalPrice)
    return { ok: false as const, message: "این لایسنس نیاز به تمدید ندارد." };
  if (lic.status === "REVOKED") return { ok: false as const, message: "این لایسنس باطل شده است." };
  const { taxPercent } = await getSettings();
  const { tax, total } = addTax(lic.plan.renewalPrice, taxPercent);
  const order = await db.order.create({
    data: {
      userId: user.id,
      kind: "RENEWAL",
      upgradeFromLicenseId: lic.id,
      subtotal: lic.plan.renewalPrice,
      tax,
      total,
      items: {
        create: {
          productId: lic.productId,
          planId: lic.planId,
          unitPrice: lic.plan.renewalPrice,
          title: `تمدید سالانه‌ی ${lic.product.name} — ${lic.plan.name}`,
        },
      },
    },
  });
  return startPayment(order.id, user.mobile);
}

/** غیرفعال کردن یک دستگاه از پنل کاربری برای انتقال لایسنس */
export async function deactivateMyDevice(deviceId: string) {
  const user = await requireUser();
  const device = await db.licenseDevice.findFirst({
    where: { id: deviceId, license: { userId: user.id } },
  });
  if (!device) return { ok: false as const, message: "دستگاه یافت نشد." };
  await db.licenseDevice.update({ where: { id: device.id }, data: { isActive: false } });
  await db.licenseLog.create({
    data: {
      licenseId: device.licenseId,
      action: "deactivate",
      result: "ok:dashboard",
      hardwareId: device.hardwareId,
    },
  });
  revalidatePath("/dashboard/licenses");
  return { ok: true as const };
}
