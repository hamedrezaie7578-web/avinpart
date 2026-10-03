import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/design-system/section-header";
import { FAQ } from "@/components/design-system/faq";
import { JsonLd } from "@/components/design-system/json-ld";
import { db } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "سؤالات متداول؛ خرید، لایسنس، پشتیبانی و نرم‌افزار اختصاصی",
  description:
    "پاسخ پرتکرارترین سؤالات درباره‌ی خرید نرم‌افزار حسابداری Avin، پلن‌ها، لایسنس، سامانه‌ی مودیان، طراحی نرم‌افزار و سایت اختصاصی.",
  alternates: { canonical: "/faq" },
};

const GROUPS: Array<[string, string]> = [
  ["general", "عمومی"],
  ["payment", "خرید و پرداخت"],
  ["license", "لایسنس و ارتقا"],
  ["custom", "نرم‌افزار اختصاصی"],
  ["website", "طراحی سایت"],
];

export default async function FaqPage() {
  const faqs = await db.faq.findMany({ where: { productId: null }, orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHero
        crumbs={[{ name: "سؤالات متداول", href: "/faq" }]}
        title="سؤالات متداول"
        description="پاسخ سؤال‌تان را پیدا نکردید؟ از صفحه‌ی تماس یا با ثبت تیکت از ما بپرسید."
      />
      <Section>
        <nav
          aria-label="دسته‌های سؤالات"
          className="mx-auto mb-10 flex max-w-3xl flex-wrap justify-center gap-2"
        >
          {GROUPS.filter(([g]) => faqs.some((f) => f.group === g)).map(([g, l]) => (
            <a
              key={g}
              href={`#${g}`}
              className="bg-card hover:border-primary rounded-full border px-4 py-2 text-sm font-medium"
            >
              {l}
            </a>
          ))}
        </nav>
        <div className="space-y-14">
          {GROUPS.map(([g, label]) => {
            const items = faqs.filter((f) => f.group === g);
            if (!items.length) return null;
            return (
              <section key={g} id={g} aria-labelledby={`${g}-h`} className="scroll-mt-24">
                <h2 id={`${g}-h`} className="mb-5 text-center text-2xl font-extrabold">
                  {label}
                </h2>
                <FAQ items={items} withSchema={false} />
              </section>
            );
          })}
        </div>
        <p className="text-muted-foreground mt-12 text-center">
          سؤال تخصصی درباره‌ی یک صنف دارید؟ هر{" "}
          <Link href="/products" className="text-primary font-bold hover:underline">
            صفحه‌ی محصول
          </Link>{" "}
          سؤالات متداول خودش را دارد.
        </p>
      </Section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }}
      />
    </>
  );
}
