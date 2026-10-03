import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Section, SectionHeader } from "@/components/design-system/section-header";
import { FeatureGrid } from "@/components/design-system/feature-grid";
import { FAQ } from "@/components/design-system/faq";
import { PriceTag } from "@/components/design-system/price-tag";
import { JsonLd } from "@/components/design-system/json-ld";
import { PageHero } from "@/components/sections/page-hero";
import { PortfolioGrid } from "@/components/sections/portfolio-grid";
import { CustomOrderWizard } from "@/components/forms/custom-order-wizard";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { getProductPricing } from "@/server/queries/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "طراحی سایت اختصاصی با کدنویسی؛ سریع، امن و متصل به حسابداری",
  description:
    "طراحی سایت و فروشگاه اینترنتی با کدنویسی اختصاصی، بدون وردپرس و قالب آماده. سرعت بالا، امنیت، سئوی فنی حرفه‌ای، مالکیت کامل و اتصال مستقیم موجودی و فاکتورها به نرم‌افزار حسابداری.",
  alternates: { canonical: "/website-design" },
};

const BENEFITS = [
  {
    icon: "Zap",
    title: "سرعت بارگذاری بسیار بالا",
    description:
      "بدون ده‌ها افزونه و کد اضافه؛ صفحات در کسری از ثانیه باز می‌شوند. سرعت بیشتر یعنی فروش بیشتر و رتبه‌ی بهتر در گوگل.",
  },
  {
    icon: "ShieldCheck",
    title: "امنیت واقعی",
    description:
      "بدون آسیب‌پذیری‌های رایج افزونه‌ها و قالب‌های نال‌شده؛ کدی که دقیقاً می‌دانیم چه می‌کند و به‌روز نگه داشته می‌شود.",
  },
  {
    icon: "TrendingUp",
    title: "سئوی فنی از پایه",
    description:
      "رندر سمت سرور، اسکیمای ساختاریافته، URLهای تمیز، نقشه‌ی سایت و امتیاز بالای Core Web Vitals؛ همه از روز اول.",
  },
  {
    icon: "Sparkles",
    title: "بدون محدودیت قالب",
    description:
      "طراحی منحصربه‌فرد برای برند شما و هر امکانی که کسب‌وکارتان لازم دارد؛ نه آنچه یک قالب آماده اجازه می‌دهد.",
  },
  {
    icon: "Lock",
    title: "مالکیت کامل",
    description:
      "دامنه به نام شما، کد و داده متعلق به شما؛ بدون وابستگی به لایسنس افزونه‌ها و قالب‌های خارجی.",
  },
  {
    icon: "RefreshCw",
    title: "یکپارچه با حسابداری",
    description:
      "موجودی سایت همان موجودی انبار است و هر سفارش آنلاین خودکار فاکتور فروش می‌شود؛ بدون ورود دوباره‌ی اطلاعات.",
  },
];

const COMPARE: Array<[string, boolean | string, boolean | string]> = [
  ["سرعت بارگذاری", "بسیار بالا (زیر ۱ ثانیه)", "معمولاً کند با افزونه‌های زیاد"],
  ["امنیت", true, "وابسته به به‌روزرسانی ده‌ها افزونه"],
  ["طراحی منحصربه‌فرد برند", true, "محدود به قالب آماده"],
  ["اتصال مستقیم به نرم‌افزار حسابداری", true, false],
  ["سئوی فنی و امتیاز Core Web Vitals", "عالی", "متوسط تا ضعیف"],
  ["هزینه‌ی افزونه و قالب پولی", "ندارد", "دارد (اغلب سالانه)"],
  ["مقیاس‌پذیری با رشد ترافیک", true, "نیازمند بهینه‌سازی‌های پرهزینه"],
  ["مالکیت و کنترل کامل کد", true, "وابسته به توسعه‌دهندگان افزونه‌ها"],
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Check className="text-success mx-auto size-5" aria-label="دارد" />;
  if (v === false)
    return <Minus className="text-muted-foreground/50 mx-auto size-5" aria-label="ندارد" />;
  return <span className="text-sm">{v}</span>;
}

