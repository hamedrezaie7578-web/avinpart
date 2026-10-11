import { notFound } from "next/navigation";
import { Copy, ExternalLink } from "lucide-react";
import { AdminPage, Card, LinkButton, Tabs } from "@/components/admin/ui";
import { ActionButton, ActionForm, Check, DeleteButton, Field, Select, TextArea } from "@/components/admin/form";
import { ThemeEditor } from "@/components/admin/theme-editor";
import { SectionBuilder, type BuilderSection } from "@/components/admin/section-builder";
import { ListSaveForm, MediaField, ScreenshotsEditor } from "@/components/admin/list-save";
import { ICONS } from "@/components/design-system/icon";
import { db } from "@/lib/db";
import { BRAND_THEME, themeSchema } from "@/lib/theme";
import { defaultSections } from "@/lib/landing-defaults";
import { formatNumber } from "@/lib/format";
import type { SectionType } from "@/lib/sections";
import { requireAdmin } from "@/server/admin/guard";
import {
  deleteProduct,
  duplicateProduct,
  saveProductFaqs,
  saveProductFeatures,
  saveProductGeneral,
  saveProductPricing,
  saveProductScreenshots,
  saveProductSeo,
  saveProductTestimonials,
  saveProductTheme,
  saveSections,
} from "@/server/actions/admin/products";

export const metadata = { title: "ویرایش محصول" };

const TABS = [
  { key: "general", label: "اطلاعات کلی" },
  { key: "theme", label: "پالت رنگ" },
  { key: "sections", label: "سکشن‌های لندینگ" },
  { key: "features", label: "امکانات" },
  { key: "gallery", label: "گالری" },
  { key: "faq", label: "FAQ" },
  { key: "testimonials", label: "نظرات" },
  { key: "pricing", label: "قیمت" },
  { key: "seo", label: "سئو" },
];

