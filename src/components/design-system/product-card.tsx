import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Icon } from "./icon";
import { ProductThemeScope } from "./product-theme-scope";

export type ProductCardData = {
  slug: string;
  name: string;
  industryName: string;
  shortDesc: string;
  icon: string;
  theme: unknown;
};

/** کارت محصول با رنگ اختصاصی صنف */
export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <ProductThemeScope theme={product.theme} className="h-full">
      <Link
        href={`/${product.slug}`}
        className="group bg-card hover:border-brand/50 hover:shadow-brand/10 relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      >
        <span
          className="bg-brand-gradient absolute inset-x-0 top-0 h-1 opacity-80 transition group-hover:h-1.5"
          aria-hidden
        />
        <span className="bg-brand-gradient text-brand-hero-fg shadow-brand/20 mb-4 flex size-12 items-center justify-center rounded-xl shadow-lg">
          <Icon name={product.icon} className="size-6" />
        </span>
        <span className="text-muted-foreground text-sm font-medium">{product.industryName}</span>
        <span className="mt-1 self-start text-lg font-extrabold" dir="ltr">
          {product.name}
        </span>
        <span className="text-muted-foreground mt-2 flex-1 text-sm leading-7">
          {product.shortDesc}
        </span>
        <span className="text-brand mt-4 inline-flex items-center gap-1 text-sm font-bold">
          مشاهده‌ی امکانات
          <ArrowLeft className="size-4 transition group-hover:-translate-x-1" aria-hidden />
        </span>
      </Link>
    </ProductThemeScope>
  );
}
