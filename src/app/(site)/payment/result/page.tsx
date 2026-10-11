import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { PayAgainButton } from "@/components/dashboard/pay-again-button";
import { db } from "@/lib/db";
import { formatNumber, toFaDigits } from "@/lib/format";

export const metadata: Metadata = { title: "نتیجه‌ی پرداخت", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  const session = await auth();
  if (!session?.user)
    redirect(`/login?callbackUrl=${encodeURIComponent(`/payment/result?order=${orderId ?? ""}`)}`);
  const order = orderId
    ? await db.order.findFirst({
        where: { id: orderId, userId: session.user.id },
        include: {
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
          items: { include: { license: true } },
        },
      })
    : null;
  if (!order) notFound();
  const paid = order.status === "PAID";
  const payment = order.payments[0];

  return (
    <div className="container-x flex justify-center py-16">
      <div className="bg-card w-full max-w-lg rounded-3xl border p-8 text-center shadow-xl">
        {paid ? (
          <CheckCircle2 className="text-success mx-auto size-16" aria-hidden />
        ) : (
          <XCircle className="text-destructive mx-auto size-16" aria-hidden />
        )}
        <h1 className="mt-4 text-2xl font-black">
          {paid ? "پرداخت با موفقیت انجام شد" : "پرداخت انجام نشد"}
        </h1>
        <p className="text-muted-foreground mt-3 leading-8">
          {paid
            ? order.kind === "PURCHASE"
              ? "کلید لایسنس شما صادر شد و در پنل کاربری در دسترس است. پیامک تأیید هم برایتان ارسال شد."
              : "پلن لایسنس شما به‌روزرسانی شد."
            : "مبلغی از حساب شما کسر نشده است؛ اگر کسر شده باشد، طی ۷۲ ساعت توسط بانک بازگردانده می‌شود. می‌توانید دوباره پرداخت کنید."}
        </p>
        <dl className="bg-muted/50 mt-6 space-y-2 rounded-2xl p-4 text-start text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">شماره‌ی سفارش</dt>
            <dd className="font-bold">{toFaDigits(order.number)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">مبلغ</dt>
            <dd className="font-bold">{formatNumber(order.total)} تومان</dd>
          </div>
          {paid && payment?.refId && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">کد پیگیری بانک</dt>
              <dd className="font-bold" dir="ltr">
                {payment.refId}
              </dd>
            </div>
          )}
        </dl>
        {paid && order.items.some((i) => i.license) && (
          <ul className="mt-4 space-y-2 text-start">
            {order.items
              .filter((i) => i.license)
              .map((i) => (
                <li key={i.id} className="rounded-xl border p-3 text-sm">
                  <p className="text-muted-foreground">{i.title}</p>
                  <p className="mt-1 font-mono font-bold tracking-wider" dir="ltr">
                    {i.license!.key}
                  </p>
                </li>
              ))}
          </ul>
        )}
        <div className="mt-8 flex flex-col gap-3">
          {paid ? (
            <Button asChild className="h-12 rounded-xl font-bold">
              <Link href="/dashboard/licenses">مشاهده‌ی لایسنس‌ها و دانلود</Link>
            </Button>
          ) : (
            <PayAgainButton orderId={order.id} />
          )}
          <Button asChild variant="outline" className="h-12 rounded-xl">
            <Link href={`/dashboard/invoices/${order.id}`}>مشاهده‌ی فاکتور</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
