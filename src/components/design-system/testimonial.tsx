import { Quote, Star } from "lucide-react";
import { toFaDigits } from "@/lib/format";

export type TestimonialItem = { name: string; role: string; body: string; rating: number };

export function TestimonialCard({ t }: { t: TestimonialItem }) {
  return (
    <figure className="bg-card flex h-full flex-col rounded-2xl border p-6">
      <Quote className="text-brand/30 size-8" aria-hidden />
      <div
        className="mt-3 flex gap-0.5"
        role="img"
        aria-label={`امتیاز ${toFaDigits(t.rating)} از ۵`}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={
              i < t.rating
                ? "size-4 fill-amber-400 text-amber-400"
                : "text-muted-foreground/30 size-4"
            }
            aria-hidden
          />
        ))}
      </div>
      <blockquote className="mt-4 flex-1 leading-8">{t.body}</blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t pt-4">
        <span
          className="bg-brand-surface text-brand flex size-11 items-center justify-center rounded-full font-bold"
          aria-hidden
        >
          {t.name.trim().charAt(0)}
        </span>
        <span>
          <span className="block font-bold">{t.name}</span>
          <span className="text-muted-foreground block text-sm">{t.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export function TestimonialGrid({ items }: { items: TestimonialItem[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => (
        <TestimonialCard key={t.name + t.body.slice(0, 10)} t={t} />
      ))}
    </div>
  );
}
