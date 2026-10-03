import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function CTASection({
  title,
  description,
  primary,
  secondary,
  children,
}: {
  title: string;
  description?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  children?: ReactNode;
}) {
  return (
    <section className="py-16 md:py-24">
      <div className="container-x">
        <div className="bg-brand-gradient text-brand-hero-fg relative overflow-hidden rounded-3xl px-6 py-12 md:px-14 md:py-16">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div
            className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl leading-tight font-extrabold text-balance md:text-4xl">
                {title}
              </h2>
              {description && <p className="mt-4 text-lg leading-8 opacity-90">{description}</p>}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-xl bg-white px-7 text-base font-bold text-slate-900 hover:bg-white/90"
                >
                  <Link href={primary.href}>{primary.label}</Link>
                </Button>
                {secondary && (
                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="glass-on-dark h-12 rounded-xl px-7 text-base font-bold text-current hover:bg-white/15 hover:text-current"
                  >
                    <Link href={secondary.href}>{secondary.label}</Link>
                  </Button>
                )}
              </div>
            </div>
            {children && <div>{children}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
