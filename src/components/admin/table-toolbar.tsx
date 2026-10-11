"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FileSpreadsheet, Search } from "lucide-react";
import { formatNumber } from "@/lib/format";

export type ToolbarFilter = { key: string; label: string; options: Array<{ value: string; label: string }> };

export function TableToolbar({ filters = [], searchPlaceholder = "جست‌وجو…", exportHref, total }: { filters?: ToolbarFilter[]; searchPlaceholder?: string; exportHref?: string; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const push = (patch: Record<string, string | null>) => {
    const u = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) if (v) u.set(k, v); else u.delete(k);
    u.delete("page");
    router.replace(`${pathname}?${u.toString()}`);
  };

  useEffect(() => {
    if ((sp.get("q") ?? "") === q) return;
    const t = setTimeout(() => push({ q: q || null }), 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-wrap items-center gap-2 p-3">
      <label className="relative min-w-56 flex-1">
        <span className="sr-only">جست‌وجو</span>
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} className="h-10 w-full rounded-xl border bg-background ps-9 pe-3 text-sm outline-none focus:border-primary" />
      </label>
      {filters.map((f) => (
        <label key={f.key} className="text-sm">
          <span className="sr-only">{f.label}</span>
          <select value={sp.get(`f_${f.key}`) ?? ""} onChange={(e) => push({ [`f_${f.key}`]: e.target.value || null })} className="h-10 rounded-xl border bg-background px-3">
            <option value="">{f.label}: همه</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      ))}
      <span className="text-xs text-muted-foreground">{formatNumber(total)} مورد</span>
      {exportHref && (
        <a href={`${exportHref}${exportHref.includes("?") ? "&" : "?"}${sp.toString()}`} className="inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium hover:bg-accent">
          <FileSpreadsheet className="size-4 text-success" aria-hidden />
          خروجی Excel
        </a>
      )}
    </div>
  );
}
