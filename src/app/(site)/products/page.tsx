import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/design-system/breadcrumb";
import { Section, SectionHeader } from "@/components/design-system/section-header";
import { ProductCard } from "@/components/design-system/product-card";
import { JsonLd } from "@/components/design-system/json-ld";
import { IndustryFinder } from "@/components/sections/industry-finder";
import { PlatformsSection } from "@/components/sections/platforms";
import { CtaWithForm } from "@/components/sections/cta-with-form";
import { getPublishedProducts } from "@/server/queries/catalog";
import { toFaDigits } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "محصولات؛ نرم افزار حسابداری تخصصی برای هر صنف",
  description:
    "فهرست کامل نرم‌افزارهای حسابداری Avin برای صنوف فروشگاهی، مواد غذایی و پذیرایی، درمانی، خدماتی، صنعتی و شرکت‌های پخش؛ با نسخه‌ی ویندوز، اندروید و تحت وب.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage() {
  const products = await getPublishedProducts();
  const categories = [
    ...new Map(
      products.filter((p) => p.category).map((p) => [p.category!.slug, p.category!]),
    ).values(),
  ];

  return (
    <>
      <section className="bg-muted/30 border-b">
        <div className="container-x py-10 md:py-14">
          <Breadcrumb items={[{ name: "محصولات", href: "/products" }]} />
          <h1 className="mt-6 text-3xl font-black md:text-4xl">
            نرم‌افزار حسابداری تخصصی برای {toFaDigits(products.length)} صنف
          </h1>
          <p className="text-muted-foreground mt-4 max-w-3xl text-lg leading-8">
            هر محصول Avin بر پایه‌ی یک هسته‌ی حسابداری قدرتمند و مشترک ساخته شده و امکاناتی که فقط
            صنف شما لازم دارد روی آن نشسته است. صنف‌تان را جست‌وجو کنید یا از دسته‌بندی‌ها انتخاب
            کنید.
          </p>
        </div>
      </section>

      <Section aria-label="فهرست محصولات">
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

      <Section muted aria-labelledby="by-category">
        <SectionHeader id="by-category" title="محصولات بر اساس دسته‌بندی صنف" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.slug} className="bg-card rounded-2xl border p-6">
              <h2 className="text-lg font-extrabold">{c.name}</h2>
              <ul className="mt-4 space-y-2">
                {products
                  .filter((p) => p.category?.slug === c.slug)
                  .map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/${p.slug}`}
                        className="group hover:bg-accent flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5"
                      >
                        <span>نرم‌افزار {p.industryName}</span>
                        <span className="text-primary text-sm font-bold" dir="ltr">
                          {p.name}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <PlatformsSection />

      <CtaWithForm
        title="مطمئن نیستید کدام نرم‌افزار مناسب کسب‌وکار شماست؟"
        description="مشاوره‌ی رایگان بگیرید؛ کارشناس ما بر اساس نیاز واقعی‌تان بهترین گزینه و پلن را پیشنهاد می‌دهد."
      />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "نرم‌افزارهای حسابداری AvinApps",
          itemListElement: products.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(`/${p.slug}`),
            name: `${p.name} — ${p.industryName}`,
          })),
        }}
      />
    </>
  );
}
