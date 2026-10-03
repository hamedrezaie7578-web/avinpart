import Link from "next/link";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/design-system/theme-toggle";
import { getPublishedProducts } from "@/server/queries/catalog";
import { getMenu } from "@/server/queries/settings";
import { Logo } from "./logo";
import { MegaMenu } from "./mega-menu";
import { MobileNav } from "./mobile-nav";
import type { NavCategory } from "./types";
import { themeSchema } from "@/lib/theme";

function themeColor(theme: unknown): string {
  const t = themeSchema.safeParse(theme);
  return t.success ? t.data.primary : "#4f46e5";
}

export async function Header() {
  const [products, menu] = await Promise.all([getPublishedProducts(), getMenu("header")]);
  const map = new Map<string, NavCategory>();
  for (const p of products) {
    const key = p.category?.slug ?? "other";
    if (!map.has(key)) map.set(key, { slug: key, name: p.category?.name ?? "سایر", products: [] });
    map
      .get(key)!
      .products.push({
        slug: p.slug,
        name: p.name,
        industryName: p.industryName,
        icon: p.icon,
        color: themeColor(p.theme),
      });
  }
  const categories = [...map.values()];
  const links = menu.map((m) => ({ label: m.label, href: m.href }));

  return (
    <header className="border-border/60 bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50 border-b backdrop-blur-lg">
      <a
        href="#main"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
      >
        رفتن به محتوای اصلی
      </a>
      <div className="relative">
        <div className="container-x flex h-16 items-center gap-4 md:h-[4.5rem]">
          <Logo />
          <nav aria-label="منوی اصلی" className="ms-6 hidden flex-1 items-center gap-1 lg:flex">
            {links.map((l) =>
              l.href === "/products" ? (
                <MegaMenu key={l.href} categories={categories} />
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  className="hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center rounded-lg px-3 text-[0.95rem] font-medium transition"
                >
                  {l.label}
                </Link>
              ),
            )}
          </nav>
          <div className="ms-auto flex items-center gap-1.5">
            <ThemeToggle />
            <Button
              asChild
              variant="ghost"
              className="hidden h-10 gap-1.5 rounded-lg sm:inline-flex"
            >
              <Link href="/login">
                <UserRound className="size-4" aria-hidden />
                ورود
              </Link>
            </Button>
            <Button
              asChild
              className="shadow-primary/20 hidden h-10 rounded-lg px-4 font-bold shadow-lg md:inline-flex"
            >
              <Link href="/contact?type=demo">دموی رایگان</Link>
            </Button>
            <MobileNav links={links} categories={categories} />
          </div>
        </div>
      </div>
    </header>
  );
}
