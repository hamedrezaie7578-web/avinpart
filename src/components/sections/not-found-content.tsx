import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/design-system/product-card";
import { getPublishedProducts } from "@/server/queries/catalog";

/** صفحه‌ی ۴۰۴ هوشمند: جست‌وجو + پیشنهاد محصولات پرطرفدار + لینک‌های مهم */
export async function NotFoundContent() {
  const products = (await getPublishedProducts().catch(() => []))
    .filter((p) => p.isFeatured)
    .slice(0, 4);
  return (
    <div className="container-x py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-brand-gradient text-8xl font-black md:text-9xl" aria-hidden>
          ۴۰۴
        </p>
        <h1 className="mt-4 text-2xl font-extrabold md:text-3xl">این صفحه پیدا نشد</h1>
        <p className="text-muted-foreground mt-4 leading-8">
          شاید آدرس اشتباه تایپ شده یا صفحه جابه‌جا شده است. نرم‌افزار صنف‌تان را جست‌وجو کنید یا از
          پیشنهادهای زیر شروع کنید.
        </p>
        <form
          action="/products"
          method="get"
          role="search"
          className="relative mx-auto mt-8 max-w-md"
        >
          <label htmlFor="nf-q" className="sr-only">
            جست‌وجوی صنف
          </label>
          <Search
            className="text-muted-foreground pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2"
            aria-hidden
          />
          <input
            id="nf-q"
            name="q"
            type="search"
            placeholder="مثلاً: داروخانه، رستوران، طلا…"
            className="bg-card focus:border-primary focus:ring-primary/15 h-13 w-full rounded-2xl border ps-12 pe-24 outline-none focus:ring-4"
          />
          <Button
            type="submit"
            className="absolute end-1.5 top-1/2 h-10 -translate-y-1/2 rounded-xl px-4"
          >
            جست‌وجو
          </Button>
        </form>
        <nav
          aria-label="لینک‌های مفید"
          className="text-primary mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-bold"
        >
          <Link href="/" className="hover:underline">
            صفحه‌ی اصلی
          </Link>
          <Link href="/products" className="hover:underline">
            همه‌ی محصولات
          </Link>
          <Link href="/pricing" className="hover:underline">
            قیمت‌ها
          </Link>
          <Link href="/contact" className="hover:underline">
            تماس با ما
          </Link>
        </nav>
      </div>
      {products.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 text-center text-xl font-extrabold">محصولات پرطرفدار</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