export default async function ProductEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin("products.write");
  const { id } = await params;
  const isNew = id === "new";
  const sp = await searchParams;
  const tab = !isNew && TABS.some((t) => t.key === sp.tab) ? sp.tab! : "general";
  const product = isNew
    ? null
    : await db.product.findUnique({
        where: { id },
        include: {
          logo: true,
          related: { select: { id: true } },
          sections: { orderBy: { sortOrder: "asc" } },
          features: { orderBy: { sortOrder: "asc" } },
          faqs: { orderBy: { sortOrder: "asc" } },
          testimonials: { orderBy: { sortOrder: "asc" } },
          screenshots: { orderBy: { sortOrder: "asc" }, include: { media: true } },
          planPrices: true,
        },
      });
  if (!isNew && !product) notFound();
  const ogImage = product?.ogImageId ? await db.media.findUnique({ where: { id: product.ogImageId }, select: { id: true, url: true } }) : null;
  const base = `/admin/products/${id}`;

  return (
    <AdminPage
      title={isNew ? "محصول جدید" : product!.name}
      description={product ? `${product.industryName} — /${product.slug}` : undefined}
      back={{ href: "/admin/products", label: "محصولات" }}
      actions={
        product && (
          <>
            <LinkButton href={`/${product.slug}`} variant="outline"><ExternalLink className="size-4" aria-hidden />مشاهده</LinkButton>
            <ActionButton action={duplicateProduct.bind(null, id)}><Copy className="size-4" aria-hidden />کپی</ActionButton>
            <DeleteButton action={deleteProduct.bind(null, id)} redirectTo="/admin/products" />
          </>
        )
      }
    >
      {!isNew && <Tabs base={base} tabs={TABS} active={tab} />}
      {tab === "general" && <General id={isNew ? null : id} product={product} />}
      {product && tab === "theme" && (
        <ThemeEditor initial={(themeSchema.safeParse(product.theme).data ?? BRAND_THEME)} action={saveProductTheme.bind(null, id)} name={product.name} />
      )}
      {product && tab === "sections" && (
        <SectionBuilder
          previewHref={`/${product.slug}`}
          action={saveSections.bind(null, { productId: id })}
          initial={
            product.sections.length
              ? product.sections.map((s) => ({ key: s.id, type: s.type as SectionType, enabled: s.enabled, data: (s.data ?? {}) as Record<string, unknown> }))
              : defaultSections(product).map((s): BuilderSection => ({ key: s.id, type: s.type, enabled: true, data: s.data as Record<string, unknown> }))
          }
        />
      )}
      {product && tab === "features" && (
        <Card title="امکانات کلیدی صنف" className="max-w-4xl">
          <ListSaveForm
            action={saveProductFeatures.bind(null, id)}
            initial={product.features.map((f) => ({ icon: f.icon, title: f.title, description: f.description, isKey: f.isKey }))}
            fields={[{ key: "icon", label: "آیکون", type: "icon" }, { key: "title", label: "عنوان" }, { key: "description", label: "توضیح", type: "textarea" }, { key: "isKey", label: "امکان کلیدی صنفی", type: "checkbox" }]}
            empty={{ icon: "Sparkles", title: "", description: "", isKey: true }}
            addLabel="افزودن امکان"
          />
        </Card>
      )}
      {product && tab === "gallery" && (
        <ScreenshotsEditor action={saveProductScreenshots.bind(null, id)} initial={product.screenshots.map((s) => ({ mediaId: s.mediaId, url: s.media.url, caption: s.caption ?? "", platform: s.platform ?? "" }))} />
      )}
      {product && tab === "faq" && (
        <Card title="سؤالات متداول این محصول" className="max-w-4xl">
          <ListSaveForm
            action={saveProductFaqs.bind(null, id)}
            initial={product.faqs.map((f) => ({ question: f.question, answer: f.answer }))}
            fields={[{ key: "question", label: "سؤال", width: "full" }, { key: "answer", label: "پاسخ", type: "textarea" }]}
            addLabel="افزودن سؤال"
          />
        </Card>
      )}
      {product && tab === "testimonials" && (
        <Card title="نظرات مشتریان" className="max-w-4xl">
          <p className="mb-4 text-sm text-muted-foreground">نظراتی که «نمونه» علامت خورده‌اند در سایت با برچسب «نظر نمونه» نمایش داده می‌شوند؛ پس از دریافت نظر واقعی، تیک را بردارید.</p>
          <ListSaveForm
            action={saveProductTestimonials.bind(null, id)}
            initial={product.testimonials.map((t) => ({ name: t.name, role: t.role, body: t.body, rating: t.rating, isSample: t.isSample, isPublished: t.isPublished }))}
            fields={[{ key: "name", label: "نام" }, { key: "role", label: "سمت و شهر" }, { key: "body", label: "متن نظر", type: "textarea" }, { key: "rating", label: "امتیاز (۱ تا ۵)", type: "number" }, { key: "isSample", label: "نمونه", type: "checkbox" }, { key: "isPublished", label: "منتشرشده", type: "checkbox" }]}
            empty={{ name: "", role: "", body: "", rating: 5, isSample: true, isPublished: true }}
            addLabel="افزودن نظر"
          />
        </Card>
      )}
      {product && tab === "pricing" && <Pricing id={id} prices={product.planPrices} />}
      {product && tab === "seo" && (
        <Card title="تنظیمات سئو" className="max-w-3xl">
          <ActionForm action={saveProductSeo.bind(null, id)}>
            <Field label="عنوان سئو (Title)" name="seoTitle" defaultValue={product.seoTitle ?? ""} maxLength={70} hint={`حداکثر ۷۰ کاراکتر. خالی = «نرم‌افزار حسابداری ${product.industryName} | ${product.name}»`} />
            <TextArea label="توضیحات متا" name="seoDescription" defaultValue={product.seoDescription ?? ""} maxLength={170} rows={3} hint="۱۲۰ تا ۱۶۰ کاراکتر توصیه می‌شود." />
            <Field label="کلمه‌ی کلیدی اصلی" name="focusKeyword" defaultValue={product.focusKeyword ?? ""} />
            <TextArea label="کلمات کلیدی مرتبط" name="keywords" defaultValue={product.keywords.join("، ")} rows={2} hint="با کاما جدا کنید." />
            <MediaField name="ogImageId" label="تصویر اشتراک‌گذاری (OG) — خالی = تولید خودکار" initial={ogImage} />
          </ActionForm>
        </Card>
      )}
    </AdminPage>
  );
}

