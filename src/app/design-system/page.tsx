import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  ComparisonTable,
  CTASection,
  DeviceMockup,
  EmptyState,
  FAQ,
  FeatureGrid,
  PricingCard,
  PricingGrid,
  ProductCard,
  ProductThemeScope,
  Section,
  SectionHeader,
  StatCounter,
  TestimonialGrid,
  ThemeToggle,
} from "@/components/design-system";
import { getProductPricing, getPublishedProducts } from "@/server/queries/catalog";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Design System",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** پیش‌نمایش کامپوننت‌های Design System با تم هر محصول — فقط برای توسعه (noindex) */
export default async function DesignSystemPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  const { theme: slug } = await searchParams;
  const products = await getPublishedProducts();
  const current =
    products.find((p) => p.slug === slug) ?? products.find((p) => p.slug === "avinshop")!;
  const { plans, rows } = await getProductPricing(current.id);

  return (
    <ProductThemeScope theme={current.theme}>
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <strong>Design System — {current.name}</strong>
          <ThemeToggle />
        </div>
        <nav className="container-x flex gap-2 overflow-x-auto pb-3" aria-label="انتخاب تم">
          {products.map((p) => (
            <ProductThemeScope key={p.slug} theme={p.theme}>
              <Link
                href={`?theme=${p.slug}`}
                className="bg-brand text-brand-fg block rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap aria-[current=true]:ring-2 aria-[current=true]:ring-offset-2"
                aria-current={p.slug === current.slug}
              >
                {p.name}
              </Link>
            </ProductThemeScope>
          ))}
        </nav>
      </header>

      <section className="bg-brand-gradient text-brand-hero-fg relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="container-x relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
          <div>
            <Breadcrumb
              items={[{ name: "Design System", href: "/design-system" }]}
              className="mb-6 [&_*]:!text-current/80"
            />
            <p className="glass-on-dark mb-4 inline-block rounded-full px-4 py-1 text-sm">
              {current.industryName}
            </p>
            <h1 className="text-3xl leading-tight font-black md:text-5xl">
              {current.name}؛ تیتر نمونه‌ی هیرو
            </h1>
            <p className="mt-5 text-lg leading-8 opacity-90">{current.shortDesc}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="h-12 rounded-xl bg-white px-7 font-bold text-slate-900 hover:bg-white/90"
              >
                خرید
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="glass-on-dark h-12 rounded-xl px-7 font-bold text-current hover:bg-white/15 hover:text-current"
              >
                دموی رایگان
              </Button>
            </div>
            <p className="mt-6 text-sm opacity-80">امروز: {formatDate(new Date())}</p>
          </div>
          <DeviceMockup
            data={{
              appName: current.name,
              kpis: [
                { label: "فروش امروز", value: 48_750_000 },
                { label: "فاکتورها", value: 126 },
                { label: "سود ناخالص", value: 9_420_000 },
              ],
              rows: [
                { title: "فاکتور ۱۰۲۴", amount: 3_250_000 },
                { title: "فاکتور ۱۰۲۵", amount: 1_180_000 },
                { title: "فاکتور ۱۰۲۶", amount: 7_900_000 },
              ],
            }}
          />
        </div>
      </section>

      <Section>
        <SectionHeader
          eyebrow="امکانات"
          title="FeatureGrid"
          description="کارت‌های امکانات با آیکون و رنگ تم صنف."
        />
        <FeatureGrid
          items={[
            {
              icon: "Calculator",
              title: "محاسبه‌ی خودکار",
              description: "همه‌ی محاسبات بدون خطای انسانی و در لحظه انجام می‌شود.",
            },
            {
              icon: "Warehouse",
              title: "کنترل موجودی",
              description: "موجودی هر کالا در هر انبار، همیشه دقیق و قابل اعتماد.",
            },
            {
              icon: "Receipt",
              title: "سامانه‌ی مودیان",
              description: "ارسال مستقیم صورتحساب الکترونیکی به سازمان امور مالیاتی.",
            },
          ]}
        />
      </Section>

      <Section muted>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <StatCounter value={3200} suffix="+" label="کسب‌وکار فعال" />
          <StatCounter value={12} label="سال تجربه" />
          <StatCounter value={98} suffix="٪" label="رضایت مشتریان" />
          <StatCounter value={26} label="صنف تخصصی" />
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="قیمت‌ها" title="PricingCard + ComparisonTable" />
        <PricingGrid>
          {plans.map((p) => (
            <PricingCard
              key={p.id}
              name={p.name}
              tagline={p.tagline}
              price={p.resolved.price}
              compareAtPrice={p.resolved.compareAtPrice}
              discountLabel={p.resolved.discountLabel}
              features={p.highlights}
              platforms={p.platforms}
              isPopular={p.isPopular}
              priceNote={p.durationDays ? "شامل ۱ سال سرویس ابری" : "لایسنس دائمی"}
              ctaHref={`/checkout?product=${current.slug}&plan=${p.code}`}
            />
          ))}
        </PricingGrid>
        <div className="mt-12">
          <ComparisonTable
            plans={plans.map((p) => p.name)}
            rows={rows}
            highlightIndex={plans.findIndex((p) => p.isPopular)}
          />
        </div>
      </Section>

      <Section muted>
        <SectionHeader title="TestimonialGrid" />
        <TestimonialGrid
          items={[
            {
              name: "رضا محمدی",
              role: "مدیر فروشگاه — اصفهان",
              rating: 5,
              body: "متن نمونه‌ی نظر مشتری برای پیش‌نمایش کامپوننت.",
            },
            {
              name: "مریم احمدی",
              role: "حسابدار — شیراز",
              rating: 4,
              body: "متن نمونه‌ی نظر مشتری برای پیش‌نمایش کامپوننت.",
            },
            {
              name: "علی کریمی",
              role: "صاحب کسب‌وکار — تبریز",
              rating: 5,
              body: "متن نمونه‌ی نظر مشتری برای پیش‌نمایش کامپوننت.",
            },
          ]}
        />
      </Section>

      <Section>
        <SectionHeader title="FAQ" />
        <FAQ
          withSchema={false}
          items={[
            { question: "سؤال نمونه؟", answer: "پاسخ نمونه برای پیش‌نمایش آکاردئون." },
            { question: "سؤال دوم؟", answer: "پاسخ دوم." },
          ]}
        />
      </Section>

      <Section muted>
        <SectionHeader title="ProductCard" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </Section>

      <Section>
        <EmptyState
          title="هنوز سفارشی ثبت نکرده‌اید"
          description="پس از خرید، محصولات و کلیدهای لایسنس شما اینجا نمایش داده می‌شود."
          action={<Button>مشاهده‌ی محصولات</Button>}
        />
      </Section>

      <CTASection
        title="آماده‌اید حساب‌وکتاب کسب‌وکارتان را منظم کنید؟"
        description="دموی رایگان بگیرید."
        primary={{ label: "دریافت دمو", href: "#" }}
        secondary={{ label: "مشاوره", href: "#" }}
      />
    </ProductThemeScope>
  );
}
