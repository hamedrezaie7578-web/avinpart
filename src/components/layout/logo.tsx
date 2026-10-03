import Link from "next/link";
import { cn } from "@/lib/utils";

/** لوگوی AvinApps (SVG برداری، بدون درخواست شبکه) */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <defs>
        <linearGradient id="avin-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#avin-g)" />
      <path
        d="M11 29 19.2 10.5h1.6L29 29h-4.1l-1.8-4.3h-6.3L15 29Zm7.2-7.6h3.6L20 16.8Z"
        fill="#fff"
      />
      <circle cx="30" cy="11" r="3" fill="#fbbf24" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5", className)}
      aria-label="AvinApps — صفحه‌ی اصلی"
    >
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-black tracking-tight" dir="ltr">
          Avin<span className="text-primary">Apps</span>
        </span>
        <span className="text-muted-foreground mt-1 text-[0.65rem] font-medium">
          نرم‌افزار حسابداری هر صنف
        </span>
      </span>
    </Link>
  );
}
