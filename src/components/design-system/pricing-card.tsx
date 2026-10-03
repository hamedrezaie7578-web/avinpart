import Link from "next/link";
import { Check, Monitor, Smartphone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "./price-tag";
import { cn } from "@/lib/utils";

export type PricingCardProps = {
  name: string;
  tagline: string;
  price: number;
  compareAtPrice?: number | null;
  discountLabel?: string | null;
  features: string[];
  platforms: Array<"WINDOWS" | "ANDROID" | "WEB" | "IOS">;
  isPopular?: boolean;
  ctaHref: string;
  ctaLabel?: string;
  /** توضیح زیر قیمت، مثل «لایسنس دائمی» */
  priceNote?: string;
};

const platformMeta = {
  WINDOWS: { label: "ویندوز", Icon: Monitor },
  ANDROID: { label: "اندروید", Icon: Smartphone },
  WEB: { label: "تحت وب", Icon: Globe },
  IOS: { label: "iOS", Icon: Smartphone },
} as const;

export function PricingCard(p: PricingCardProps) {
  return (
    <article
      className={cn(
        "bg-card relative flex flex-col rounded-3xl border p-6 md:p-8",
        p.isPopular && "border-brand shadow-brand/15 border-2 shadow-2xl lg:-translate-y-3",
      )}
    >
      {p.isPopular && (
        <span className="bg-brand text-brand-fg absolute start-1/2 -top-3.5 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold whitespace-nowrap shadow-lg rtl:translate-x-1/2">
          محبوب‌ترین انتخاب
        </span>
      )}
      <header>
        <h3 className="text-xl font-extrabold">{p.name}</h3>
        <p className="text-muted-foreground mt-2 min-h-12 leading-6">{p.tagline}</p>
      </header>
      <div className="mt-6">
        {p.discountLabel && (
          <p className="bg-brand-surface text-brand mb-2 inline-block rounded-md px-2 py-0.5 text-xs font-bold">
            {p.discountLabel}
          </p>
        )}
        <PriceTag price={p.price} compareAtPrice={p.compareAtPrice} />
        {p.priceNote && <p className="text-muted-foreground mt-1 text-sm">{p.priceNote}</p>}
      </div>
      <ul className="mt-6 flex flex-wrap gap-2" aria-label="نسخه‌های قابل استفاده">
        {p.platforms.map((pl) => {
          const { label, Icon } = platformMeta[pl];
          return (
            <li
              key={pl}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
            >
              <Icon className="text-brand size-3.5" aria-hidden />
              {label}
            </li>
          );
        })}
      </ul>
      <ul className="mt-6 flex-1 space-y-3">
        {p.features.map((f) => (
          <li key={f} className="flex gap-2.5 leading-6">
            <Check className="text-brand mt-0.5 size-5 shrink-0" aria-hidden />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        asChild
        size="lg"
        className={cn(
          "mt-8 h-12 w-full rounded-xl text-base font-bold",
          p.isPopular
            ? "bg-brand text-brand-fg hover:bg-brand/90"
            : "border-brand text-brand hover:bg-brand-surface bg-transparent",
        )}
        variant={p.isPopular ? "default" : "outline"}
      >
        <Link href={p.ctaHref}>{p.ctaLabel ?? "خرید و فعال‌سازی"}</Link>
      </Button>
    </article>
  );
}

export function PricingGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {children}
    </div>
  );
}
