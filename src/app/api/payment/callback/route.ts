import { SITE_URL } from "@/lib/site";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getPaymentGateway, tomanToRial } from "@/lib/payment";
import { failPayment, fulfillOrder } from "@/server/orders";

/** بازگشت از درگاه: تأیید پرداخت سمت سرور و تکمیل سفارش */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const authority = sp.get("Authority") ?? sp.get("authority");
  const status = sp.get("Status") ?? sp.get("status");
  const result = (orderId: string, extra = "") =>
    NextResponse.redirect(new URL(`/payment/result?order=${orderId}${extra}`, SITE_URL));

  if (!authority) return NextResponse.redirect(new URL("/dashboard/invoices", SITE_URL));
  const payment = await db.payment.findUnique({ where: { authority }, include: { order: true } });
  if (!payment) return NextResponse.redirect(new URL("/dashboard/invoices", SITE_URL));

  if (payment.status === "SUCCESS") return result(payment.orderId);
  if (status !== "OK") {
    await failPayment(payment.id, { status });
    return result(payment.orderId, "&failed=1");
  }

  const gateway = await getPaymentGateway(payment.gateway);
  const v = await gateway.verify({ authority, amountRial: tomanToRial(payment.amount) });
  if (!v.ok) {
    await failPayment(payment.id, v.raw);
    return result(payment.orderId, "&failed=1");
  }
  await fulfillOrder(payment.orderId, payment.id, {
    refId: v.refId,
    cardPan: v.cardPan,
    raw: v.raw,
  });
  return result(payment.orderId);
}
