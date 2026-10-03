import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Code2, Headphones, Rocket, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/design-system/section-header";
import { ProductCard } from "@/components/design-system/product-card";
import { FeatureGrid } from "@/components/design-system/feature-grid";
import { DeviceMockup } from "@/components/design-system/device-mockup";
import { StatCounter } from "@/components/design-system/stat-counter";
import { TestimonialGrid } from "@/components/design-system/testimonial";
import { FAQ } from "@/components/design-system/faq";
import { JsonLd } from "@/components/design-system/json-ld";
import { IndustryFinder } from "@/components/sections/industry-finder";
import { PlatformsSection } from "@/components/sections/platforms";
import { PricingSection } from "@/components/sections/pricing-section";
import { CtaWithForm } from "@/components/sections/cta-with-form";
import { getPublishedProducts } from "@/server/queries/catalog";
import { getHomeData } from "@/server/queries/landing";
import { getSettings } from "@/server/queries/settings";
import { formatDate, toFaDigits } from "@/lib/format";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "نرم افزار حسابداری فروشگاهی تخصصی هر صنف | AvinApps" },
  description:
    "AvinApps؛ نرم‌افزار حسابداری تخصصی برای ۲۶ صنف از طلافروشی و داروخانه تا سوپرمارکت و رستوران. نسخه‌ی ویندوز، اندروید و تحت وب، اتصال به سامانه‌ی مودیان و دموی رایگان.",
  alternates: { canonical: "/" },
};

const BENEFITS = [
  {
    icon: "Sparkles",
    title: "تخصصی برای صنف شما",
    description:
      "نه یک نرم‌افزار عمومی با اسم‌های عوض‌شده؛ اجرت طلا، تاریخ انقضای دارو، سایز و رنگ پوشاک و فرمول پخت رستوران از روز اول داخلش هست.",
  },
  {
    icon: "FileText",
    title: "آماده‌ی سامانه‌ی مودیان",
    description:
      "صورتحساب الکترونیکی مستقیم از داخل نرم‌افزار به سازمان امور مالیاتی ارسال می‌شود؛ بدون ورود دوباره‌ی اطلاعات و بدون جریمه.",
  },
  {
    icon: "RefreshCw",
    title: "همگام بین همه‌ی دستگاه‌ها",
    description:
      "فاکتوری که پشت صندوق صادر می‌شود، همان لحظه روی گوشی مدیر و پنل حسابدار دیده می‌شود؛ حتی بین چند شعبه.",
  },
  {
    icon: "TrendingUp",
    title: "سود واقعی را ببینید",
    description:
      "گزارش سود هر کالا، هر روز و هر فروشنده؛ بفهمید کدام کالا پول می‌سازد و کدام فقط جای قفسه را گرفته.",
  },
  {
    icon: "ShieldCheck",
    title: "امن و همیشه پشتیبان‌گیری‌شده",
    description:
      "سطح دسترسی جداگانه برای هر کاربر، ثبت تاریخچه‌ی تغییرات و پشتیبان‌گیری خودکار؛ اطلاعات شما هیچ‌وقت از دست نمی‌رود.",
  },
  {
    icon: "Headphones",
    title: "پشتیبانی که جواب می‌دهد",
    description:
      "نصب، انتقال اطلاعات از نرم‌افزار قبلی و آموزش رایگان؛ و تیم پشتیبانی واقعی که تلفن را برمی‌دارد.",
  },
];

