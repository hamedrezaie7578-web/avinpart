"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronsRight, X } from "lucide-react";
import { Icon } from "@/components/design-system/icon";
import { LogoMark } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import type { AdminNavGroup } from "./nav-config";

/** سایدبار جمع‌شونده (وضعیت در localStorage) و کشویی در موبایل */
export function AdminSidebar({ groups, mobileOpen, onClose }: { groups: AdminNavGroup[]; mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("admin-sidebar") === "1");
    } catch {}
  }, []);
  useEffect(onClose, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("admin-sidebar", c ? "0" : "1");
      } catch {}
      return !c;
    });
  };

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex flex-col border-e bg-card transition-all duration-200 lg:sticky lg:top-0 lg:h-dvh",
          collapsed ? "lg:w-[72px]" : "lg:w-64",
          mobileOpen ? "w-72 translate-x-0" : "w-72 translate-x-full lg:translate-x-0 rtl:translate-x-full lg:rtl:translate-x-0",
        )}
        aria-label="منوی پنل مدیریت"
      >
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Link href="/admin" className="flex items-center gap-2 overflow-hidden">
            <LogoMark className="size-8 shrink-0" />
            {!collapsed && <span className="font-black whitespace-nowrap" dir="ltr">AvinApps <span className="text-xs font-medium text-muted-foreground">Admin</span></span>}
          </Link>
          <button type="button" onClick={onClose} className="ms-auto rounded-lg p-1.5 lg:hidden" aria-label="بستن منو"><X className="size-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {groups.map((g) => (
            <div key={g.title} className="mb-4">
              {!collapsed && <p className="mb-1 px-3 text-[0.7rem] font-bold tracking-wide text-muted-foreground">{g.title}</p>}
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const active = it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        title={collapsed ? it.label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                          collapsed && "lg:justify-center lg:px-0",
                          active ? "bg-primary font-bold text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <Icon name={it.icon} className="size-4.5 shrink-0" />
                        <span className={cn("truncate", collapsed && "lg:sr-only")}>{it.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <button type="button" onClick={toggle} className="hidden items-center justify-center gap-2 border-t p-3 text-sm text-muted-foreground hover:text-foreground lg:flex" aria-label={collapsed ? "باز کردن سایدبار" : "جمع کردن سایدبار"}>
          <ChevronsRight className={cn("size-4 transition", collapsed && "rotate-180")} aria-hidden />
          {!collapsed && "جمع کردن"}
        </button>
      </aside>
    </>
  );
}
