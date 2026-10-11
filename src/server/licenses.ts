import "server-only";
import { createHash } from "node:crypto";
import type { Platform } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeLicenseKey, OFFLINE_GRACE_DAYS, signLicensePayload } from "@/lib/license";
import { upgradeDifference } from "@/lib/pricing";
import { priceLine } from "@/server/cart";

/** شناسه‌ی سخت‌افزاری دوباره هش می‌شود تا طول یکسان و حریم خصوصی حفظ شود */
export function hashHardwareId(hw: string) {
  return createHash("sha256").update(hw.trim()).digest("hex");
}

export type VerifyInput = {
  key: string;
  hardwareId: string;
  platform: Platform;
  deviceName?: string;
  appVersion?: string;
  ip?: string;
};

export type VerifyReason =
  "not_found" | "revoked" | "suspended" | "expired" | "platform_not_in_plan" | "max_devices";

/**
 * اعتبارسنجی و فعال‌سازی لایسنس روی یک دستگاه.
 * پاسخ با Ed25519 امضا می‌شود تا نرم‌افزار بتواند تا validUntil آفلاین کار کند.
 */
export async function verifyAndActivate(input: VerifyInput) {
  const key = normalizeLicenseKey(input.key);
  const hw = hashHardwareId(input.hardwareId);
  const now = new Date();
  const lic = await db.license.findUnique({
    where: { key },
    include: {
      product: { select: { slug: true, name: true } },
      plan: true,
      devices: { where: { isActive: true } },
    },
  });

  const fail = async (reason: VerifyReason, licenseId?: string) => {
    if (licenseId)
      await db.licenseLog.create({
        data: {
          licenseId,
          action: "verify",
          result: `denied:${reason}`,
          ip: input.ip,
          hardwareId: hw,
        },
      });
    return {
      status: reason === "not_found" ? 404 : 403,
      body: signLicensePayload({
        valid: false,
        reason,
        key,
        hardwareId: input.hardwareId,
        issuedAt: now.toISOString(),
      }),
    };
  };

  if (!lic) return fail("not_found");
  if (lic.status === "REVOKED") return fail("revoked", lic.id);
  if (lic.status === "SUSPENDED") return fail("suspended", lic.id);
  if (lic.status === "EXPIRED" || (lic.expiresAt && lic.expiresAt < now)) {
    if (lic.status !== "EXPIRED")
      await db.license.update({ where: { id: lic.id }, data: { status: "EXPIRED" } });
    return fail("expired", lic.id);
  }
  if (!lic.plan.platforms.includes(input.platform)) return fail("platform_not_in_plan", lic.id);

  let device = lic.devices.find((d) => d.hardwareId === hw);
  if (device) {
    device = await db.licenseDevice.update({
      where: { id: device.id },
      data: { lastSeenAt: now, deviceName: input.deviceName ?? device.deviceName },
    });
  } else {
    // دستگاه غیرفعال‌شده‌ی قبلی دوباره فعال می‌شود (اگر ظرفیت باشد)
    if (lic.devices.length >= lic.maxDevices) return fail("max_devices", lic.id);
    device = await db.licenseDevice.upsert({
      where: { licenseId_hardwareId: { licenseId: lic.id, hardwareId: hw } },
      update: {
        isActive: true,
        lastSeenAt: now,
        activatedAt: now,
        platform: input.platform,
        deviceName: input.deviceName,
      },
      create: {
        licenseId: lic.id,
        hardwareId: hw,
        platform: input.platform,
        deviceName: input.deviceName,
      },
    });
    await db.licenseLog.create({
      data: { licenseId: lic.id, action: "activate", result: "ok", ip: input.ip, hardwareId: hw },
    });
  }
  await db.licenseLog.create({
    data: { licenseId: lic.id, action: "verify", result: "ok", ip: input.ip, hardwareId: hw },
  });

  const grace = new Date(now.getTime() + OFFLINE_GRACE_DAYS * 86400_000);
  const validUntil = lic.expiresAt && lic.expiresAt < grace ? lic.expiresAt : grace;
  const release = await db.release.findFirst({
    where: {
      isPublished: true,
      isDemo: false,
      platform: input.platform,
      OR: [{ productId: lic.productId }, { productId: null }],
    },
    orderBy: { createdAt: "desc" },
    select: { version: true, isMandatory: true },
  });
  const activeDevices = lic.devices.length + (lic.devices.some((d) => d.hardwareId === hw) ? 0 : 1);

  return {
    status: 200,
    body: signLicensePayload({
      valid: true,
      key,
      product: lic.product.slug,
      productName: lic.product.name,
      plan: lic.plan.code,
      platforms: lic.plan.platforms,
      status: "ACTIVE",
      expiresAt: lic.expiresAt?.toISOString() ?? null,
      maxDevices: lic.maxDevices,
      activeDevices,
      deviceId: device.id,
      hardwareId: input.hardwareId,
      issuedAt: now.toISOString(),
      validUntil: validUntil.toISOString(),
      latestVersion: release?.version ?? null,
      mandatoryUpdate: release?.isMandatory ?? false,
    }),
  };
}

