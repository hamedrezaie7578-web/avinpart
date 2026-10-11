import "server-only";

export type ListParams = { q: string; page: number; pageSize: number; sort: string | null; dir: "asc" | "desc"; f: Record<string, string> };

/** خواندن پارامترهای جست‌وجو، فیلتر، مرتب‌سازی و صفحه‌بندی جدول‌ها از URL */
export function parseList(sp: Record<string, string | string[] | undefined>, defaults: { pageSize?: number; sort?: string } = {}): ListParams {
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const f: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) if (k.startsWith("f_") && typeof v === "string" && v) f[k.slice(2)] = v;
  return {
    q: s("q").trim().slice(0, 100),
    page: Math.max(1, Number(s("page")) || 1),
    pageSize: Math.min(100, Number(s("size")) || defaults.pageSize || 20),
    sort: s("sort") || defaults.sort || null,
    dir: s("dir") === "asc" ? "asc" : "desc",
    f,
  };
}

export function paging(p: ListParams) {
  return { skip: (p.page - 1) * p.pageSize, take: p.pageSize };
}

/** ساخت orderBy امن فقط از کلیدهای مجاز */
export function orderBy<T extends string>(p: ListParams, allowed: readonly T[], fallback: T): Record<string, "asc" | "desc"> {
  const key = (allowed as readonly string[]).includes(p.sort ?? "") ? (p.sort as T) : fallback;
  return { [key]: p.dir };
}
