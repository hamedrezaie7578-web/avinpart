import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TableToolbar, type ToolbarFilter } from "./table-toolbar";

export type Column<T> = { key: string; header: string; cell: (row: T) => ReactNode; sortKey?: string; className?: string };

type SP = Record<string, string | string[] | undefined>;

function hrefWith(base: string, sp: SP, patch: Record<string, string | null>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") u.set(k, v);
  for (const [k, v] of Object.entries(patch)) if (v === null) u.delete(k); else u.set(k, v);
  const s = u.toString();
  return s ? `${base}?${s}` : base;
}

/**
 * جدول داده‌ی سمت سرور با جست‌وجو، فیلتر، مرتب‌سازی و صفحه‌بندی از طریق URL
 * (بدون state کلاینتی؛ قابل اشتراک‌گذاری و قابل بازگشت با دکمه‌ی Back).
 */
export function DataTable<T extends { id: string }>({
  basePath,
  searchParams,
  rows,
  total,
  page,
  pageSize,
  columns,
  rowHref,
  filters,
  searchPlaceholder,
  exportHref,
  empty = "موردی یافت نشد.",
}: {
  basePath: string;
  searchParams: SP;
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  columns: Column<T>[];
  rowHref?: (row: T) => string;
  filters?: ToolbarFilter[];
  searchPlaceholder?: string;
  exportHref?: string;
  empty?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : null;
  const dir = searchParams.dir === "asc" ? "asc" : "desc";

  return (
    <div className="rounded-2xl border bg-card">
      <TableToolbar filters={filters} searchPlaceholder={searchPlaceholder} exportHref={exportHref} total={total} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-y bg-muted/40 text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn("px-4 py-3 text-start font-medium whitespace-nowrap", c.className)}>
                  {c.sortKey ? (
                    <Link
                      href={hrefWith(basePath, searchParams, { sort: c.sortKey, dir: sort === c.sortKey && dir === "desc" ? "asc" : "desc", page: null })}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {c.header}
                      {sort === c.sortKey && (dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                    </Link>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length ? (
              rows.map((r) => (
                <tr key={r.id} className={cn(rowHref && "relative cursor-pointer hover:bg-muted/40")}>
                  {columns.map((c, i) => (
                    <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                      {i === 0 && rowHref ? (
                        <Link href={rowHref(r)} className="after:absolute after:inset-0">
                          {c.cell(r)}
                        </Link>
                      ) : (
                        c.cell(r)
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-10 text-center text-muted-foreground">{empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav aria-label="صفحه‌بندی" className="flex items-center justify-between gap-2 border-t px-4 py-3 text-sm">
          <span className="text-muted-foreground">صفحه‌ی {toFaDigits(page)} از {toFaDigits(pages)} · {formatNumber(total)} مورد</span>
          <div className="flex gap-1">
            <Link aria-disabled={page <= 1} href={hrefWith(basePath, searchParams, { page: String(page - 1) })} className={cn("rounded-lg border p-2", page <= 1 && "pointer-events-none opacity-40")} aria-label="صفحه‌ی قبل">
              <ChevronRight className="size-4" />
            </Link>
            <Link aria-disabled={page >= pages} href={hrefWith(basePath, searchParams, { page: String(page + 1) })} className={cn("rounded-lg border p-2", page >= pages && "pointer-events-none opacity-40")} aria-label="صفحه‌ی بعد">
              <ChevronLeft className="size-4" />
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
