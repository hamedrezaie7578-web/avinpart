import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductThemeScope } from "@/components/design-system/product-theme-scope";
import { JsonLd } from "@/components/design-system/json-ld";
import {
  LandingSectionView,
  sectionHasContent,
  type LandingContext,
} from "@/components/landing/sections";
import { StickyMobileCTA } from "@/components/layout/sticky-mobile-cta";
import { db } from "@/lib/db";
import { defaultSections } from "@/lib/landing-defaults";
import { parseSection, type ParsedSection } from "@/lib/sections";
import { absoluteUrl } from "@/lib/site";
import { getProductPricing } from "@/server/queries/catalog";
import { getLandingProduct, getSiblingProducts } from "@/server/queries/landing";
import { getSettings } from "@/server/queries/settings";

export const revalidate = 3600;
// محصولاتی که بعداً از پنل اضافه می‌شوند هم با ISR ساخته می‌شوند
export const dynamicParams = true;

type Props = { params: Promise<{ productSlug: string }> };

export async function generateStaticParams() {
  try {
    const rows = await db.product.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    return rows.map((r) => ({ productSlug: r.slug }));
  } catch {
    // build بدون دسترسی به دیتابیس (مثلاً داخل Docker): صفحات در اولین درخواست ساخته می‌شوند
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productSlug } = await params;
  const p = await getLandingProduct(productSlug);
  if (!p) return {};
  const title = p.seoTitle ?? `نرم افزار حسابداری ${p.industryName} | ${p.name}`;
  const description = p.seoDescription ?? p.shortDesc;
  return {
    title: { absolute: title },
    description,
    keywords: [p.focusKeyword, ...p.keywords].filter(Boolean) as string[],
    alternates: { canonical: `/${p.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(`/${p.slug}`),
      siteName: "AvinApps",
      locale: "fa_IR",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProductLandingPage({ params }: Props) {
  const { productSlug } = await params;
  const product = await getLandingProduct(productSlug);
  if (!product) notFound();

  const [settings, siblings, pricing] = await Promise.all([
    getSettings(),
    product.related.length
      ? Promise.resolve([])
      : getSiblingProducts(product.id, product.categoryId),
    getProductPricing(product.id),
  ]);

  const parsed = product.sections.map(parseSection).filter((s): s is ParsedSection => s !== null);
  const sections = (parsed.length ? parsed : defaultSections(product)).filter((s) =>
    sectionHasContent(s, product),
  );

  const base: Omit<LandingContext, "muted"> = {
    product,
    settings,
    related: product.related.length ? product.related : siblings,
  };
  // پس‌زمینه‌ی سکشن‌ها یکی‌درمیان (به‌جز هیرو و CTA که پس‌زمینه‌ی خود را دارند)
  let alt = false;
  const rendered = sections.map((s) => {
    const own = s.type === "HERO" || s.type === "CTA";
    const muted = own ? false : alt;
    if (!own) alt = !alt;
    return <LandingSectionView key={s.id} section={s} ctx={{ ...base, muted }} />;
  });

  const offers = pricing.plans.filter((p) => p.resolved.isAvailable);

  return (
    <ProductThemeScope theme={product.theme}>
      {rendered}
      <StickyMobileCTA buyHref="#pricing" demoHref="#demo" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: product.name,
          alternateName: `نرم‌افزار حسابداری ${product.industryName}`,
          description: product.shortDesc,
          url: absoluteUrl(`/${product.slug}`),
          applicationCategory: "BusinessApplication",
          applicationSubCategory: "AccountingApplication",
          operatingSystem: "Windows, Android, Web",
          inLanguage: "fa",
          publisher: { "@type": "Organization", name: "AvinApps", url: absoluteUrl("/") },
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "IRR",
            lowPrice: Math.min(...offers.map((o) => o.resolved.price)) * 10,
            highPrice: Math.max(...offers.map((o) => o.resolved.price)) * 10,
            offerCount: offers.length,
            offers: offers.map((o) => ({
              "@type": "Offer",
              name: o.name,
              price: o.resolved.price * 10,
              priceCurrency: "IRR",
              availability: "https://schema.org/InStock",
              url: absoluteUrl(`/${product.slug}#pricing`),
            })),
          },
          ...(product.ratingValue && product.ratingCount
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: product.ratingValue,
                  ratingCount: product.ratingCount,
                  bestRating: 5,
                },
              }
            : {}),
        }}
      />
    </ProductThemeScope>
  );
}
