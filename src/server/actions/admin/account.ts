"use server";

import { hash, verify } from "@node-rs/argon2";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";
import { toEnDigits } from "@/lib/format";
import { generateTotpSecret, otpauthUrl, verifyTotp } from "@/lib/totp";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";

export async function changeOwnPassword(f: FormData) {
  return adminAction("self", async (admin) => {
    const u = await db.user.findUniqueOrThrow({ where: { id: admin.id } });
    const current = fd.str(f, "current");
    const next = fd.str(f, "next");
    if (!u.passwordHash || !(await verify(u.passwordHash, current))) throw new ActionError("رمز فعلی اشتباه است.");
    if (next.length < 10 || !/[a-zA-Z]/.test(next) || !/\d/.test(next)) throw new ActionError("رمز جدید حداقل ۱۰ کاراکتر شامل حرف و عدد باشد.");
    if (next !== fd.str(f, "confirm")) throw new ActionError("تکرار رمز جدید مطابقت ندارد.");
    await db.user.update({ where: { id: admin.id }, data: { passwordHash: await hash(next) } });
    await audit(admin.id, "account.password", "User", admin.id);
    return { ok: true, message: "رمز عبور تغییر کرد." };
  });
}

/** مرحله‌ی اول فعال‌سازی 2FA: ساخت کلید و QR (تا تأیید کد، فعال نمی‌شود) */
export async function startTwoFactor() {
  return adminAction<{ secret: string; qr: string }>("self", async (admin) => {
    const u = await db.user.findUniqueOrThrow({ where: { id: admin.id } });
    if (u.totpEnabled) throw new ActionError("ورود دومرحله‌ای از قبل فعال است.");
    const secret = generateTotpSecret();
    await db.user.update({ where: { id: admin.id }, data: { totpSecret: encrypt(secret) } });
    const qr = await QRCode.toDataURL(otpauthUrl(secret, u.email ?? u.mobile), { margin: 1, width: 220 });
    return { ok: true, data: { secret, qr } };
  });
}

export async function confirmTwoFactor(f: FormData) {
  return adminAction("self", async (admin) => {
    const u = await db.user.findUniqueOrThrow({ where: { id: admin.id } });
    if (!u.totpSecret) throw new ActionError("ابتدا کلید را بسازید.");
    if (!verifyTotp(decrypt(u.totpSecret), toEnDigits(fd.str(f, "code")))) throw new ActionError("کد واردشده درست نیست؛ ساعت گوشی را بررسی کنید.");
    await db.user.update({ where: { id: admin.id }, data: { totpEnabled: true } });
    await audit(admin.id, "account.2fa.enable", "User", admin.id);
    return { ok: true, message: "ورود دومرحله‌ای فعال شد." };
  });
}

export async function disableTwoFactor(f: FormData) {
  return adminAction("self", async (admin) => {
    const u = await db.user.findUniqueOrThrow({ where: { id: admin.id } });
    if (!u.totpEnabled || !u.totpSecret) throw new ActionError("ورود دومرحله‌ای فعال نیست.");
    if (!verifyTotp(decrypt(u.totpSecret), toEnDigits(fd.str(f, "code")))) throw new ActionError("کد واردشده درست نیست.");
    await db.user.update({ where: { id: admin.id }, data: { totpEnabled: false, totpSecret: null } });
    await audit(admin.id, "account.2fa.disable", "User", admin.id);
    return { ok: true, message: "ورود دومرحله‌ای غیرفعال شد." };
  });
}