export default async function WebsiteDesignPage() {
  const [items, faqs, pricing] = await Promise.all([
    db.portfolioItem.findMany({
      where: { isPublished: true, type: "WEBSITE" },
      orderBy: { sortOrder: "asc" },
    }),
    db.faq.findMany({
      where: { productId: null, group: "website" },
      orderBy: { sortOrder: "asc" },
    }),
    getProductPricing(null),
  ]);
  const sitePlan = pricing.plans.find((p) => p.code === "ONLINE_SITE");

  return (
    <>
      <PageHero
        variant="brand"
        crumbs={[{ name: "طراحی سایت اختصاصی", href: "/website-design" }]}
        eyebrow="بدون وردپرس، بدون قالب آماده"
        title="طراحی سایت اختصاصی؛ سریع، امن و متصل به حسابداری شما"
        description="سایت شما ویترین آنلاین کسب‌وکارتان است. ما آن را با کدنویسی اختصاصی و فناوری‌های روز وب می‌سازیم تا هم مشتری را جذب کند، هم در گوگل دیده شود و هم مستقیم با موجودی و فاکتورهای نرم‌افزار حسابداری‌تان یکی باشد."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-xl bg-white px-7 font-bold text-slate-900 hover:bg-white/90"
          >
            <a href="#order">درخواست طراحی سایت</a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="glass-on-dark h-12 rounded-xl px-7 font-bold text-current hover:bg-white/15 hover:text-current"
          >
            <a href="#compare">مقایسه با وردپرس</a>
          </Button>
        </div>
      </PageHero>

      <Section aria-labelledby="benefits-title">
        <SectionHeader
          id="benefits-title"
          eyebrow="چرا کدنویسی اختصاصی؟"
          title="سایتی که برای فروش ساخته شده، نه فقط برای دیده شدن"
          description="هر ثانیه تأخیر در بارگذاری، بخشی از مشتریان را فراری می‌دهد. سایت اختصاصی فقط همان کدی را دارد که لازم است؛ نه یک خط بیشتر."
        />
        <FeatureGrid items={BENEFITS} />
      </Section>

      <Section id="compare" muted aria-labelledby="compare-title">
        <SectionHeader
          id="compare-title"
          eyebrow="مقایسه"
          title="سایت اختصاصی در برابر وردپرس و قالب آماده"
        />
        <div className="bg-card mx-auto max-w-4xl overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[560px] border-collapse">
            <caption className="sr-only">مقایسه‌ی سایت اختصاصی و وردپرس</caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="p-4 text-start">
                  معیار
                </th>
                <th scope="col" className="bg-accent text-accent-foreground p-4 text-center">
                  سایت اختصاصی Avin
                </th>
                <th scope="col" className="p-4 text-center">
                  وردپرس / قالب آماده
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([k, a, b]) => (
                <tr key={k} className="border-b last:border-0">
                  <th scope="row" className="p-4 text-start font-medium">
                    {k}
                  </th>
                  <td className="bg-accent/40 p-4 text-center font-medium">
                    <Cell v={a} />
                  </td>
                  <td className="text-muted-foreground p-4 text-center">
                    <Cell v={b} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {sitePlan && (
        <Section aria-labelledby="plan-title">
          <div className="bg-card grid items-center gap-8 rounded-3xl border p-6 md:p-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 id="plan-title" className="text-2xl font-extrabold md:text-3xl">
                نرم‌افزار حسابداری + فروشگاه اینترنتی اختصاصی، در یک پلن
              </h2>
              <p className="text-muted-foreground mt-4 leading-8">
                با {sitePlan.name}، علاوه بر همه‌ی امکانات پلن آنلاین (ویندوز، اندروید و وب)، یک
                سایت یا فروشگاه اینترنتی اختصاصی تحویل می‌گیرید که موجودی، قیمت‌ها و سفارش‌هایش
                مستقیم به حسابداری وصل است.
              </p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {sitePlan.highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-sm">
                    <Check className="text-primary size-5 shrink-0" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-muted/50 rounded-2xl p-6 text-center">
              <PriceTag
                price={sitePlan.resolved.price}
                compareAtPrice={sitePlan.resolved.compareAtPrice}
                className="items-center"
              />
              <p className="text-muted-foreground mt-2 text-sm">
                شامل یک سال سرویس ابری و پشتیبانی
              </p>
              <Button asChild className="mt-5 h-12 w-full rounded-xl font-bold">
                <Link href="/pricing">مقایسه‌ی پلن‌ها</Link>
              </Button>
            </div>
          </div>
        </Section>
      )}

      {items.length > 0 && (
        <Section muted aria-labelledby="wp-portfolio">
          <SectionHeader id="wp-portfolio" eyebrow="نمونه‌کارها" title="سایت‌هایی که ساخته‌ایم" />
          <PortfolioGrid items={items} />
        </Section>
      )}

      <Section id="order" aria-labelledby="order-title">
        <SectionHeader
          id="order-title"
          eyebrow="شروع پروژه"
          title="درخواست طراحی سایت اختصاصی"
          description="نیازتان را ثبت کنید؛ پس از بررسی، پیشنهاد طراحی و پیش‌فاکتور برایتان ارسال می‌شود."
        />
        <div className="mx-auto max-w-4xl">
          <CustomOrderWizard type="WEBSITE" />
        </div>
      </Section>

      {faqs.length > 0 && (
        <Section muted aria-labelledby="wd-faq">
          <SectionHeader id="wd-faq" eyebrow="سؤالات متداول" title="درباره‌ی طراحی سایت اختصاصی" />
          <FAQ items={faqs} />
        </Section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "طراحی سایت اختصاصی",
          provider: { "@type": "Organization", name: "AvinApps", url: absoluteUrl("/") },
          areaServed: { "@type": "Country", name: "Iran" },
          url: absoluteUrl("/website-design"),
        }}
      />
    </>
  );
}
