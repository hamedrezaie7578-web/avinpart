"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type FinderItem = { key: string; category: string; search: string; card: ReactNode };

/** «صنف شما چیست؟» — جست‌وجو و فیلتر کارت‌های محصولات (کارت‌ها در سرور رندر شده‌اند) */
export function IndustryFinder({
  items,
  categories,
}: {
  items: FinderItem[];
  categories: Array<{ slug: string; name: string }>;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  // پشتیبانی از ?q= (SearchAction در اسکیمای WebSite) و ?category=
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const initialQ = sp.get("q");
    const initialCat = sp.get("category");
    if (initialQ) setQ(initialQ);
    if (initialCat && categories.some((c) => c.slug === initialCat)) setCat(initialCat);
  }, [categories]);
  const normalized = q.trim().replace(/ي/g, "ی").replace(/ك/g, "ک").toLowerCase();

  const visible = useMemo(
    () =>
      items.filter(
        (i) =>
          (cat === "all" || i.category === cat) && (!normalized || i.search.includes(normalized)),
      ),
    [items, cat, normalized],
  );

  return (
    <div>
      <div className="mx-auto mb-6 max-w-xl">
        <label htmlFor="industry-search" className="sr-only">
          جست‌وجوی صنف
        </label>
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2"
            aria-hidden
          />
          <input
            id="industry-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="مثلاً: طلا، داروخانه، رستوران، پوشاک…"
            className="bg-card focus:border-primary focus:ring-primary/15 h-14 w-full rounded-2xl border ps-12 pe-12 text-base shadow-sm transition outline-none focus:ring-4"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="text-muted-foreground hover:bg-muted absolute end-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5"
              aria-label="پاک کردن جست‌وجو"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
      <div
        className="mb-8 flex flex-wrap justify-center gap-2"
        role="group"
        aria-label="فیلتر دسته‌بندی صنف"
      >
        {[{ slug: "all", name: "همه‌ی صنف‌ها" }, ...categories].map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setCat(c.slug)}
            aria-pressed={cat === c.slug}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              cat === c.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card hover:border-primary/50",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">
        {visible.length} محصول یافت شد
      </p>
      {visible.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((i) => (
            <li key={i.key}>{i.card}</li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="font-bold">صنفی با این عنوان پیدا نشد.</p>
          <p className="text-muted-foreground mt-2">
            نگران نباشید؛
            <Link href="/avinshop" className="text-primary font-bold hover:underline">
              AvinShop
            </Link>{" "}
            برای همه‌ی فروشگاه‌ها مناسب است، یا{" "}
            <Link href="/custom-software" className="text-primary font-bold hover:underline">
              نرم‌افزار اختصاصی
            </Link>{" "}
            شما را می‌سازیم.
          </p>
        </div>
      )}
    </div>
  );
}
