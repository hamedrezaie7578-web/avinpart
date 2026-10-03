"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** صفحه‌ی خطای ۵۰۰ داخل قالب سایت */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-x py-20 text-center md:py-28">
      <p className="text-brand-gradient text-8xl font-black" aria-hidden>
        ۵۰۰
      </p>
      <h1 className="mt-4 text-2xl font-extrabold md:text-3xl">مشکلی پیش آمد</h1>
      <p className="text-muted-foreground mx-auto mt-4 max-w-xl leading-8">
        متأسفیم؛ هنگام بارگذاری این صفحه خطایی رخ داد. تیم فنی ما مطلع شده است. لطفاً دوباره تلاش
        کنید یا چند دقیقه‌ی دیگر سر بزنید.
      </p>
      {error.digest && (
        <p className="text-muted-foreground mt-2 text-xs" dir="ltr">
          کد خطا: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset} className="h-12 rounded-xl px-6 font-bold">
          <RefreshCw className="size-4" aria-hidden />
          تلاش دوباره
        </Button>
        <Button asChild variant="outline" className="h-12 rounded-xl px-6 font-bold">
          <Link href="/">بازگشت به صفحه‌ی اصلی</Link>
        </Button>
      </div>
    </div>
  );
}
