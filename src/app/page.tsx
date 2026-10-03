import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/design-system/product-card";
import { Section, SectionHeader } from "@/components/design-system/section-header";
import { getPublishedProducts } from "@/server/queries/catalog";

export const revalidate = 3600;

/** صفحه‌ی اصلی موقت فاز ۱ — در فاز ۲ با صفحه‌ی کامل جایگزین می‌شود */
export default async function HomePage() {
  const products = await getPublishedProducts();
  return (
    <main>
      <section className="bg-brand-gradient text-brand-hero-fg relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="container-x relative py-20 text-center md:py-28">
          <h1 className="mx-auto max-w-3xl text-3xl leading-tight font-black md:text-5xl">
            نرم‌افزار حسابداری تخصصی برای هر صنف
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 opacity-90">
            ویندوز، اندروید و تحت وب؛ متصل به سامانه‌ی مودیان، با امکانات مخصوص کسب‌وکار شما.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 rounded-xl bg-white px-8 font-bold text-slate-900 hover:bg-white/90"
          >
            <Link href="/design-system">پیش‌نمایش Design System</Link>
          </Button>
        </div>
      </section>
      <Section>
        <SectionHeader eyebrow="۲۶ صنف" title="صنف شما چیست؟" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </Section>
    </main>
  );
}
