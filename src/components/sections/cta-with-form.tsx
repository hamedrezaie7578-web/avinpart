import { Check } from "lucide-react";
import { DemoRequestForm } from "./demo-request-form";

export function CtaWithForm({
  title,
  description,
  points = [
    "نصب و راه‌اندازی رایگان از راه دور",
    "انتقال اطلاعات از نرم‌افزار قبلی",
    "آموزش تصویری و پشتیبانی واقعی",
  ],
  productSlug,
  productName,
}: {
  title: string;
  description?: string;
  points?: string[];
  productSlug?: string;
  productName?: string;
}) {
  return (
    <section id="demo" className="py-16 md:py-24" aria-labelledby="cta-title">
      <div className="container-x">
        <div className="bg-brand-gradient text-brand-hero-fg relative overflow-hidden rounded-3xl px-6 py-12 md:px-12 md:py-14">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div
            className="pointer-events-none absolute -start-24 -bottom-24 size-80 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2
                id="cta-title"
                className="text-2xl leading-tight font-extrabold text-balance md:text-4xl"
              >
                {title}
              </h2>
              {description && <p className="mt-4 text-lg leading-8 opacity-90">{description}</p>}
              <ul className="mt-6 space-y-3">
                {points.map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-white/20">
                      <Check className="size-4" aria-hidden />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <DemoRequestForm productSlug={productSlug} productName={productName} />
          </div>
        </div>
      </div>
    </section>
  );
}
