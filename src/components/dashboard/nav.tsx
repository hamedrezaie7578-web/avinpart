"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Download,
  FileText,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "پیشخوان", Icon: LayoutDashboard },
  { href: "/dashboard/licenses", label: "لایسنس‌ها", Icon: KeyRound },
  { href: "/dashboard/downloads", label: "دانلودها", Icon: Download },
  { href: "/dashboard/invoices", label: "فاکتورها", Icon: FileText },
  { href: "/dashboard/tickets", label: "پشتیبانی", Icon: LifeBuoy },
  { href: "/dashboard/projects", label: "سفارش‌های اختصاصی", Icon: FolderKanban },
  { href: "/dashboard/profile", label: "پروفایل", Icon: UserRound },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="منوی پنل کاربری" className="flex gap-1 overflow-x-auto lg:flex-col">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-4.5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
