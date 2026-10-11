"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { normalizeMobile } from "@/lib/format";
import { createOtp, OTP_TTL_SECONDS } from "@/lib/otp";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { getSmsProvider } from "@/lib/sms";

/** فقط مسیرهای داخلی سایت به‌عنوان مقصد بعد از ورود پذیرفته می‌شوند (جلوگیری از open redirect) */
function safeCallback(url: string | undefined, fallback: string) {
  return url && url.startsWith("/") && !url.startsWith("//") ? url : fallback;
}

export type OtpRequestResult =
  | { ok: true; mobile: string; resendIn: number; devCode?: string }
  | { ok: false; message: string; retryAfter?: number };

export async function requestOtp(mobileInput: string): Promise<OtpRequestResult> {
  const mobile = normalizeMobile(String(mobileInput ?? ""));
  if (!mobile) return { ok: false, message: "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)." };

  const ip = await getClientIp();
  const perMobile = await rateLimit(`otp:m:${mobile}`, 1, OTP_TTL_SECONDS - 10);
  if (!perMobile.ok)
    return {
      ok: false,
      message: "کد قبلی هنوز معتبر است؛ کمی صبر کنید.",
      retryAfter: perMobile.retryAfter,
    };
  const hourly = await rateLimit(`otp:h:${mobile}`, 5, 3600);
  const perIp = await rateLimit(`otp:ip:${ip}`, 20, 3600);
  if (!hourly.ok || !perIp.ok)
    return {
      ok: false,
      message: "تعداد درخواست کد بیش از حد مجاز است؛ لطفاً یک ساعت دیگر تلاش کنید.",
    };

  const code = await createOtp(mobile, ip);
  const sms = await getSmsProvider();
  try {
    await sms.sendOtp(mobile, code);
  } catch (e) {
    console.error("[otp] send failed", e);
    return { ok: false, message: "ارسال پیامک با مشکل روبه‌رو شد؛ لطفاً دوباره تلاش کنید." };
  }
  // در محیط توسعه (بدون سرویس پیامک واقعی) کد برای تست نمایش داده می‌شود
  const devCode =
    sms.name === "console" && process.env.NODE_ENV !== "production" ? code : undefined;
  return { ok: true, mobile, resendIn: OTP_TTL_SECONDS, devCode };
}

const OTP_ERRORS: Record<string, string> = {
  invalid: "کد واردشده صحیح نیست.",
  expired: "کد منقضی شده است؛ کد جدید دریافت کنید.",
  too_many: "تعداد تلاش‌ها بیش از حد مجاز بود؛ کد جدید دریافت کنید.",
  blocked: "حساب کاربری شما مسدود شده است. با پشتیبانی تماس بگیرید.",
};

export async function verifyOtpAndSignIn(
  mobile: string,
  code: string,
  callbackUrl?: string,
): Promise<{ ok: false; message: string } | void> {
  try {
    await signIn("otp", {
      mobile,
      code: String(code).trim(),
      redirectTo: safeCallback(callbackUrl, "/dashboard"),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      const c = (e as AuthError & { code?: string }).code ?? "invalid";
      return { ok: false, message: OTP_ERRORS[c] ?? OTP_ERRORS.invalid! };
    }
    throw e; // ریدایرکت موفق Next به‌صورت exception پرتاب می‌شود
  }
}

export async function adminSignIn(
  identifier: string,
  password: string,
  callbackUrl?: string,
  totp?: string,
): Promise<{ ok: false; message: string; needTotp?: boolean } | void> {
  try {
    await signIn("admin", {
      identifier,
      password,
      totp: totp ?? "",
      redirectTo: safeCallback(callbackUrl, "/admin"),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      const c = (e as AuthError & { code?: string }).code;
      if (c === "totp_required") return { ok: false, needTotp: true, message: "کد ۶ رقمی برنامه‌ی Authenticator را وارد کنید." };
      if (c === "totp_invalid") return { ok: false, needTotp: true, message: "کد ورود دومرحله‌ای اشتباه یا منقضی است." };
      return {
        ok: false,
        message:
          c === "too_many"
            ? "تلاش‌های ناموفق زیاد بود؛ ۱۵ دقیقه دیگر تلاش کنید."
            : "نام کاربری یا رمز عبور اشتباه است.",
      };
    }
    throw e;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
