import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ShoppingCart } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { EmptyState } from "@/components/design-system/empty-state";
import { Icon } from "@/components/design-system/icon";
import { ProductThemeScope } from "@/components/design-system/product-theme-scope";
import { Button } from "@/components/ui/button";
import {
  CheckoutButton,
  CouponForm,
  PlanSelect,
  RemoveItemButton,
} from "@/components/cart/cart-controls";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatNumber, toFaDigits } from "@/lib/format";
import { getCartView } from "@/server/cart";

export const metadata: Metadata = { title: "سبد خرید", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, cart, plans, session] = await Promise.all([
    searchParams,
    getCartView(),
    db.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { code: true, name: true },
    }),
    auth(),
  ]);

  return (
    <>
      <PageHero crumbs={[{ name: "سبد خرید", href: "/cart" }]} title="سبد خرید" />
      <div className="container-x py-10 md:py-14">
        {error && (
          <p role="alert" className="bg-destructive/10 text-destructive mb-6 rounded-xl p-4">
            {error}
          </p>
        )}
        {!cart.lines.length ? (
          <EmptyState
            icon="ShoppingCart"
            title="سبد خرید شما خالی است"
            description="نرم‌افزار مخصوص صنف خود را انتخاب کنید و پلن مناسب را به سبد اضافه کنید."
            action={
              <Button asChild className="h-11 rounded-xl px-6 font-bold">
                <Link href="/products">مشاهده‌ی محصولات</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <section aria-label="اقلام سبد">
              <ul className="space-y-4">
                {cart.lines.map((l) => (
                  <li key={l.id}>
                    <ProductThemeScope theme={l.theme}>
                      <article
                        className={`bg-card flex flex-wrap items-center gap-4 rounded-2xl border p-5 ${l.available ? "" : "opacity-60"}`}
                      >
                        <span className="bg-brand-gradient text-brand-hero-fg flex size-14 shrink-0 items-center justify-center rounded-2xl">
                          <Icon name={l.icon} className="size-7" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h2 className="font-extrabold">
                            <Link href={`/${l.productSlug}`} className="hover:text-brand" dir="ltr">
                              {l.productName}
                            </Link>
                          </h2>
                          <p className="text-muted-foreground text-sm">
                            نرم‌افزار حسابداری {l.industryName}
                          </p>
                          <div className="mt-2">
                            <PlanSelect itemId={l.id} current={l.planCode} plans={plans} />
                          </div>
                          {!l.available && (
                            <p className="text-destructive mt-1 text-sm">
                              این قلم در حال حاضر قابل خرید نیست.
                            </p>
                          )}
                        </div>
                        <div className="text-end">
                          {l.compareAtPrice && (
                            <del className="text-muted-foreground block text-sm">
                              {formatNumber(l.compareAtPrice)}
                            </del>
                          )}
                          <p className="text-lg font-black">
                            {formatNumber(l.price)}{" "}
                            <span className="text-muted-foreground text-sm font-medium">تومان</span>
                          </p>
                        </div>
                        <RemoveItemButton itemId={l.id} label={l.productName} />
                      </article>
                    </ProductThemeScope>
                  </li>
                ))}
              </ul>
              <Link
                href="/products"
                className="text-primary mt-6 inline-block text-sm font-bold hover:underline"
              >
                + افزودن محصول دیگر
              </Link>
            </section>
            <aside
              className="bg-card h-fit space-y-5 rounded-3xl border p-6 lg:sticky lg:top-24"
              aria-label="خلاصه‌ی سفارش"
            >
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <ShoppingCart className="size-5" aria-hidden />
                خلاصه‌ی سفارش
              </h2>
              <CouponForm applied={cart.coupon?.code ?? null} />
              {cart.couponError && <p className="text-destructive text-sm">{cart.couponError}</p>}
              <dl className="space-y-3 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    جمع اقلام ({toFaDigits(cart.lines.filter((l) => l.available).length)})
                  </dt>
                  <dd>{formatNumber(cart.subtotal)} تومان</dd>
                </div>
                {cart.discount > 0 && (
                  <div className="text-success flex justify-between">
                    <dt>تخفیف</dt>
                    <dd>− {formatNumber(cart.discount)} تومان</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    مالیات بر ارزش افزوده ({toFaDigits(cart.taxPercent)}٪)
                  </dt>
                  <dd>{formatNumber(cart.tax)} تومان</dd>
                </div>
                <div className="flex justify-between border-t pt-3 text-base font-black">
                  <dt>مبلغ قابل پرداخت</dt>
                  <dd>{formatNumber(cart.total)} تومان</dd>
                </div>
              </dl>
              <CheckoutButton disabled={!cart.lines.some((l) => l.available)} />
              {!session?.user && (
                <p className="text-muted-foreground text-center text-xs">
                  برای پرداخت، با شماره موبایل وارد می‌شوید؛ سبد شما حفظ می‌شود.
                </p>
              )}
              <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
                <ShieldCheck className="size-4" aria-hidden />
                پرداخت امن از طریق درگاه بانکی · فاکتور رسمی
              </p>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
