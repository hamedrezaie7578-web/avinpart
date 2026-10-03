import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "start";
  /** سطح هدینگ؛ پیش‌فرض h2 (هر صفحه فقط یک h1 دارد) */
  as?: "h1" | "h2" | "h3";
  className?: string;
  id?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  as: Tag = "h2",
  className,
  id,
}: Props) {
  return (
    <div
      className={cn(
        "mb-10 max-w-3xl md:mb-14",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="bg-brand-surface text-brand mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold">
          <span className="bg-brand size-1.5 rounded-full" aria-hidden />
          {eyebrow}
        </p>
      )}
      <Tag
        id={id}
        className="text-2xl leading-tight font-extrabold tracking-tight text-balance sm:text-3xl md:text-4xl"
      >
        {title}
      </Tag>
      {description && (
        <p className="text-muted-foreground mt-4 text-base leading-8 text-pretty md:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}

export function Section({
  children,
  className,
  muted,
  id,
  "aria-labelledby": labelledBy,
}: {
  children: ReactNode;
  className?: string;
  muted?: boolean;
  id?: string;
  "aria-labelledby"?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("py-16 md:py-24", muted && "bg-brand-surface/60", className)}
    >
      <div className="container-x">{children}</div>
    </section>
  );
}
