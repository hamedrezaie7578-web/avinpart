import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Monitor, Network, Store } from "lucide-react";
import { Section, SectionHeader } from "@/components/design-system/section-header";
import { FAQ } from "@/components/design-system/faq";
import { PageHero } from "@/components/sections/page-hero";
import { PricingSection } from "@/components/sections/pricing-section";
import { CtaWithForm } from "@/components/sections/cta-with-form";
import { db } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "قیمت نرم افزار حسابداری؛ مقایسه‌ی پلن آفلاین، آنلاین و آنلاین + سایت",
  description:
    "قیمت نرم‌افزارهای حسابداری Avin: پلن آفلاین با لایسنس دائمی، پلن آنلاین با نسخه‌ی ویندوز، اندروید و وب، و پلن آنلاین + طراحی سایت اختصاصی. جدول مقایسه‌ی کامل امکانات.",
  alternates: { canonical: "/pricing" },
};

const GUIDE = [
  {
    Icon: Monitor,
    plan: "پلن آفلاین",
    who: "یک مغازه، یک سیستم صندوق",
    text: "اگر همه‌ی کارها پشت یک کامپیوتر انجام می‌شود و دسترسی از راه دور لازم ندارید، پلن آفلاین با لایسنس دائمی اقتصادی‌ترین انتخاب است. یک‌بار پرداخت می‌کنید و برای همیشه استفاده می‌کنید.",
  },
  {
    Icon: Network,
    plan: "پلن آنلاین",
    who: "چند کاربر، چند شعبه یا مدیریت از راه دور",
    text: "وقتی چند نفر هم‌زمان کار می‌کنند، شعبه‌ی دوم دارید یا می‌خواهید فروش روز را روی گوشی ببینید، پلن آنلاین با سه نسخه‌ی همگام ویندوز، اندروید و وب همان چیزی است که لازم دارید.",
  },
  {
    Icon: Store,
    plan: "پلن آنلاین + سایت",
    who: "فروش حضوری و اینترنتی با یک موجودی",
    text: "اگر می‌خواهید آنلاین هم بفروشید، این پلن یک فروشگاه اینترنتی با کدنویسی اختصاصی می‌سازد که موجودی و فاکتورهایش مستقیم با حسابداری یکی است؛ بدون ورود دوباره‌ی اطلاعات و بدون فروش کالای ناموجود.",
  },
];

export default async function PricingPage() {
  const faqs = await db.faq.findMany({
    where: { productId: null, group: { in: ["payment", "license"] } },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <>
      <PageHero
        crumbs={[{ name: "قیمت‌ها", href: "/pricing" }]}
        eyebrow="قیمت‌گذاری شفاف"
        title="قیمت نرم‌افزار حسابداری Avin؛ بدون هزینه‌ی پنهان"
        description="همه‌ی محصولات Avin در سه پلن عرضه می‌شوند. با پلنی که امروز لازم دارید شروع کنید؛ هر وقت کسب‌وکارتان بزرگ‌تر شد، فقط با پرداخت مابه‌التفاوت ارتقا دهید و اطلاعاتتان دست‌نخورده منتقل می‌شود."
      />
      <PricingSection
        title="سه پلن، برای سه مرحله از رشد کسب‌وکار"
        description="قیمت پایه‌ی هر پلن در زیر آمده است. ممکن است برخی محصولات تخصصی قیمت اختصاصی یا جشنواره‌ی تخفیف داشته باشند که در صفحه‌ی همان محصول نمایش داده می‌شود."
      />
      <Section muted aria-labelledby="guide-title">
        <SectionHeader
          id="guide-title"
          eyebrow="راهنمای انتخاب"
          title="کدام پلن برای کسب‌وکار شما مناسب است؟"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {GUIDE.map(({ Icon, plan, who, text }) => (
            <article key={plan} className="bg-card rounded-3xl border p-7">
              <Icon className="text-primary size-9" aria-hidden />
              <h3 className="mt-4 text-xl font-extrabold">{plan}</h3>
              <p className="text-primary mt-1 text-sm font-bold">{who}</p>
              <p className="text-muted-foreground mt-3 leading-8">{text}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link
            href="/products"
            className="text-primary inline-flex items-center gap-1 font-bold hover:underline"
          >
            اول صنف خود را انتخاب کنید <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </p>
      </Section>
      <Section id="faq" aria-labelledby="pay-faq">
        <SectionHeader id="pay-faq" eyebrow="پرداخت و لایسنس" title="سؤالات متداول پرداخت" />
        <FAQ items={faqs} />
      </Section>
      <CtaWithForm
        title="هنوز بین دو پلن مردد هستید؟"
        description="مشاوره‌ی رایگان بگیرید؛ کارشناس ما با شناخت کسب‌وکارتان صادقانه می‌گوید کدام پلن کافی است، حتی اگر ارزان‌ترین باشد."
      />
    </>
  );
}
