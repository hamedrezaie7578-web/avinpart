"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/design-system/icon";
import { cn } from "@/lib/utils";
import type { NavCategory, NavLink } from "./types";

export function MobileNav({ links, categories }: { links: NavLink[]; categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="باز کردن منو">
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88vw] overflow-y-auto p-0 sm:max-w-sm">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-start">منوی سایت</SheetTitle>
        </SheetHeader>
        <nav aria-label="منوی موبایل" className="p-3">
          <p className="text-muted-foreground px-2 pt-2 pb-1 text-xs font-bold">
            محصولات بر اساس صنف
          </p>
          {categories.map((c) => (
            <div key={c.slug} className="border-b last:border-0">
              <button
                type="button"
                className="flex w-full items-center justify-between px-2 py-3 font-medium"
                aria-expanded={openCat === c.slug}
                onClick={() => setOpenCat(openCat === c.slug ? null : c.slug)}
              >
                {c.name}
                <ChevronDown
                  className={cn("size-4 transition", openCat === c.slug && "rotate-180")}
                  aria-hidden
                />
              </button>
              {openCat === c.slug && (
                <ul className="pb-2">
                  {c.products.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/${p.slug}`}
                        className="hover:bg-accent flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                      >
                        <Icon name={p.icon} className="text-primary size-4" />
                        <span className="font-bold">{p.name}</span>
                        <span className="text-muted-foreground truncate">— {p.industryName}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <ul className="mt-4 space-y-1 border-t pt-4">
            {links
              .filter((l) => l.href !== "/products")
              .map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="hover:bg-accent block rounded-lg px-2 py-2.5 font-medium"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
          </ul>
          <div className="mt-6 grid gap-2">
            <Button asChild className="h-11 rounded-xl font-bold">
              <Link href="/contact#demo">دریافت دموی رایگان</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl font-bold">
              <Link href="/login">ورود / ثبت‌نام</Link>
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
