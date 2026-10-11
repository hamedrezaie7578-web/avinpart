"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/blog";
import { cn } from "@/lib/utils";

/** فهرست مطالب با برجسته‌سازی بخش در حال مطالعه */
export function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const v = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (v) setActive(v.target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);
  return (
    <nav aria-label="فهرست مطالب">
      <ol className="space-y-1 text-sm">
        {items.map((i) => (
          <li key={i.id} className={i.level === 3 ? "ps-4" : ""}>
            <a href={`#${i.id}`} aria-current={active === i.id ? "location" : undefined} className={cn("block rounded-md border-s-2 px-3 py-1 leading-6 transition hover:text-primary", active === i.id ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground")}>
              {i.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
