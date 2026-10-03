import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/design-system/section-header";
import { FeatureGrid } from "@/components/design-system/feature-grid";
import { FAQ } from "@/components/design-system/faq";
import { JsonLd } from "@/components/design-system/json-ld";
import { PageHero } from "@/components/sections/page-hero";
import { PortfolioGrid } from "@/components/sections/portfolio-grid";
import { CustomOrderWizard } from "@/components/forms/custom-order-wizard";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { toFaDigits } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "طراحی نرم افزار اختصاصی؛ ERP، CRM، اپلیکیشن اندروید و وب‌اپلیکیشن",
  description:
    "طراحی و برنامه‌نویسی نرم‌افزار اختصاصی برای کسب‌وکار شما: نرم‌افزار حسابداری و مدیریتی سفارشی، ERP و CRM، اپلیکیشن اندروید، وب‌اپلیکیشن و اتصال به سیستم‌های موجود. نیازسنجی رایگان.",
  alternates: { canonical: "/custom-software" },
};

const SERVICES = [
  {
    icon: "Calculator",
    title: "نرم‌افزار حسابداری و مدیریتی اختصاصی",
    description:
      "وقتی فرایند مالی یا انبار شما با هیچ نرم‌افزار آماده‌ای جور نیست؛ حسابداری‌ای که دقیقاً مطابق قواعد کسب‌وکار شما کار می‌کند.",
  },
  {
    icon: "Layers",
    title: "ERP سفارشی",
    description:
      "یکپارچه‌سازی تولید، انبار، فروش، خرید و مالی در یک سامانه؛ با BOM، برنامه‌ریزی تولید و بهای تمام‌شده‌ی دقیق.",
  },
  {
    icon: "Users",
    title: "CRM و باشگاه مشتریان",
    description:
      "پرونده‌ی کامل مشتری، قیف فروش، پیگیری کارشناسان، کمپین پیامکی و گزارش عملکرد تیم فروش.",
  },
  {
    icon: "Smartphone",
    title: "اپلیکیشن اندروید",
    description:
      "اپ ویزیتور، اپ مشتریان، اپ انبارگردانی یا هر ابزار موبایلی که تیم شما نیاز دارد؛ با کار آفلاین و همگام‌سازی.",
  },
  {
    icon: "Globe",
    title: "وب‌اپلیکیشن و پنل تحت وب",
    description:
      "سامانه‌های تحت وب امن و سریع برای مدیریت چند شعبه، پرتال نمایندگان یا خدمات آنلاین به مشتریان.",
  },
  {
    icon: "RefreshCw",
    title: "اتصال به سیستم‌های موجود و API",
    description:
      "اتصال نرم‌افزارهای فعلی، سامانه‌ی مودیان، درگاه پرداخت، پنل پیامک و سخت‌افزارها به هم؛ بدون ورود دوباره‌ی اطلاعات.",
  },
];

const STEPS = [
  [
    "نیازسنجی",
    "جلسه‌ی رایگان با کارشناس تحلیل، شناخت فرایندها و مستندسازی دقیق نیازها و اولویت‌ها.",
  ],
  [
    "طراحی",
    "طراحی معماری، دیتابیس و نمونه‌ی اولیه‌ی رابط کاربری؛ ارائه‌ی پیش‌فاکتور و زمان‌بندی شفاف.",
  ],
  [
    "توسعه",
    "برنامه‌نویسی در اسپرینت‌های دو هفته‌ای و تحویل نسخه‌های میانی برای دریافت بازخورد شما.",
  ],
  ["تست", "تست عملکرد، امنیت و بار؛ آزمایش با داده‌های واقعی و رفع همه‌ی اشکال‌ها پیش از تحویل."],
  ["تحویل", "استقرار روی سرور، انتقال اطلاعات، آموزش کاربران و تحویل مستندات و کد."],
  ["پشتیبانی", "ضمانت رفع اشکال، پشتیبانی فنی و توسعه‌ی امکانات جدید هم‌پای رشد کسب‌وکار شما."],
];

const WHY = [
  {
    icon: "BadgeCheck",
    title: "تجربه‌ی واقعی نرم‌افزار کسب‌وکار",
    description:
      "سال‌ها ساخت نرم‌افزار حسابداری برای ده‌ها صنف یعنی منطق مالی، انبار و مالیات را عمیق می‌شناسیم.",
  },
  {
    icon: "Code2",
    title: "کد تمیز و مستند",
    description:
      "معماری ماژولار، تست خودکار و مستندات کامل؛ نرم‌افزاری که سال‌ها قابل توسعه و نگهداری است.",
  },
  {
    icon: "ShieldCheck",
    title: "امنیت از روز اول",
    description:
      "رمزنگاری داده‌ها، کنترل دسترسی نقش‌محور، لاگ تغییرات و پشتیبان‌گیری خودکار در طراحی دیده می‌شود.",
  },
  {
    icon: "Timer",
    title: "تحویل مرحله‌ای و شفاف",
    description: "هر دو هفته خروجی قابل مشاهده دارید؛ نه یک انتظار چندماهه و یک غافلگیری در پایان.",
  },
];