export default async function HomePage() {
  const [products, { testimonials, faqs, posts }, settings] = await Promise.all([
    getPublishedProducts(),
    getHomeData(),
    getSettings(),
  ]);
  const categories = [
    ...new Map(
      products.filter((p) => p.category).map((p) => [p.category!.slug, p.category!]),
    ).values(),
  ];

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="bg-brand-gradient text-brand-hero-fg relative overflow-hidden">
        <div
          className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -end-32 -top-32 size-[28rem] rounded-full bg-fuchsia-400/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -start-20 bottom-0 size-80 rounded-full bg-sky-400/25 blur-3xl"
          aria-hidden
        />
        <div className="container-x relative grid items-center gap-14 pt-14 pb-24 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:pb-28">
          <div className="animate-fade-up">
            <p className="glass-on-dark mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
              <BadgeCheck className="size-4 text-amber-300" aria-hidden />
              متصل به سامانه‌ی مودیان مالیاتی
            </p>
            <h1 className="text-[2rem] leading-[1.35] font-black text-balance sm:text-5xl sm:leading-[1.3]">
              حسابداری کسب‌وکارتان را به نرم‌افزاری بسپارید که{" "}
              <span className="text-amber-300">زبان صنف شما</span> را می‌فهمد
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-9 opacity-90">
              {toFaDigits(settings.stats.industries)} نرم‌افزار تخصصی Avin برای طلافروشی، داروخانه،
              سوپرمارکت، رستوران و ده‌ها صنف دیگر؛ روی ویندوز، اندروید و وب، با فروش سریع، انبار
              دقیق و گزارش سود لحظه‌ای.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="h-13 rounded-xl bg-white px-7 text-base font-bold text-slate-900 shadow-xl hover:bg-white/90"
              >
                <Link href="#industries">
                  نرم‌افزار صنف من را نشان بده
                  <ArrowLeft className="size-5" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="glass-on-dark h-13 rounded-xl px-7 text-base font-bold text-current hover:bg-white/15 hover:text-current"
              >
                <Link href="#demo">دموی رایگان</Link>
              </Button>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm opacity-90">
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-4" aria-hidden />
                پشتیبان‌گیری خودکار
              </li>
              <li className="flex items-center gap-2">
                <Headphones className="size-4" aria-hidden />
                نصب و آموزش رایگان
              </li>
              <li className="flex items-center gap-2">
                <Rocket className="size-4" aria-hidden />
                راه‌اندازی در یک روز
              </li>
            </ul>
          </div>
          <div className="animate-fade-up [animation-delay:150ms]">
            <DeviceMockup
              data={{
                appName: "AvinShop",
                kpis: [
                  { label: "فروش امروز", value: 86_400_000 },
                  { label: "فاکتورها", value: 214 },
                  { label: "سود امروز", value: 17_350_000 },
                ],
                rows: [
                  { title: "فاکتور ۴۸۲۱ — نقدی", amount: 2_450_000 },
                  { title: "فاکتور ۴۸۲۲ — کارت", amount: 870_000 },
                  { title: "فاکتور ۴۸۲۳ — چک", amount: 12_600_000 },
                ],
              }}
            />
          </div>
        </div>
      </section>

      {/* ───────── آمار ───────── */}
      <section aria-label="آمار آوین اپس" className="relative z-10 -mt-12">
        <div className="container-x">
          <div className="glass grid grid-cols-2 gap-6 rounded-3xl p-6 shadow-xl md:grid-cols-4 md:p-8">
            <StatCounter value={settings.stats.customers} suffix="+" label="کسب‌وکار فعال" />
            <StatCounter value={settings.stats.industries} label="صنف تخصصی" />
            <StatCounter value={settings.stats.years} label="سال تجربه" />
            <StatCounter value={settings.stats.satisfaction} suffix="٪" label="رضایت مشتریان" />
          </div>
        </div>
      </section>

      {/* ───────── صنف شما چیست؟ ───────── */}
      <Section id="industries" aria-labelledby="industries-title">
        <SectionHeader
          id="industries-title"
          eyebrow={`${toFaDigits(products.length)} نرم‌افزار تخصصی`}
          title="صنف شما چیست؟"
          description="هر کسب‌وکار حساب‌وکتاب خودش را دارد. صنف‌تان را پیدا کنید و ببینید نرم‌افزار Avin دقیقاً چه دردسرهایی را از روز شما حذف می‌کند."
        />
        <IndustryFinder
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          items={products.map((p) => ({
            key: p.slug,
            category: p.category?.slug ?? "",
            search: `${p.name} ${p.industryName} ${p.shortDesc}`.toLowerCase(),
            card: <ProductCard product={p} />,
          }))}
        />
      </Section>

      {/* ───────── چرا AvinApps ───────── */}
      <Section muted aria-labelledby="why-title">
        <SectionHeader
          id="why-title"
          eyebrow="چرا AvinApps؟"
          title="کمتر وقت پای حساب‌وکتاب بگذارید، بیشتر برای رشد کسب‌وکار"
          description="صاحبان کسب‌وکار نرم‌افزار حسابداری نمی‌خواهند؛ آرامش می‌خواهند. اینکه بدانند موجودی درست است، چک‌ها سر وقت وصول می‌شود و سود واقعی چقدر است."
        />
        <FeatureGrid items={BENEFITS} />
      </Section>

      <PlatformsSection />

      <PricingSection muted withComparison={false} />

      {/* ───────── نرم‌افزار اختصاصی ───────── */}
      <Section aria-labelledby="custom-title">
        <div className="bg-card grid items-center gap-10 overflow-hidden rounded-3xl border p-6 md:p-12 lg:grid-cols-2">
          <div>
            <p className="bg-accent text-accent-foreground mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold">
              <Code2 className="size-4" aria-hidden />
              طراحی اختصاصی
            </p>
            <h2 id="custom-title" className="text-2xl leading-tight font-extrabold md:text-4xl">
              فرایند کسب‌وکار شما خاص است؟ نرم‌افزارش را از صفر برایتان می‌سازیم
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-8">
              ERP و CRM سفارشی، اپلیکیشن اندروید، وب‌اپلیکیشن و اتصال به سیستم‌های فعلی‌تان؛ از
              نیازسنجی تا تحویل و پشتیبانی، با کدنویسی اختصاصی و مالکیت کامل.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-xl px-6 font-bold">
                <Link href="/custom-software">ثبت سفارش نرم‌افزار اختصاصی</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl px-6 font-bold"
              >
                <Link href="/website-design">طراحی سایت اختصاصی</Link>
              </Button>
            </div>
          </div>
          <ol className="border-primary/30 relative space-y-5 border-s-2 border-dashed ps-6">
            {[
              ["نیازسنجی رایگان", "جلسه با کارشناس و مستندسازی دقیق فرایندها"],
              ["طراحی و پیش‌فاکتور", "نمونه‌ی اولیه‌ی رابط کاربری و زمان‌بندی شفاف"],
              ["توسعه‌ی مرحله‌ای", "تحویل نسخه‌های میانی و دریافت بازخورد شما"],
              ["تست، تحویل و پشتیبانی", "آموزش کاربران، استقرار و پشتیبانی بلندمدت"],
            ].map(([t, d], i) => (
              <li key={t} className="relative">
                <span className="bg-primary text-primary-foreground absolute -start-[2.15rem] flex size-8 items-center justify-center rounded-full text-sm font-bold">
                  {toFaDigits(i + 1)}
                </span>
                <p className="font-bold">{t}</p>
                <p className="text-muted-foreground text-sm">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {testimonials.length > 0 && (
        <Section muted aria-labelledby="testimonials-title">
          <SectionHeader
            id="testimonials-title"
            eyebrow="تجربه‌ی مشتریان"
            title="از زبان کسانی که هر روز با Avin کار می‌کنند"
          />
          <TestimonialGrid items={testimonials} />
        </Section>
      )}

      {posts.length > 0 && (
        <Section aria-labelledby="posts-title">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <SectionHeader
              id="posts-title"
              align="start"
              eyebrow="وبلاگ"
              title="راهنماهای کاربردی برای مدیریت کسب‌وکار"
              className="mb-0 md:mb-0"
            />
            <Link
              href="/blog"
              className="text-primary inline-flex items-center gap-1 font-bold hover:underline"
            >
              همه‌ی مقالات <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((p) => (
              <article key={p.slug} className="bg-card flex flex-col rounded-2xl border p-6">
                {p.category && <p className="text-primary text-sm font-bold">{p.category.name}</p>}
                <h3 className="mt-2 text-lg leading-8 font-bold">
                  <Link href={`/blog/${p.slug}`} className="hover:text-primary">
                    {p.title}
                  </Link>
                </h3>
                <p className="text-muted-foreground mt-2 line-clamp-3 flex-1 leading-7">
                  {p.excerpt}
                </p>
                <p className="text-muted-foreground mt-4 text-xs">
                  {p.publishAt && formatDate(p.publishAt)} · {toFaDigits(p.readingMinutes)} دقیقه
                  مطالعه
                </p>
              </article>
            ))}
          </div>
        </Section>
      )}

      {faqs.length > 0 && (
        <Section muted={posts.length > 0} aria-labelledby="faq-title">
          <SectionHeader
            id="faq-title"
            eyebrow="سؤالات متداول"
            title="پیش از خرید چه چیزهایی را بدانید؟"
          />
          <FAQ items={faqs} />
        </Section>
      )}

      <CtaWithForm
        title="یک دموی ۲۰ دقیقه‌ای، تا ببینید حساب‌وکتاب چقدر می‌تواند ساده باشد"
        description="کارشناس ما نرم‌افزار مخصوص صنف شما را زنده نشان می‌دهد و به همه‌ی سؤال‌هایتان جواب می‌دهد؛ بدون هزینه و بدون تعهد."
      />

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_NAME,
            alternateName: "آوین اپس",
            url: absoluteUrl("/"),
            logo: absoluteUrl("/icon.svg"),
            email: settings.email || undefined,
            contactPoint: settings.phone
              ? [
                  {
                    "@type": "ContactPoint",
                    telephone: settings.phone,
                    contactType: "sales",
                    areaServed: "IR",
                    availableLanguage: "fa",
                  },
                ]
              : undefined,
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: absoluteUrl("/"),
            inLanguage: "fa-IR",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: absoluteUrl("/products?q={search_term_string}"),
              },
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />
    </>
  );
}
