import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

export const OTP_TTL_SECONDS = 120;
export const OTP_MAX_ATTEMPTS = 5;
const OTP_LENGTH = 5;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET تنظیم نشده است");
  return s;
}

/** هش کد با HMAC تا حتی با دسترسی به دیتابیس، کد قابل بازیابی نباشد */
export function hashOtp(mobile: string, code: string): string {
  return createHmac("sha256", secret()).update(`${mobile}:${code}`).digest("hex");
}

export function generateOtp(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

export async function createOtp(mobile: string, ip: string): Promise<string> {
  const code = generateOtp();
  // کدهای قبلی استفاده‌نشده باطل می‌شوند
  await db.otpCode.updateMany({ where: { mobile, usedAt: null }, data: { usedAt: new Date() } });
  await db.otpCode.create({
    data: {
      mobile,
      codeHash: hashOtp(mobile, code),
      ip,
      expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
    },
  });
  return code;
}

export type OtpCheck = "ok" | "invalid" | "expired" | "too_many";

/** بررسی کد؛ هر تلاش ناموفق شمرده و پس از ۵ تلاش کد باطل می‌شود */
export async function verifyOtp(mobile: string, code: string): Promise<OtpCheck> {
  const otp = await db.otpCode.findFirst({
    where: { mobile, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return "expired";
  if (otp.expiresAt < new Date()) return "expired";
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return "too_many";

  const a = Buffer.from(otp.codeHash, "hex");
  const b = Buffer.from(hashOtp(mobile, code), "hex");
  const match = a.length === b.length && timingSafeEqual(a, b);
  if (!match) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return otp.attempts + 1 >= OTP_MAX_ATTEMPTS ? "too_many" : "invalid";
  }
  await db.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  return "ok";
}
