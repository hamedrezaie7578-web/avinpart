import "server-only";
import { db } from "@/lib/db";

/** لایه‌ی Adapter پیامک: با تغییر SMS_PROVIDER سرویس عوض می‌شود */
export interface SmsProvider {
  readonly name: string;
  /** ارسال کد تأیید با قالب (Verify Lookup) */
  sendOtp(mobile: string, code: string): Promise<void>;
  /** ارسال متن آزاد */
  send(mobile: string, message: string): Promise<void>;
}

class ConsoleProvider implements SmsProvider {
  readonly name = "console";
  async sendOtp(mobile: string, code: string) {
    console.info(`[sms:console] OTP ${mobile}: ${code}`);
  }
  async send(mobile: string, message: string) {
    console.info(`[sms:console] ${mobile}: ${message}`);
  }
}

class KavenegarProvider implements SmsProvider {
  readonly name = "kavenegar";
  constructor(
    private apiKey: string,
    private sender: string | undefined,
    private otpTemplate: string,
  ) {}

  private async call(method: string, params: Record<string, string>) {
    const url = `https://api.kavenegar.com/v1/${this.apiKey}/${method}.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json().catch(() => null)) as {
      return?: { status: number; message: string };
    } | null;
    if (!res.ok || json?.return?.status !== 200) {
      throw new Error(
        `Kavenegar ${method} failed: ${json?.return?.status} ${json?.return?.message ?? res.statusText}`,
      );
    }
  }

  sendOtp(mobile: string, code: string) {
    return this.call("verify/lookup", {
      receptor: mobile,
      token: code,
      template: this.otpTemplate,
    });
  }
  send(mobile: string, message: string) {
    return this.call("sms/send", {
      receptor: mobile,
      message,
      ...(this.sender ? { sender: this.sender } : {}),
    });
  }
}

let provider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (provider) return provider;
  const key = process.env.KAVENEGAR_API_KEY;
  provider =
    process.env.SMS_PROVIDER === "kavenegar" && key
      ? new KavenegarProvider(
          key,
          process.env.KAVENEGAR_SENDER || undefined,
          process.env.KAVENEGAR_OTP_TEMPLATE || "avinapps-otp",
        )
      : new ConsoleProvider();
  return provider;
}

/** جای‌گذاری متغیرهای {{name}} در قالب */
export function renderTemplate(body: string, vars: Record<string, string | number>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? ""));
}

/**
 * ارسال پیامک با قالب ذخیره‌شده در دیتابیس (NotificationTemplate).
 * خطای ارسال، عملیات اصلی (مثل ثبت سفارش) را متوقف نمی‌کند و فقط لاگ می‌شود.
 */
export async function sendTemplateSms(
  key: string,
  mobile: string,
  vars: Record<string, string | number>,
): Promise<boolean> {
  const sms = getSmsProvider();
  try {
    const tpl = await db.notificationTemplate.findUnique({ where: { key } });
    if (!tpl || !tpl.isActive || tpl.channel !== "sms") return false;
    await sms.send(mobile, renderTemplate(tpl.body, vars));
    await db.smsLog.create({ data: { mobile, template: key, status: "sent", provider: sms.name } });
    return true;
  } catch (e) {
    console.error(`[sms] ${key} → ${mobile} failed`, e);
    await db.smsLog
      .create({ data: { mobile, template: key, status: "failed", provider: sms.name } })
      .catch(() => {});
    return false;
  }
}
