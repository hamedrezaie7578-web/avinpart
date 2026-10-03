import type { ReactNode } from "react";
import { Breadcrumb, type Crumb } from "@/components/design-system/breadcrumb";
import { cn } from "@/lib/utils";

/** هیروی ساده‌ی صفحات داخلی با breadcrumb و تنها H1 صفحه */
export function PageHero({
  crumbs,
  title,
  description,
  eyebrow,
  children,
  variant = "muted",
}: {
  crumbs: Crumb[];
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  children?: ReactNode;
  variant?: "muted" | "brand";
}) {
  const brand = variant === "brand";
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b",
        brand ? "bg-brand-gradient text-brand-hero-fg" : "bg-muted/30",
      )}
    >
      {brand && (
        <div
          className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          aria-hidden
        />
      )}
      <div className="container-x relative py-10 md:py-16">
        <Breadcrumb
          items={crumbs}
          className={
            brand
              ? "opacity-85 [&_a]:text-current [&_li]:text-current [&_ol]:text-current [&_span]:text-current"
              : undefined
          }
        />
        {eyebrow && (
          <p
            className={cn(
              "mt-6 inline-block rounded-full px-3 py-1 text-sm font-semibold",
              brand ? "glass-on-dark" : "bg-accent text-accent-foreground",
            )}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className={cn(
            "max-w-4xl text-3xl leading-tight font-black text-balance md:text-5xl md:leading-tight",
            eyebrow ? "mt-4" : "mt-6",
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "mt-5 max-w-3xl text-lg leading-9",
              brand ? "opacity-90" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