async function General({ id, product }: { id: string | null; product: { slug: string; name: string; industryName: string; shortDesc: string; icon: string; categoryId: string | null; status: string; isFeatured: boolean; sortOrder: number; ratingValue: number | null; ratingCount: number | null; logo: { id: string; url: string } | null; related: { id: string }[] } | null }) {
  const [cats, others] = await Promise.all([
    db.industryCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({ where: id ? { id: { not: id } } : {}, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  const related = new Set(product?.related.map((r) => r.id));
  return (
    <Card className="max-w-4xl">
      <ActionForm action={saveProductGeneral.bind(null, id)} redirectTo={id ? undefined : "/admin/products/{id}?tab=theme"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نام محصول" name="name" required defaultValue={product?.name} placeholder="AvinGold" dir="ltr" />
          <Field label="نامک (آدرس صفحه)" name="slug" required defaultValue={product?.slug} placeholder="avingold" dir="ltr" pattern="[a-z0-9-]+" />
          <Field label="نام صنف" name="industryName" required defaultValue={product?.industryName} placeholder="طلا و جواهر فروشی" />
          <Select label="دسته" name="categoryId" defaultValue={product?.categoryId ?? ""} options={[{ value: "", label: "— بدون دسته —" }, ...cats.map((c) => ({ value: c.id, label: c.name }))]} />
          <TextArea label="توضیح کوتاه (کارت محصول و متا)" name="shortDesc" required defaultValue={product?.shortDesc} rows={3} className="sm:col-span-2" maxLength={300} />
          <Select label="آیکون" name="icon" defaultValue={product?.icon ?? "Package"} options={Object.keys(ICONS).map((k) => ({ value: k, label: k }))} dir="ltr" />
          <Select label="وضعیت" name="status" defaultValue={product?.status ?? "DRAFT"} options={[{ value: "DRAFT", label: "پیش‌نویس" }, { value: "PUBLISHED", label: "منتشرشده" }, { value: "ARCHIVED", label: "بایگانی" }]} />
          <Field label="ترتیب نمایش" name="sortOrder" type="number" defaultValue={product?.sortOrder ?? 0} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="امتیاز (۱-۵)" name="ratingValue" type="number" step="0.1" min="1" max="5" defaultValue={product?.ratingValue ?? ""} />
            <Field label="تعداد رأی" name="ratingCount" type="number" min="0" defaultValue={product?.ratingCount ?? ""} />
          </div>
          <MediaField name="logoId" label="لوگو (اختیاری)" initial={product?.logo ?? null} />
          <div className="flex items-end"><Check label="محصول ویژه (نمایش در صفحه‌ی اصلی)" name="isFeatured" defaultChecked={product?.isFeatured} /></div>
        </div>
        <fieldset className="rounded-xl border p-4">
          <legend className="px-2 text-sm font-bold">محصولات مرتبط</legend>
          <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4">
            {others.map((o) => <Check key={o.id} name="relatedIds" value={o.id} label={o.name} defaultChecked={related.has(o.id)} />)}
          </div>
        </fieldset>
      </ActionForm>
    </Card>
  );
}

async function Pricing({ id, prices }: { id: string; prices: Array<{ planId: string; price: number | null; compareAtPrice: number | null; isAvailable: boolean }> }) {
  const plans = await db.plan.findMany({ orderBy: { sortOrder: "asc" } });
  const map = new Map(prices.map((p) => [p.planId, p]));
  return (
    <Card title="قیمت اختصاصی پلن‌ها برای این محصول" className="max-w-4xl">
      <p className="mb-4 text-sm text-muted-foreground">خالی گذاشتن قیمت یعنی استفاده از قیمت سراسری پلن. تخفیف‌های زمان‌دار پلن روی قیمت نهایی اعمال می‌شوند.</p>
      <ActionForm action={saveProductPricing.bind(null, id)}>
        <div className="grid gap-4">
          {plans.map((pl) => {
            const pp = map.get(pl.id);
            return (
              <fieldset key={pl.id} className="grid items-end gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <legend className="px-2 text-sm font-bold">{pl.name} <span className="font-normal text-muted-foreground">— سراسری: {formatNumber(pl.price)} تومان</span></legend>
                <Field label="قیمت اختصاصی (تومان)" name={`price_${pl.id}`} inputMode="numeric" defaultValue={pp?.price ?? ""} placeholder={String(pl.price)} dir="ltr" />
                <Field label="قیمت خط‌خورده" name={`compare_${pl.id}`} inputMode="numeric" defaultValue={pp?.compareAtPrice ?? ""} dir="ltr" />
                <span />
                <Check label="قابل خرید" name={`available_${pl.id}`} defaultChecked={pp?.isAvailable ?? true} />
              </fieldset>
            );
          })}
        </div>
      </ActionForm>
    </Card>
  );
}
