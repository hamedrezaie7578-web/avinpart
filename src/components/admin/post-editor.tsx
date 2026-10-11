"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { seoAnalysis } from "@/lib/blog";
import { cn } from "@/lib/utils";
import { RichEditor } from "./rich-editor";
import { useMediaPicker } from "./media-picker";
import { MediaField } from "./list-save";

type Post = {
  title: string;
  slug: string;
  excerpt: string;
  html: string;
  status: string;
  publishAt: string;
  categoryId: string;
  tags: string;
  productIds: string[];
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  cover: { id: string; url: string } | null;
};

const input = "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

function Counter({ value, min, max }: { value: string; min: number; max: number }) {
  const n = value.length;
  return <span className={cn("text-xs", n >= min && n <= max ? "text-success" : "text-muted-foreground")}>{n.toLocaleString("fa-IR")} / {max.toLocaleString("fa-IR")}</span>;
}

/** ویرایشگر مقاله: متن غنی، تنظیمات انتشار، لینک به محصولات و تحلیل زنده‌ی سئو */
export function PostEditor({ id, initial, categories, products, action, canPublish }: { id: string | null; initial: Post; categories: Array<{ id: string; name: string }>; products: Array<{ id: string; name: string }>; action: (f: FormData) => Promise<{ ok: boolean; message?: string; data?: { id: string } }>; canPublish: boolean }) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [hasCover, setHasCover] = useState(!!initial.cover);
  const [pending, start] = useTransition();
  const { pick, dialog } = useMediaPicker();
  const set = <K extends keyof Post>(k: K, v: Post[K]) => setP((x) => ({ ...x, [k]: v }));
  const seo = useMemo(() => seoAnalysis({ ...p, hasCover }), [p, hasCover]);

  return (
    <form
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        start(async () => {
          const r = await action(f);
          if (!r.ok) return void toast.error(r.message ?? "خطا");
          toast.success(r.message ?? "ذخیره شد.");
          if (!id && r.data?.id) router.push(`/admin/blog/${r.data.id}`);
          else router.refresh();
        });
      }}
    >
      {dialog}
      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-5">
          <label htmlFor="p-title" className="mb-1.5 block text-sm font-medium">عنوان مقاله</label>
          <input id="p-title" name="title" required value={p.title} onChange={(e) => set("title", e.target.value)} className={cn(input, "h-12 text-lg font-bold")} />
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr]">
            <div>
              <label htmlFor="p-slug" className="mb-1.5 block text-sm font-medium">نامک</label>
              <input id="p-slug" name="slug" required dir="ltr" value={p.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} className={input} />
            </div>
            <div>
              <label htmlFor="p-excerpt" className="mb-1.5 flex items-center justify-between text-sm font-medium">خلاصه (نمایش در کارت و متا) <Counter value={p.excerpt} min={120} max={300} /></label>
              <input id="p-excerpt" name="excerpt" required value={p.excerpt} onChange={(e) => set("excerpt", e.target.value)} className={input} maxLength={400} />
            </div>
          </div>
        </div>
        <RichEditor name="html" initialHtml={initial.html} onChange={(h) => set("html", h)} onPickImage={pick} minHeight={600} />
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 font-bold">انتشار</h2>
          <div className="grid gap-3">
            <div>
              <label htmlFor="p-status" className="mb-1.5 block text-sm font-medium">وضعیت</label>
              <select id="p-status" name="status" value={p.status} onChange={(e) => set("status", e.target.value)} className={input}>
                <option value="DRAFT">پیش‌نویس</option>
                <option value="PUBLISHED" disabled={!canPublish && initial.status !== "PUBLISHED"}>منتشرشده / زمان‌بندی‌شده</option>
                <option value="ARCHIVED">بایگانی</option>
              </select>
            </div>
            <div>
              <label htmlFor="p-at" className="mb-1.5 block text-sm font-medium">زمان انتشار</label>
              <input id="p-at" type="datetime-local" name="publishAt" value={p.publishAt} onChange={(e) => set("publishAt", e.target.value)} className={input} dir="ltr" />
              <p className="mt-1 text-xs text-muted-foreground">زمان آینده = انتشار زمان‌بندی‌شده. خالی = همین حالا.</p>
            </div>
            <Button type="submit" disabled={pending} className="h-11 rounded-xl font-bold">
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              ذخیره
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">امتیاز سئو</h2>
            <span className={cn("rounded-full px-3 py-1 text-sm font-black", seo.score >= 80 ? "bg-success/15 text-success" : seo.score >= 50 ? "bg-warning/15 text-warning" : "bg-destructive/10 text-destructive")}>{seo.score.toLocaleString("fa-IR")}</span>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">{seo.words.toLocaleString("fa-IR")} کلمه · تکرار کلمه‌ی کلیدی: {seo.occurrences.toLocaleString("fa-IR")} ({(seo.density * 100).toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪)</p>
          <div className="grid gap-3">
            <div>
              <label htmlFor="p-kw" className="mb-1.5 block text-sm font-medium">کلمه‌ی کلیدی اصلی</label>
              <input id="p-kw" name="focusKeyword" value={p.focusKeyword} onChange={(e) => set("focusKeyword", e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="p-st" className="mb-1.5 flex items-center justify-between text-sm font-medium">عنوان سئو <Counter value={p.seoTitle || p.title} min={30} max={65} /></label>
              <input id="p-st" name="seoTitle" value={p.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder={p.title} className={input} />
            </div>
            <div>
              <label htmlFor="p-sd" className="mb-1.5 flex items-center justify-between text-sm font-medium">توضیحات متا <Counter value={p.seoDescription || p.excerpt} min={120} max={160} /></label>
              <textarea id="p-sd" name="seoDescription" rows={3} value={p.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} placeholder={p.excerpt} className={cn(input, "h-auto py-2 leading-7")} />
            </div>
            <div className="rounded-xl border p-3" aria-label="پیش‌نمایش در گوگل">
              <p className="truncate text-xs text-muted-foreground" dir="ltr">avinapps.ir › blog › {p.slug || "…"}</p>
              <p className="truncate text-base text-[#1a0dab] dark:text-[#8ab4f8]">{p.seoTitle || p.title || "عنوان مقاله"}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{p.seoDescription || p.excerpt}</p>
            </div>
            <ul className="space-y-1.5 text-xs">
              {seo.checks.map((c) => (
                <li key={c.label} className={cn("flex items-start gap-1.5", c.ok ? "text-success" : "text-muted-foreground")}>
                  {c.ok ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden /> : <Circle className="mt-0.5 size-3.5 shrink-0" aria-hidden />}
                  <span>{c.label}<span className="sr-only">{c.ok ? " — انجام شده" : " — انجام نشده"}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 font-bold">دسته‌بندی و برچسب</h2>
          <div className="grid gap-3">
            <select name="categoryId" aria-label="دسته" value={p.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={input}>
              <option value="">بدون دسته</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div>
              <label htmlFor="p-tags" className="mb-1.5 block text-sm font-medium">برچسب‌ها (با کاما)</label>
              <input id="p-tags" name="tags" value={p.tags} onChange={(e) => set("tags", e.target.value)} className={input} />
            </div>
            <MediaField name="coverId" label="تصویر شاخص" initial={initial.cover} onChange={(m) => setHasCover(!!m)} />
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-1 font-bold">محصولات مرتبط</h2>
          <p className="mb-3 text-xs text-muted-foreground">مقاله در لندینگ این محصولات نمایش داده می‌شود و در انتهای مقاله به آن‌ها لینک می‌شود.</p>
          <div className="grid max-h-60 grid-cols-2 gap-1.5 overflow-y-auto">
            {products.map((pr) => (
              <label key={pr.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="productIds" value={pr.id} checked={p.productIds.includes(pr.id)} onChange={(e) => set("productIds", e.target.checked ? [...p.productIds, pr.id] : p.productIds.filter((x) => x !== pr.id))} className="size-4" />
                {pr.name}
              </label>
            ))}
          </div>
        </div>
      </aside>
    </form>
  );
}
