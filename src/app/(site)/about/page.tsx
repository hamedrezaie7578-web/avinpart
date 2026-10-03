import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/design-system/section-header";
import { StatCounter } from "@/components/design-system/stat-counter";
import { CtaWithForm } from "@/components/sections/cta-with-form";
import { getPage, pageMetadata } from "@/server/queries/pages";
import { getSettings } from "@/server/queries/settings";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("about", "/about");
}

export default async function AboutPage() {
  const [page, s] = await Promise.all([getPage("about"), getSettings()]);
  if (!page) notFound();
  return (
    <>
      <PageHero
        variant="brand"
        crumbs={[{ name: "درباره‌ی ما", href: "/about" }]}
        title={page.title}
        description="سازنده‌ی نرم‌افزارهای حسابداری تخصصی برای صنوف ایران؛ با این باور که هر کسب‌وکار لایق ابزاری است که زبانش را بفهمد."
      />
      <section aria-label="آمار" className="relative z-10 -mt-8">
        <div className="container-x">
          <div className="bg-card grid grid-cols-2 gap-6 rounded-3xl border p-6 shadow-xl md:grid-cols-4 md:p-8">
            <StatCounter value={s.stats.customers} suffix="+" label="کسب‌وکار فعال" />
            <StatCounter value={s.stats.industries} label="صنف تخصصی" />
            <StatCounter value={s.stats.years} label="سال تجربه" />
            <StatCounter value={s.stats.satisfaction} suffix="٪" label="رضایت مشتریان" />
          </div>
        </div>
      </section>
      <Section>
        <article
          className="prose-fa mx-auto max-w-3xl"
          dangerouslySetInnerHTML={{ __html: page.html }}
        />
      </Section>
      <CtaWithForm
        title="بیایید درباره‌ی کسب‌وکار شما صحبت کنیم"
        description="یک تماس کوتاه کافی است تا بفهمیم کدام نرم‌افزار یا خدمت، بیشترین ارزش را برای شما می‌سازد."
      />
    </>
  );
}
