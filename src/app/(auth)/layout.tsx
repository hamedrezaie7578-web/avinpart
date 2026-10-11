import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/design-system/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <main id="main" className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
        <p className="text-muted-foreground text-center text-xs">
          ورود به معنای پذیرش{" "}
          <Link href="/terms" className="underline">
            قوانین
          </Link>{" "}
          و{" "}
          <Link href="/privacy" className="underline">
            حریم خصوصی
          </Link>{" "}
          است.
        </p>
      </div>
      <aside
        className="bg-brand-gradient text-brand-hero-fg relative hidden overflow-hidden lg:flex lg:items-center lg:justify-center"
        aria-hidden
      >
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative max-w-md p-12">
          <p className="text-3xl leading-[1.6] font-black">
            کلید لایسنس‌ها، فاکتورها، دانلودها و پشتیبانی؛ همه در یک پنل.
          </p>
          <ul className="mt-8 space-y-3 opacity-90">
            <li>• مشاهده و مدیریت دستگاه‌های فعال</li>
            <li>• دانلود آخرین نسخه‌ی ویندوز و اندروید</li>
            <li>• ارتقای پلن با پرداخت مابه‌التفاوت</li>
            <li>• تیکت پشتیبانی و پیگیری سفارش اختصاصی</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
