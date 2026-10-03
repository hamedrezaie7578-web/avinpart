import Link from "next/link";

/** نوار CTA چسبان پایین صفحه در موبایل (لندینگ‌ها) */
export function StickyMobileCTA({ buyHref, demoHref }: { buyHref: string; demoHref: string }) {
  return (
    <div
      data-sticky-cta
      className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t p-3 backdrop-blur lg:hidden"
    >
      <div className="flex gap-2">
        <Link
          href={buyHref}
          className="bg-brand text-brand-fg flex h-12 flex-1 items-center justify-center rounded-xl font-bold"
        >
          خرید و قیمت‌ها
        </Link>
        <Link
          href={demoHref}
          className="border-brand text-brand flex h-12 flex-1 items-center justify-center rounded-xl border-2 font-bold"
        >
          دموی رایگان
        </Link>
      </div>
    </div>
  );
}
