import { Icon } from "./icon";
import { cn } from "@/lib/utils";

export type FeatureItem = { title: string; description: string; icon: string };

export function FeatureGrid({
  items,
  columns = 3,
  variant = "card",
}: {
  items: FeatureItem[];
  columns?: 2 | 3 | 4;
  variant?: "card" | "plain";
}) {
  return (
    <ul
      className={cn(
        "grid gap-4 sm:grid-cols-2 md:gap-6",
        columns === 3 && "lg:grid-cols-3",
        columns === 4 && "lg:grid-cols-4",
      )}
    >
      {items.map((f) => (
        <li
          key={f.title}
          className={cn(
            "group relative",
            variant === "card" &&
              "bg-card hover:border-brand/40 hover:shadow-brand/5 rounded-2xl border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl",
          )}
        >
          <span className="bg-brand-surface text-brand group-hover:bg-brand group-hover:text-brand-fg mb-4 inline-flex size-12 items-center justify-center rounded-xl transition">
            <Icon name={f.icon} className="size-6" />
          </span>
          <h3 className="mb-2 text-lg font-bold">{f.title}</h3>
          <p className="text-muted-foreground leading-7">{f.description}</p>
        </li>
      ))}
    </ul>
  );
}
