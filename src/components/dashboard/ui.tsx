import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("bg-card rounded-2xl border p-5 md:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-extrabold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const TONES = {
  green: "bg-success/10 text-success",
  red: "bg-destructive/10 text-destructive",
  amber: "bg-warning/10 text-warning",
  blue: "bg-primary/10 text-primary",
  gray: "bg-muted text-muted-foreground",
} as const;

export function StatusBadge({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export const LICENSE_STATUS = {
  ACTIVE: { label: "فعال", tone: "green" },
  SUSPENDED: { label: "معلق", tone: "amber" },
  REVOKED: { label: "باطل‌شده", tone: "red" },
  EXPIRED: { label: "منقضی", tone: "red" },
} as const;

export const ORDER_STATUS = {
  PENDING: { label: "در انتظار پرداخت", tone: "amber" },
  PAID: { label: "پرداخت‌شده", tone: "green" },
  FAILED: { label: "ناموفق", tone: "red" },
  CANCELED: { label: "لغوشده", tone: "gray" },
  REFUNDED: { label: "بازگشت وجه", tone: "gray" },
} as const;

export const TICKET_STATUS = {
  OPEN: { label: "در انتظار پاسخ", tone: "amber" },
  ANSWERED: { label: "پاسخ داده شد", tone: "green" },
  CUSTOMER_REPLY: { label: "پاسخ شما", tone: "blue" },
  CLOSED: { label: "بسته‌شده", tone: "gray" },
} as const;

export const CUSTOM_ORDER_STATUS = {
  NEW: { label: "ثبت‌شده", tone: "blue" },
  REVIEWING: { label: "در حال بررسی", tone: "amber" },
  QUOTE_SENT: { label: "پیش‌فاکتور ارسال شد", tone: "amber" },
  IN_DEVELOPMENT: { label: "در حال توسعه", tone: "blue" },
  DELIVERED: { label: "تحویل‌شده", tone: "green" },
  CANCELED: { label: "لغوشده", tone: "gray" },
} as const;

export const PLATFORM_LABEL = {
  WINDOWS: "ویندوز",
  ANDROID: "اندروید",
  WEB: "تحت وب",
  IOS: "iOS",
} as const;
