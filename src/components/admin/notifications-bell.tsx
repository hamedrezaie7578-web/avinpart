"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatRelative, toFaDigits } from "@/lib/format";

type N = { id: string; title: string; href: string | null; createdAt: string; readAt: string | null };

/** اعلان‌های پنل با به‌روزرسانی دوره‌ای (هر ۳۰ ثانیه) */
export function NotificationsBell() {
  const [items, setItems] = useState<N[]>([]);
  const [unread, setUnread] = useState(0);

  const load = async () => {
    try {
      const r = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!r.ok) return;
      const j = (await r.json()) as { items: N[]; unread: number };
      setItems(j.items);
      setUnread(j.unread);
    } catch {}
  };
  useEffect(() => {
    void load();
    const t = setInterval(load, 30_000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <DropdownMenu
      onOpenChange={async (o) => {
        if (o && unread) {
          await fetch("/api/admin/notifications", { method: "POST" });
          setUnread(0);
        }
      }}
    >
      <DropdownMenuTrigger className="relative rounded-lg p-2 hover:bg-accent" aria-label={`اعلان‌ها${unread ? ` (${unread} جدید)` : ""}`}>
        <Bell className="size-5" />
        {unread > 0 && <span className="absolute -end-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[0.65rem] font-bold text-white">{toFaDigits(unread > 99 ? 99 : unread)}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <p className="border-b px-4 py-3 text-sm font-bold">اعلان‌ها</p>
        <ul className="max-h-96 overflow-y-auto">
          {items.length ? (
            items.map((n) => (
              <li key={n.id} className={n.readAt ? "" : "bg-accent/40"}>
                <Link href={n.href ?? "/admin"} className="block px-4 py-3 text-sm hover:bg-accent">
                  <span className="block">{n.title}</span>
                  <span className="text-xs text-muted-foreground">{formatRelative(n.createdAt)}</span>
                </Link>
              </li>
            ))
          ) : (
            <li className="p-6 text-center text-sm text-muted-foreground">اعلانی وجود ندارد.</li>
          )}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
