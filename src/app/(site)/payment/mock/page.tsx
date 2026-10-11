import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreditCard } from "lucide-react";
import { isMockPaymentAllowed } from "@/lib/payment";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "درگاه پرداخت آزمایشی", robots: { index: false } };
export const dynamic = "force-dynamic";

/** شبیه‌ساز درگاه برای محیط توسعه و تست */
export default async function MockPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ authority?: string; amount?: string; callback?: string }>;
}) {
  if (!isMockPaymentAllowed()) notFound();
  const { authority, amount, callback } = await searchParams;
  if (!authority || !callback) notFound();
  const cb = new URL(callback);
  const ok = new URL(cb.pathname + cb.search, "http://x");
  ok.searchParams.set("Authority", authority);
  ok.searchParams.set("Status", "OK");
  const nok = new URL(ok);
  nok.searchParams.set("Status", "NOK");
  return (
    <div className="container-x flex justify-center py-16">
      <div className="bg-card w-full max-w-md rounded-3xl border p-8 text-center shadow-xl">
        <CreditCard className="text-primary mx-auto size-12" aria-hidden />
        <h1 className="mt-4 text-2xl font-black">درگاه پرداخت آزمایشی</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          این صفحه فقط در محیط توسعه است و پول واقعی جابه‌جا نمی‌شود.
        </p>
        <p className="mt-6 text-3xl font-black">
          {formatNumber(Number(amount) || 0)} <span className="text-base font-medium">ریال</span>
        </p>
        <div className="mt-8 grid gap-3">
          <a
            href={ok.pathname + ok.search}
            className="bg-success rounded-xl px-4 py-3 font-bold text-white"
          >
            پرداخت موفق
          </a>
          <a href={nok.pathname + nok.search} className="rounded-xl border px-4 py-3 font-bold">
            انصراف / پرداخت ناموفق
          </a>
        </div>
      </div>
    </div>
  );
}
