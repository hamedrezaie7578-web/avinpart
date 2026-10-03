import Link from "next/link";
import { Section, SectionHeader } from "@/components/design-system/section-header";
import { PricingCard, PricingGrid } from "@/components/design-system/pricing-card";
import { ComparisonTable } from "@/components/design-system/comparison-table";
import { getProductPricing } from "@/server/queries/catalog";
import { toFaDigits } from "@/lib/format";

/** سکشن پلن‌ها + جدول مقایسه (مشترک بین صفحه‌ی اصلی، قیمت‌ها و لندینگ‌ها) */
export async function PricingSection({
  productId = null,
  productSlug,
  productName,
  eyebrow = "پلن‌ها و قیمت",
  title,
  description,
  withComparison = true,
  muted,
}: {
  productId?: string | null;
  productSlug?: string;
  productName?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  withComparison?: boolean;
  muted?: boolean;
}) {
  const { plans, rows } = await getProductPricing(productId);
  const popularIndex = plans.findIndex((p) => p.isPopular);
  return (
    <Section id="pricing" muted={muted} aria-labelledby="pricing-title">
      <SectionHeader
        id="pricing-title"
        eyebrow={eyebrow}
        title={
          title ??
          (productName
            ? `قیمت ${productName}؛ پلنی که با کسب‌وکارتان رشد می‌کند`
            : "پلنی که با کسب‌وکارتان رشد می‌کند")
        }
        description={
          description ??
          "قیمت‌ها شفاف و بدون هزینه‌ی پنهان است. با هر پلنی شروع کنید، هر وقت لازم شد فقط با پرداخت مابه‌التفاوت ارتقا دهید."
        }
      />
      <PricingGrid>
        {plans
          .filter((p) => p.resolved.isAvailable)
          .map((p) => (
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
              priceNote={
                p.durationDays
                  ? `شامل ${toFaDigits(Math.round(p.durationDays / 365))} سال سرویس ابری و پشتیبانی`
                  : "لایسنس دائمی — یک‌بار پرداخت"
              }
              ctaHref={
                productSlug
                  ? `/checkout?product=${productSlug}&plan=${p.code}`
                  : `/pricing#choose-${p.code.toLowerCase()}`
              }
              ctaLabel={productSlug ? "خرید این پلن" : "انتخاب پلن"}
            />
          ))}
      </PricingGrid>
      {withComparison && (
        <div className="mt-14">
          <h3 className="mb-5 text-center text-xl font-extrabold">مقایسه‌ی کامل امکانات</h3>
          <ComparisonTable
            plans={plans.map((p) => p.name)}
            rows={rows}
            highlightIndex={popularIndex >= 0 ? popularIndex : undefined}
          />
        </div>
      )}
      <p className="text-muted-foreground mt-8 text-center text-sm">
        قیمت‌ها به تومان و بدون احتساب ارزش افزوده است. سؤالی درباره‌ی پرداخت دارید؟{" "}
        <Link href="/pricing#faq" className="text-brand font-bold hover:underline">
          سؤالات پرداخت
        </Link>
      </p>
    </Section>
  );
}
