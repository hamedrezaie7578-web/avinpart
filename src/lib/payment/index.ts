import "server-only";
import { getConfig } from "@/lib/secrets";
import { randomUUID } from "node:crypto";

/**
 * لایه‌ی Adapter درگاه پرداخت. افزودن درگاه جدید (IDPay، پی‌پینگ …) فقط با پیاده‌سازی این interface.
 * مبالغ ورودی و خروجی این لایه به «ریال» است.
 */
export interface PaymentGateway {
  readonly name: string;
  request(input: {
    amountRial: number;
    description: string;
    callbackUrl: string;
    mobile?: string;
    orderId: string;
  }): Promise<
    { ok: true; authority: string; redirectUrl: string } | { ok: false; message: string }
  >;
  verify(input: {
    authority: string;
    amountRial: number;
  }): Promise<
    | { ok: true; refId: string; cardPan?: string; raw?: unknown }
    | { ok: false; message: string; raw?: unknown }
  >;
}

/** زرین‌پال — API نسخه‌ی ۴ */
class ZarinpalGateway implements PaymentGateway {
  readonly name = "zarinpal";
  private base: string;
  constructor(
    private merchantId: string,
    sandbox: boolean,
  ) {
    this.base = sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com";
  }

  private async post<T>(path: string, body: object): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    return (await res.json()) as T;
  }

  async request({
    amountRial,
    description,
    callbackUrl,
    mobile,
    orderId,
  }: Parameters<PaymentGateway["request"]>[0]) {
    type R = {
      data?: { code?: number; authority?: string };
      errors?: { message?: string } | unknown[];
    };
    try {
      const r = await this.post<R>("/pg/v4/payment/request.json", {
        merchant_id: this.merchantId,
        amount: amountRial,
        callback_url: callbackUrl,
        description,
        metadata: { mobile, order_id: orderId },
      });
      if (r.data?.code === 100 && r.data.authority) {
        return {
          ok: true as const,
          authority: r.data.authority,
          redirectUrl: `${this.base}/pg/StartPay/${r.data.authority}`,
        };
      }
      return { ok: false as const, message: "اتصال به درگاه زرین‌پال ناموفق بود." };
    } catch (e) {
      console.error("[zarinpal] request", e);
      return { ok: false as const, message: "درگاه پرداخت در دسترس نیست؛ لطفاً دوباره تلاش کنید." };
    }
  }

  async verify({ authority, amountRial }: { authority: string; amountRial: number }) {
    type R = { data?: { code?: number; ref_id?: number; card_pan?: string }; errors?: unknown };
    try {
      const r = await this.post<R>("/pg/v4/payment/verify.json", {
        merchant_id: this.merchantId,
        amount: amountRial,
        authority,
      });
      // 100 = تأیید موفق، 101 = قبلاً تأیید شده
      if (r.data && (r.data.code === 100 || r.data.code === 101) && r.data.ref_id) {
        return {
          ok: true as const,
          refId: String(r.data.ref_id),
          cardPan: r.data.card_pan,
          raw: r,
        };
      }
      return { ok: false as const, message: "پرداخت توسط بانک تأیید نشد.", raw: r };
    } catch (e) {
      console.error("[zarinpal] verify", e);
      return { ok: false as const, message: "خطا در تأیید پرداخت.", raw: String(e) };
    }
  }
}

/**
 * درگاه آزمایشی برای توسعه و تست؛ کاربر را به صفحه‌ی شبیه‌ساز پرداخت می‌برد.
 * در production فقط با ALLOW_MOCK_PAYMENT=true فعال می‌شود.
 */
class MockGateway implements PaymentGateway {
  readonly name = "mock";
  async request({ amountRial, callbackUrl }: Parameters<PaymentGateway["request"]>[0]) {
    const authority = `MOCK${randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()}`;
    const url = new URL("/payment/mock", callbackUrl);
    url.searchParams.set("authority", authority);
    url.searchParams.set("amount", String(amountRial));
    url.searchParams.set("callback", callbackUrl);
    return { ok: true as const, authority, redirectUrl: url.pathname + url.search };
  }
  async verify({ authority }: { authority: string }) {
    return authority.startsWith("MOCK")
      ? { ok: true as const, refId: String(Date.now()).slice(-9), cardPan: "6037-99**-****-1234" }
      : { ok: false as const, message: "شناسه‌ی پرداخت آزمایشی نامعتبر است." };
  }
}

export function isMockPaymentAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_PAYMENT === "true";
}

export async function getPaymentGateway(name?: string): Promise<PaymentGateway> {
  const gw = name || (await getConfig("payment.gateway")) || "mock";
  if (gw === "zarinpal") {
    const merchant = await getConfig("payment.zarinpal.merchant");
    if (!merchant) throw new Error("مرچنت‌کد زرین‌پال تنظیم نشده است");
    return new ZarinpalGateway(merchant, (await getConfig("payment.zarinpal.sandbox")) === "true");
  }
  if (gw === "mock" && isMockPaymentAllowed()) return new MockGateway();
  throw new Error(`درگاه پرداخت «${gw}» پیکربندی نشده است`);
}

/** تومان → ریال */
export const tomanToRial = (t: number) => t * 10;
