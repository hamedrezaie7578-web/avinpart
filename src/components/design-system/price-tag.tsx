import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PriceTag({
  price,
  compareAtPrice,
  size = "lg",
  className,
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {compareAtPrice ? (
        <span className="text-muted-foreground text-sm">
          <del aria-label={`قیمت قبلی ${formatNumber(compareAtPrice)} تومان`}>
            {formatNumber(compareAtPrice)}
          </del>
          <span className="bg-destructive/10 text-destructive ms-2 rounded-full px-2 py-0.5 text-xs font-bold">
            {formatNumber(Math.round(((compareAtPrice - price) / compareAtPrice) * 100))}٪ تخفیف
          </span>
        </span>
      ) : null}
      <span className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-black tracking-tight",
            size === "lg" ? "text-3xl md:text-4xl" : "text-2xl",
          )}
        >
          {formatNumber(price)}
        </span>
        <span className="text-muted-foreground text-sm font-medium">تومان</span>
      </span>
    </div>
  );
}
