"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { Icon } from "@/components/design-system/icon";
import { cn } from "@/lib/utils";
import type { NavCategory } from "./types";

/** مگامنوی محصولات: گروه‌بندی بر اساس صنف با آیکون و رنگ هر محصول */
export function MegaMenu({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) =>
      ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => {
        clearTimeout(closeTimer.current);
        setOpen(true);
      }}
      onMouseLeave={() => {
        closeTimer.current = setTimeout(() => setOpen(false), 150);
      }}
    >
      <button
        type="button"
        className={cn(
          "hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center gap-1 rounded-lg px-3 text-[0.95rem] font-medium transition",
          open && "bg-accent text-accent-foreground",
        )}
        aria-expanded={open}
        aria-controls="mega-menu"
        // کلیک موس (بعد از hover) منو را باز نگه می‌دارد؛ کیبورد (detail=0) و لمس آن را toggle می‌کنند
        onClick={(e) => (e.detail === 0 ? setOpen((o) => !o) : setOpen(true))}
      >
        محصولات
        <ChevronDown className={cn("size-4 transition", open && "rotate-180")} aria-hidden />
      </button>
      <div
        id="mega-menu"
        hidden={!open}
        className="bg-popover animate-in fade-in-0 slide-in-from-top-1 absolute inset-x-0 top-full z-50 border-b shadow-2xl shadow-black/5"
      >
        <div className="container-x grid gap-x-6 gap-y-6 py-7 md:grid-cols-3 lg:grid-cols-7">
          {categories.map((c) => (
            <div key={c.slug} className={cn(c.products.length > 6 && "lg:col-span-2")}>
              <p className="text-muted-foreground mb-3 text-xs font-bold tracking-wide">{c.name}</p>
              <ul
                className={cn(
                  "space-y-1",
                  c.products.length > 6 &&
                    "lg:grid lg:grid-cols-2 lg:space-y-0 lg:gap-x-4 lg:gap-y-1",
                )}
              >
                {c.products.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/${p.slug}`}
                      className="group hover:bg-accent flex items-center gap-2.5 rounded-lg p-1.5 transition"
                    >
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ background: p.color }}
                      >
                        <Icon name={p.icon} className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span
                          className="block text-sm font-bold"
                          dir="ltr"
                          style={{ textAlign: "right" }}
                        >
                          {p.name}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {p.industryName}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="bg-muted/40 border-t">
          <div className="container-x flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <span className="text-muted-foreground">
              صنف خود را پیدا نکردید؟ نرم‌افزار اختصاصی شما را می‌سازیم.
            </span>
            <div className="flex gap-4 font-bold">
              <Link
                href="/products"
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                همه‌ی محصولات <ArrowLeft className="size-4" aria-hidden />
              </Link>
              <Link
                href="/custom-software"
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                سفارش نرم‌افزار اختصاصی <ArrowLeft className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
