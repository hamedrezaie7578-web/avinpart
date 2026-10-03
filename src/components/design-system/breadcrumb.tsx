import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { JsonLd } from "./json-ld";
import { absoluteUrl } from "@/lib/site";

export type Crumb = { name: string; href: string };

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  const all = [{ name: "خانه", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="مسیر صفحه" className={className}>
        <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.href} className="flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className="text-foreground font-medium">
                    {c.name}
                  </span>
                ) : (
                  <>
                    <Link href={c.href} className="hover:text-foreground hover:underline">
                      {c.name}
                    </Link>
                    <ChevronLeft className="size-3.5" aria-hidden />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: absoluteUrl(c.href),
          })),
        }}
      />
    </>
  );
}
