/**
 * ابزارهای وبلاگ (بدون وابستگی سمت سرور؛ امتیاز سئو در ویرایشگر هم زنده محاسبه می‌شود)
 */

export function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(text: string): number {
  return text ? text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
}

/** زمان مطالعه با سرعت ~۲۰۰ کلمه در دقیقه برای متن فارسی */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

export function headingId(text: string, used: Set<string>): string {
  const base =
    stripTags(text)
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "section";
  let id = base;
  for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
  used.add(id);
  return id;
}

/** افزودن id به تیترهای h2/h3 (برای فهرست مطالب و لینک مستقیم) */
export function addHeadingIds(html: string): string {
  const used = new Set<string>();
  return html.replace(/<(h[23])>([\s\S]*?)<\/\1>/g, (_, tag: string, inner: string) => `<${tag} id="${headingId(inner, used)}">${inner}</${tag}>`);
}

export type TocItem = { id: string; text: string; level: 2 | 3 };

export function extractToc(html: string): TocItem[] {
  return [...html.matchAll(/<(h[23]) id="([^"]+)">([\s\S]*?)<\/\1>/g)].map((m) => ({ id: m[2]!, text: stripTags(m[3]!), level: m[1] === "h2" ? 2 : 3 }));
}

export type SeoCheck = { label: string; ok: boolean; weight: number };

/** امتیاز سئوی مقاله (۰ تا ۱۰۰) با چک‌لیست قابل نمایش، شبیه Yoast/RankMath */
export function seoAnalysis(p: { title: string; seoTitle?: string | null; seoDescription?: string | null; focusKeyword?: string | null; slug: string; excerpt: string; html: string; hasCover: boolean }) {
  const text = stripTags(p.html);
  const words = countWords(text);
  const kw = (p.focusKeyword ?? "").trim();
  const title = (p.seoTitle || p.title).trim();
  const desc = (p.seoDescription || p.excerpt).trim();
  const occurrences = kw ? text.split(kw).length - 1 : 0;
  const density = words ? (occurrences * countWords(kw)) / words : 0;
  const firstPara = stripTags((p.html.match(/<p>[\s\S]*?<\/p>/) ?? [""])[0]);
  const h2 = [...p.html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => stripTags(m[1]!));
  const links = [...p.html.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]!);
  const internal = links.filter((l) => l.startsWith("/") || l.includes("avinapps.ir")).length;
  const imgs = [...p.html.matchAll(/<img [^>]*>/g)].map((m) => m[0]);
  const checks: SeoCheck[] = [
    { label: "کلمه‌ی کلیدی اصلی تعیین شده", ok: !!kw, weight: 10 },
    { label: "کلمه‌ی کلیدی در عنوان", ok: !!kw && title.includes(kw), weight: 12 },
    { label: "طول عنوان سئو بین ۳۰ تا ۶۵ کاراکتر", ok: title.length >= 30 && title.length <= 65, weight: 8 },
    { label: "توضیحات متا بین ۱۲۰ تا ۱۶۰ کاراکتر", ok: desc.length >= 120 && desc.length <= 160, weight: 8 },
    { label: "کلمه‌ی کلیدی در توضیحات متا", ok: !!kw && desc.includes(kw), weight: 8 },
    { label: "کلمه‌ی کلیدی در پاراگراف اول", ok: !!kw && firstPara.includes(kw), weight: 8 },
    { label: "کلمه‌ی کلیدی در حداقل یک تیتر h2", ok: !!kw && h2.some((h) => h.includes(kw)), weight: 8 },
    { label: "تراکم کلمه‌ی کلیدی بین ۰٫۵ تا ۲٫۵ درصد", ok: density >= 0.005 && density <= 0.025, weight: 8 },
    { label: "حداقل ۱۵۰۰ کلمه محتوا", ok: words >= 1500, weight: 10 },
    { label: "حداقل ۳ تیتر h2", ok: h2.length >= 3, weight: 6 },
    { label: "حداقل ۲ لینک داخلی", ok: internal >= 2, weight: 6 },
    { label: "تصویر شاخص انتخاب شده", ok: p.hasCover, weight: 4 },
    { label: "همه‌ی تصاویر متن جایگزین (alt) دارند", ok: imgs.every((i) => /alt="[^"]+"/.test(i)), weight: 2 },
    { label: "نامک (slug) کوتاه‌تر از ۶۰ کاراکتر", ok: p.slug.length > 0 && p.slug.length <= 60, weight: 2 },
  ];
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const score = Math.round((checks.filter((c) => c.ok).reduce((s, c) => s + c.weight, 0) / total) * 100);
  return { score, checks, words, density, occurrences };
}
