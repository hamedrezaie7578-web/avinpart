import Link from "next/link";
import { ArrowLeft, Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/design-system/breadcrumb";
import { DeviceMockup } from "@/components/design-system/device-mockup";
import { FAQ } from "@/components/design-system/faq";
import { FeatureGrid } from "@/components/design-system/feature-grid";
import { Icon } from "@/components/design-system/icon";
import { ProductCard } from "@/components/design-system/product-card";
import { Section, SectionHeader } from "@/components/design-system/section-header";
import { StatCounter } from "@/components/design-system/stat-counter";
import { TestimonialGrid } from "@/components/design-system/testimonial";
import { CtaWithForm } from "@/components/sections/cta-with-form";
import { PlatformsSection } from "@/components/sections/platforms";
import { PricingSection } from "@/components/sections/pricing-section";
import { DEFAULT_MODULES, type ParsedSection, type SectionData } from "@/lib/sections";
import { toFaDigits } from "@/lib/format";
import type { LandingProduct } from "@/server/queries/landing";
import type { SiteSettings } from "@/server/queries/settings";
import { Gallery } from "./gallery";

export type LandingContext = {
  product: LandingProduct;
  settings: SiteSettings;
  related: Array<{
    slug: string;
    name: string;
    industryName: string;
    shortDesc: string;
    icon: string;
    theme: unknown;
  }>;
  /** برای یکی‌درمیان کردن پس‌زمینه‌ی سکشن‌ها */
  muted: boolean;
};

function Hero({ data, ctx }: { data: SectionData<"HERO">; ctx: LandingContext }) {
  const { product } = ctx;
  const mockup = data.mockup ?? {
    kpis: [
      { label: "فروش امروز", value: 64_200_000 },
      { label: "فاکتورها", value: 148 },
      { label: "سود امروز", value: 12_850_000 },
    ],
    rows: [
      { title: "فاکتور ۲۳۰۱", amount: 4_350_000 },
      { title: "فاکتور ۲۳۰۲", amount: 1_920_000 },
      { title: "فاکتور ۲۳۰۳", amount: 8_400_000 },
    ],
  };
  return (
    <section className="bg-brand-gradient text-brand-hero-fg relative overflow-hidden">
      <div
        className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        aria-hidden
      />
      <div
        className="bg-brand-2/40 pointer-events-none absolute -end-24 -top-24 size-96 rounded-full blur-3xl"
        aria-hidden
      />
      <div className="container-x relative grid items-center gap-12 pt-8 pb-20 md:pt-10 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
        <div className="animate-fade-up">
          <Breadcrumb
            items={[
              { name: "محصولات", href: "/products" },
              { name: product.name, href: `/${product.slug}` },
            ]}
            className="mb-8 opacity-85 [&_a]:text-current [&_li]:text-current [&_ol]:text-current [&_span]:text-current"
          />
          <p className="glass-on-dark mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
            <Icon name={product.icon} className="size-4" />
            {data.eyebrow ?? `نرم‌افزار حسابداری ${product.industryName}`}
          </p>
          <h1 className="text-[2rem] leading-[1.35] font-black text-balance sm:text-5xl sm:leading-[1.3]">
            {data.title}
            {data.highlight && (
              <>
                {" "}
                <span className="decoration-brand-2 underline decoration-[0.18em] underline-offset-[0.3em] [text-decoration-skip-ink:none]">
                  {data.highlight}
                </span>
              </>
            )}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-9 opacity-90">{data.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="h-13 rounded-xl bg-white px-7 text-base font-bold text-slate-900 shadow-xl hover:bg-white/90"
            >
              <Link href={data.primaryCta?.href ?? "#pricing"}>
                {data.primaryCta?.label ?? `خرید ${product.name}`}
                <ArrowLeft className="size-5" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="glass-on-dark h-13 rounded-xl px-7 text-base font-bold text-current hover:bg-white/15 hover:text-current"
            >
              <Link href={data.secondaryCta?.href ?? "#demo"}>
                {data.secondaryCta?.label ?? "دریافت دموی رایگان"}
              </Link>
            </Button>
          </div>
          {data.bullets.length > 0 && (
            <ul className="mt-8 grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
              {data.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 opacity-95">
                  <Check className="size-4 shrink-0" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="animate-fade-up [animation-delay:150ms]">
          <DeviceMockup data={{ appName: product.name, ...mockup }} />
        </div>
      </div>
    </section>
  );
}

function PainPoints({ data, ctx }: { data: SectionData<"PAIN_POINTS">; ctx: LandingContext }) {
  return (
    <Section muted={ctx.muted} aria-labelledby="pain-title">
      <SectionHeader
        id="pain-title"
        eyebrow={data.eyebrow ?? "آشنا نیست؟"}
        title={data.title}
        description={data.description}
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((p) => (
          <li key={p.title} className="bg-card flex gap-4 rounded-2xl border p-6">
            <span className="bg-destructive/10 text-destructive flex size-11 shrink-0 items-center justify-center rounded-xl">
              <XIcon className="size-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-bold">{p.title}</h3>
              <p className="text-muted-foreground mt-1.5 leading-7">{p.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Features({ data, ctx }: { data: SectionData<"FEATURES">; ctx: LandingContext }) {
  const items = ctx.product.features.filter((f) => f.isKey);
  if (!items.length) return null;
  return (
    <Section muted={ctx.muted} id="features" aria-labelledby="features-title">
      <SectionHeader
        id="features-title"
        eyebrow={data.eyebrow ?? "راه‌حل"}
        title={data.title}
        description={data.description}
      />
      <FeatureGrid items={items} />
    </Section>
  );
}

function Modules({ data, ctx }: { data: SectionData<"MODULES">; ctx: LandingContext }) {
  const items = data.items?.length ? data.items : DEFAULT_MODULES;
  return (
    <Section muted={ctx.muted} aria-labelledby="modules-title">
      <SectionHeader
        id="modules-title"
        eyebrow={data.eyebrow ?? "ماژول‌ها"}
        title={data.title}
        description={data.description}
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((m) => (
          <li key={m.title} className="bg-card rounded-2xl border p-5">
            <div className="flex items-center gap-3">
              <span className="bg-brand-surface text-brand flex size-10 items-center justify-center rounded-lg">
                <Icon name={m.icon} className="size-5" />
              </span>
              <h3 className="font-bold">{m.title}</h3>
            </div>
            <p className="text-muted-foreground mt-3 text-sm leading-7">{m.description}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function GallerySection({ data, ctx }: { data: SectionData<"GALLERY">; ctx: LandingContext }) {
  const images = ctx.product.screenshots
    .filter((s) => s.media.width && s.media.height)
    .map((s) => ({
      url: s.media.url,
      alt: s.media.alt ?? `${ctx.product.name} — ${s.caption ?? "تصویر نرم‌افزار"}`,
      width: s.media.width!,
      height: s.media.height!,
      caption: s.caption,
    }));
  if (!images.length) return null;
  return (
    <Section muted={ctx.muted} aria-labelledby="gallery-title">
      <SectionHeader
        id="gallery-title"
        eyebrow="تصاویر نرم‌افزار"
        title={data.title}
        description={data.description}
      />
      <Gallery images={images} />
    </Section>
  );
}

function Stats({ data, ctx }: { data: SectionData<"STATS">; ctx: LandingContext }) {
  const s = ctx.settings.stats;
  const items = data.items?.length
    ? data.items
    : [
        { value: s.customers, suffix: "+", label: "کسب‌وکار فعال" },
        { value: s.years, label: "سال تجربه" },
        { value: s.satisfaction, suffix: "٪", label: "رضایت مشتریان" },
        { value: 24, suffix: "/۷", label: "پایش و پشتیبان‌گیری" },
      ];
  return (
    <Section muted={ctx.muted} aria-label={data.title ?? "آمار"}>
      {data.title && <SectionHeader title={data.title} />}
      <div className="bg-card grid grid-cols-2 gap-8 rounded-3xl border p-8 md:grid-cols-4">
        {items.map((i) => (
          <StatCounter key={i.label} value={i.value} suffix={i.suffix} label={i.label} />
        ))}
      </div>
    </Section>
  );
}

function Testimonials({ data, ctx }: { data: SectionData<"TESTIMONIALS">; ctx: LandingContext }) {
  if (!ctx.product.testimonials.length) return null;
  return (
    <Section muted={ctx.muted} aria-labelledby="t-title">
      <SectionHeader
        id="t-title"
        eyebrow="تجربه‌ی همکاران شما"
        title={data.title}
        description={data.description}
      />
      <TestimonialGrid items={ctx.product.testimonials} />
    </Section>
  );
}

function Video({ data, ctx }: { data: SectionData<"VIDEO">; ctx: LandingContext }) {
  return (
    <Section muted={ctx.muted} aria-labelledby="video-title">
      <SectionHeader
        id="video-title"
        eyebrow="ویدیوی معرفی"
        title={data.title}
        description={data.description}
      />
      <div className="mx-auto aspect-video max-w-4xl overflow-hidden rounded-3xl border bg-black shadow-2xl">
        <iframe
          src={data.embedUrl}
          title={data.title}
          loading="lazy"
          allowFullScreen
          className="size-full"
          allow="autoplay; fullscreen; picture-in-picture"
        />
      </div>
    </Section>
  );
}

function Faqs({ data, ctx }: { data: SectionData<"FAQ">; ctx: LandingContext }) {
  if (!ctx.product.faqs.length) return null;
  return (
    <Section muted={ctx.muted} id="faq" aria-labelledby="faq-title">
      <SectionHeader
        id="faq-title"
        eyebrow="سؤالات متداول"
        title={data.title}
        description={data.description}
      />
      <FAQ items={ctx.product.faqs} />
    </Section>
  );
}

function Related({ data, ctx }: { data: SectionData<"RELATED">; ctx: LandingContext }) {
  const { posts } = ctx.product;
  return (
    <Section muted={ctx.muted} aria-labelledby="related-title">
      <SectionHeader id="related-title" title={data.title} />
      {ctx.related.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ctx.related.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
      {posts.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-extrabold">مقالات مرتبط</h3>
          <ul className="grid gap-4 md:grid-cols-3">
            {posts.map((p) => (
              <li key={p.slug} className="bg-card rounded-2xl border p-5">
                <Link href={`/blog/${p.slug}`} className="hover:text-brand leading-7 font-bold">
                  {p.title}
                </Link>
                <p className="text-muted-foreground mt-2 line-clamp-2 text-sm leading-6">
                  {p.excerpt}
                </p>
                <p className="text-muted-foreground mt-3 text-xs">
                  {toFaDigits(p.readingMinutes)} دقیقه مطالعه
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}

function RichText({ data, ctx }: { data: SectionData<"RICH_TEXT">; ctx: LandingContext }) {
  return (
    <Section muted={ctx.muted}>
      <article className="prose-fa mx-auto max-w-3xl">
        {data.title && <h2>{data.title}</h2>}
        {/* محتوای HTML فقط توسط ادمین و از طریق ویرایشگر امن تولید می‌شود */}
        <div dangerouslySetInnerHTML={{ __html: data.html }} />
      </article>
    </Section>
  );
}

/** رندر یک سکشن بر اساس نوع آن */
export function LandingSectionView({
  section,
  ctx,
}: {
  section: ParsedSection;
  ctx: LandingContext;
}) {
  const { product } = ctx;
  switch (section.type) {
    case "HERO":
      return <Hero data={section.data} ctx={ctx} />;
    case "PAIN_POINTS":
      return <PainPoints data={section.data} ctx={ctx} />;
    case "FEATURES":
      return <Features data={section.data} ctx={ctx} />;
    case "MODULES":
      return <Modules data={section.data} ctx={ctx} />;
    case "PLATFORMS":
      return (
        <PlatformsSection
          title={section.data.title}
          description={section.data.description}
          muted={ctx.muted}
        />
      );
    case "GALLERY":
      return <GallerySection data={section.data} ctx={ctx} />;
    case "PRICING":
      return (
        <PricingSection
          productId={product.id}
          productSlug={product.slug}
          productName={product.name}
          eyebrow={section.data.eyebrow}
          title={section.data.title}
          description={section.data.description}
          muted={ctx.muted}
        />
      );
    case "STATS":
      return <Stats data={section.data} ctx={ctx} />;
    case "TESTIMONIALS":
      return <Testimonials data={section.data} ctx={ctx} />;
    case "VIDEO":
      return <Video data={section.data} ctx={ctx} />;
    case "FAQ":
      return <Faqs data={section.data} ctx={ctx} />;
    case "CTA":
      return (
        <CtaWithForm
          title={section.data.title}
          description={section.data.description}
          productSlug={product.slug}
          productName={product.name}
        />
      );
    case "RELATED":
      return <Related data={section.data} ctx={ctx} />;
    case "RICH_TEXT":
      return <RichText data={section.data} ctx={ctx} />;
  }
}

/** آیا سکشن با داده‌ی فعلی محتوایی برای نمایش دارد؟ (برای یکی‌درمیان کردن پس‌زمینه) */
export function sectionHasContent(section: ParsedSection, product: LandingProduct): boolean {
  switch (section.type) {
    case "FEATURES":
      return product.features.some((f) => f.isKey);
    case "GALLERY":
      return product.screenshots.length > 0;
    case "TESTIMONIALS":
      return product.testimonials.length > 0;
    case "FAQ":
      return product.faqs.length > 0;
    default:
      return true;
  }
}