export async function deactivateDevice(key: string, hardwareId: string, ip?: string) {
  const lic = await db.license.findUnique({ where: { key: normalizeLicenseKey(key) } });
  if (!lic) return false;
  const hw = hashHardwareId(hardwareId);
  const r = await db.licenseDevice.updateMany({
    where: { licenseId: lic.id, hardwareId: hw, isActive: true },
    data: { isActive: false },
  });
  if (r.count)
    await db.licenseLog.create({
      data: { licenseId: lic.id, action: "deactivate", result: "ok", ip, hardwareId: hw },
    });
  return r.count > 0;
}

/** مجموع مبالغ پرداخت‌شده برای یک لایسنس (خرید اولیه + ارتقاهای قبلی) */
export async function licensePaidAmount(licenseId: string): Promise<number> {
  const lic = await db.license.findUniqueOrThrow({
    where: { id: licenseId },
    include: { orderItem: { include: { order: true } } },
  });
  const upgrades = await db.order.aggregate({
    where: { upgradeFromLicenseId: licenseId, kind: "UPGRADE", status: "PAID" },
    _sum: { subtotal: true },
  });
  // سهم این قلم از تخفیف کوپن سفارش اولیه کسر می‌شود (مبلغ واقعاً پرداخت‌شده، بدون مالیات)
  const item = lic.orderItem;
  const original = item
    ? item.order.subtotal > 0
      ? Math.round(
          (item.unitPrice * (item.order.subtotal - item.order.discount)) / item.order.subtotal,
        )
      : 0
    : 0;
  return original + (upgrades._sum.subtotal ?? 0);
}

/** محاسبه‌ی گزینه‌های ارتقا با مابه‌التفاوت (برای نمایش در پنل) */
export async function getUpgradeOptions(licenseId: string, userId: string) {
  const lic = await db.license.findFirst({
    where: { id: licenseId, userId },
    include: { plan: true, product: true },
  });
  if (!lic) return null;
  const paid = await licensePaidAmount(lic.id);
  const plans = await db.plan.findMany({
    where: { isActive: true, sortOrder: { gt: lic.plan.sortOrder } },
    orderBy: { sortOrder: "asc" },
  });
  const options = [];
  for (const p of plans) {
    const { resolved } = await priceLine(lic.productId, p.id);
    if (!resolved.isAvailable) continue;
    options.push({
      plan: p,
      newPrice: resolved.price,
      difference: upgradeDifference({
        newPrice: resolved.price,
        paidPrice: paid,
        expiresAt: lic.expiresAt,
        startedAt: lic.createdAt,
      }),
    });
  }
  return { license: lic, paid, options };
}
