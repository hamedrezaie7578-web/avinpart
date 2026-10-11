import "server-only";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

/**
 * پیکربندی سرویس‌های بیرونی: مقدار ذخیره‌شده در پنل (Setting؛ مقادیر محرمانه رمزنگاری‌شده با AES-GCM)
 * و در نبودِ آن، متغیر محیطی. کش ۳۰ ثانیه‌ای در حافظه تا هر درخواست به دیتابیس نرود.
 */
export const CONFIG_KEYS = {
  "payment.gateway": { env: "PAYMENT_GATEWAY", secret: false },
  "payment.zarinpal.merchant": { env: "ZARINPAL_MERCHANT_ID", secret: true },
  "payment.zarinpal.sandbox": { env: "ZARINPAL_SANDBOX", secret: false },
  "sms.provider": { env: "SMS_PROVIDER", secret: false },
  "sms.kavenegar.apiKey": { env: "KAVENEGAR_API_KEY", secret: true },
  "sms.kavenegar.sender": { env: "KAVENEGAR_SENDER", secret: false },
  "sms.kavenegar.otpTemplate": { env: "KAVENEGAR_OTP_TEMPLATE", secret: false },
  "sms.adminMobile": { env: "ADMIN_NOTIFY_MOBILE", secret: false },
} as const;
export type ConfigKey = keyof typeof CONFIG_KEYS;

let cache: { at: number; values: Map<string, string> } | null = null;

export function clearConfigCache() {
  cache = null;
}

async function load(): Promise<Map<string, string>> {
  if (cache && Date.now() - cache.at < 30_000) return cache.values;
  const values = new Map<string, string>();
  try {
    const rows = await db.setting.findMany({ where: { key: { in: Object.keys(CONFIG_KEYS) } } });
    for (const r of rows) {
      if (typeof r.value !== "string" || !r.value) continue;
      try {
        values.set(r.key, r.isSecret ? decrypt(r.value) : r.value);
      } catch (e) {
        console.error(`[config] رمزگشایی ${r.key} ناموفق بود`, e);
      }
    }
  } catch (e) {
    console.error("[config] خواندن تنظیمات ناموفق بود؛ از متغیرهای محیطی استفاده می‌شود", e);
  }
  cache = { at: Date.now(), values };
  return values;
}

export async function getConfig(key: ConfigKey): Promise<string | undefined> {
  const v = (await load()).get(key);
  return v || process.env[CONFIG_KEYS[key].env] || undefined;
}

/** آیا مقدار از پنل تنظیم شده یا از env می‌آید (برای نمایش در پنل، بدون افشای مقدار) */
export async function configSource(key: ConfigKey): Promise<"panel" | "env" | "none"> {
  if ((await load()).get(key)) return "panel";
  return process.env[CONFIG_KEYS[key].env] ? "env" : "none";
}