export default async function CustomSoftwarePage() {
  const [items, faqs] = await Promise.all([
    db.portfolioItem.findMany({ where: { isPublished: true }, orderBy: { sortOrder: "asc" } }),
    db.faq.findMany({ where: { productId: null, group: "custom" }, orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <>
      <PageHero
        variant="brand"
        crumbs={[{ name: "نرم‌افزار اختصاصی", href: "/custom-software" }]}
        eyebrow="طراحی نرم‌افزار اختصاصی"
        title="نرم‌افزاری که دقیقاً برای فرایند کسب‌وکار شما ساخته می‌شود"
        description="وقتی نرم‌افزارهای آماده شما را مجبور می‌کنند کارتان را با آن‌ها تطبیق دهید، وقت ساخت نرم‌افزار اختصاصی است. از ERP و CRM تا اپلیکیشن اندروید و اتصال سیستم‌ها؛ با کدنویسی اختصاصی، مالکیت کامل و پشتیبانی بلندمدت."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-xl bg-white px-7 font-bold text-slate-900 hover:bg-white/90"
          >
            <a href="#order">ثبت درخواست و نیازسنجی رایگان</a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="glass-on-dark h-12 rounded-xl px-7 font-bold text-current hover:bg-white/15 hover:text-current"
          >
            <a href="#portfolio">نمونه‌کارها</a>
          </Button>
        </div>
      </PageHero>

      <Section aria-labelledby="services-title">
        <SectionHeader
          id="services-title"
          eyebrow="خدمات"
          title="چه چیزی می‌توانیم برایتان بسازیم؟"
          description="هر پروژه از شناخت دقیق کسب‌وکار شروع می‌شود، نه از یک قالب آماده."
        />
        <FeatureGrid items={SERVICES} />
      </Section>

      <Section muted aria-labelledby="process-title">
        <SectionHeader
          id="process-title"
          eyebrow="مراحل همکاری"
          title="از اولین جلسه تا پشتیبانی بلندمدت"
        />
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="bg-card relative rounded-2xl border p-6">
              <span className="text-primary/15 text-5xl font-black" aria-hidden>
                {toFaDigits(i + 1)}
              </span>
              <h3 className="mt-1 text-lg font-extrabold">
                <span className="sr-only">مرحله‌ی {toFaDigits(i + 1)}: </span>
                {t}
              </h3>
              <p className="text-muted-foreground mt-2 leading-7">{d}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section aria-labelledby="why-title">
        <SectionHeader
          id="why-title"
          eyebrow="چرا ما؟"
          title="شریک فنی‌ای که زبان کسب‌وکار را می‌فهمد"
        />
        <FeatureGrid items={WHY} columns={4} />
      </Section>

      {items.length > 0 && (
        <Section id="portfolio" muted aria-labelledby="portfolio-title">
          <SectionHeader
            id="portfolio-title"
            eyebrow="نمونه‌کارها"
            title="بخشی از پروژه‌هایی که ساخته‌ایم"
          />
          <PortfolioGrid items={items} />
        </Section>
      )}

      <Section id="order" aria-labelledby="order-title">
        <SectionHeader
          id="order-title"
          eyebrow="ثبت سفارش"
          title="درخواست نرم‌افزار اختصاصی"
          description="فرم زیر حدود ۵ دقیقه وقت می‌گیرد. بعد از ثبت، کد پیگیری دریافت می‌کنید و کارشناس ما برای جلسه‌ی نیازسنجی رایگان تماس می‌گیرد."
        />
        <div className="mx-auto max-w-4xl">
          <CustomOrderWizard />
        </div>
      </Section>

      {faqs.length > 0 && (
        <Section muted aria-labelledby="cs-faq">
          <SectionHeader
            id="cs-faq"
            eyebrow="سؤالات متداول"
            title="پیش از سفارش نرم‌افزار اختصاصی"
          />
          <FAQ items={faqs} />
        </Section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "طراحی نرم‌افزار اختصاصی",
          provider: { "@type": "Organization", name: "AvinApps", url: absoluteUrl("/") },
          areaServed: { "@type": "Country", name: "Iran" },
          url: absoluteUrl("/custom-software"),
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "خدمات طراحی نرم‌افزار",
            itemListElement: SERVICES.map((s) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: s.title, description: s.description },
            })),
          },
        }}
      />
    </>
  );
}
