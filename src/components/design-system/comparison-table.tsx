import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComparisonRow = {
  group: string;
  title: string;
  /** مقدار هر پلن به ترتیب ستون‌ها */
  values: Array<{ included: boolean; note?: string | null }>;
};

export function ComparisonTable({
  plans,
  rows,
  highlightIndex,
  caption = "مقایسه‌ی کامل امکانات پلن‌ها",
}: {
  plans: string[];
  rows: ComparisonRow[];
  highlightIndex?: number;
  caption?: string;
}) {
  const groups = [...new Set(rows.map((r) => r.group))];
  return (
    <div className="bg-card overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-[640px] border-collapse text-sm md:text-base">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="bg-card sticky start-0 p-4 text-start font-bold">
              امکانات
            </th>
            {plans.map((p, i) => (
              <th
                key={p}
                scope="col"
                className={cn(
                  "p-4 text-center font-extrabold",
                  i === highlightIndex && "bg-brand-surface text-brand",
                )}
              >
                {p}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g}>
            <tr>
              <th
                colSpan={plans.length + 1}
                scope="colgroup"
                className="bg-muted/60 text-muted-foreground px-4 py-2.5 text-start text-sm font-bold"
              >
                {g}
              </th>
            </tr>
            {rows
              .filter((r) => r.group === g)
              .map((r) => (
                <tr key={r.title} className="border-b last:border-0">
                  <th scope="row" className="bg-card sticky start-0 p-4 text-start font-medium">
                    {r.title}
                  </th>
                  {r.values.map((v, i) => (
                    <td
                      key={i}
                      className={cn(
                        "p-4 text-center",
                        i === highlightIndex && "bg-brand-surface/50",
                      )}
                    >
                      {v.included ? (
                        <span className="inline-flex flex-col items-center gap-1">
                          <Check className="text-brand size-5" aria-label="دارد" />
                          {v.note && (
                            <span className="text-muted-foreground text-xs">{v.note}</span>
                          )}
                        </span>
                      ) : (
                        <Minus
                          className="text-muted-foreground/50 mx-auto size-5"
                          aria-label="ندارد"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
