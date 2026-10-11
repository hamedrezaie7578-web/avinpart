import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Icon } from "@/components/design-system/icon";
import { ProductThemeScope } from "@/components/design-system/product-theme-scope";
import { db } from "@/lib/db";
import { getPublishedProducts } from "@/server/queries/catalog";

export const metadata: Metadata = { title: "انتخاب نرم‌افزار", robots: { index: false } };

/** وقتی کاربر از صفحه‌ی قیمت‌ها پلنی را انتخاب می‌کند، اینجا صنف/محصول را برمی‌گزیند */
export default async function ChooseProductPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: code = "ONLINE" } = await searchParams;
  const [plan, products] = await Promise.all([
    db.plan.findFirst({ where: { code, isActive: true } }),
    getPublishedProducts(),
  ]);
  const planCode = plan?.code ?? "ONLINE";
  return (
    <>
      <PageHero
        crumbs={[
          { name: "قیمت‌ها", href: "/pricing" },
          { name: "انتخاب نرم‌افزار", href: "/cart/choose" },
        ]}
        title="نرم‌افزار کدام صنف را می‌خواهید؟"
        description={
          plan
            ? `پلن انتخابی شما: ${plan.name}. صنف خود را انتخاب کنید تا به سبد خرید اضافه شود.`
            : undefined
        }
      />
      <div className="container-x py-10">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <li key={p.slug}>
              <ProductThemeScope theme={p.theme}>
                <Link
                  href={`/checkout?product=${p.slug}&plan=${planCode}`}
                  prefetch={false}
                  className="bg-card hover:border-brand flex items-center gap-3 rounded-2xl border p-4 transition hover:shadow-lg"
                >
                  <span className="bg-brand-gradient text-brand-hero-fg flex size-11 shrink-0 items-center justify-center rounded-xl">
                    <Icon name={p.icon} className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold">{p.industryName}</span>
                    <span
                      className="text-muted-foreground block text-sm"
                      dir="ltr"
                      style={{ textAlign: "right" }}
                    >
                      {p.name}
                    </span>
                  </span>
                </Link>
              </ProductThemeScope>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
