import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * موکاپ لپ‌تاپ و موبایل با رابط کاربری نمایشی نرم‌افزار (کاملاً با CSS، بدون تصویر)
 * که رنگ‌های تم محصول جاری را می‌گیرد. بعداً می‌توان اسکرین‌شات واقعی را جایگزین کرد.
 */
export type MockupData = {
  appName: string;
  kpis: Array<{ label: string; value: number; suffix?: string }>;
  rows: Array<{ title: string; amount: number }>;
  chart?: number[];
};

const DEFAULT_CHART = [38, 52, 44, 67, 58, 79, 71, 88, 74, 92, 84, 97];

function Screen({ data }: { data: MockupData }) {
  const chart = data.chart ?? DEFAULT_CHART;
  return (
    <div className="flex h-full bg-white text-[0.5rem] text-slate-700 sm:text-[0.6rem] dark:bg-slate-900 dark:text-slate-200">
      <aside className="bg-brand text-brand-fg flex w-1/5 flex-col gap-1.5 p-2">
        <div className="mb-1 truncate font-black">{data.appName}</div>
        {["داشبورد", "فروش", "انبار", "اشخاص", "چک و بانک", "گزارش‌ها"].map((m, i) => (
          <div
            key={m}
            className={cn(
              "truncate rounded px-1.5 py-1",
              i === 0 ? "bg-white/20 font-bold" : "opacity-80",
            )}
          >
            {m}
          </div>
        ))}
      </aside>
      <div className="flex flex-1 flex-col gap-2 p-2">
        <div className="grid grid-cols-3 gap-1.5">
          {data.kpis.slice(0, 3).map((k) => (
            <div
              key={k.label}
              className="rounded-md border border-slate-200 p-1.5 dark:border-slate-700"
            >
              <div className="truncate text-slate-500 dark:text-slate-400">{k.label}</div>
              <div className="text-brand truncate font-black">
                {formatNumber(k.value)}
                {k.suffix}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-1 items-end gap-1 rounded-md border border-slate-200 p-1.5 dark:border-slate-700">
          {chart.map((h, i) => (
            <div
              key={i}
              className="bg-brand/80 flex-1 rounded-t-sm"
              style={{ height: `${h}%`, opacity: 0.45 + (i / chart.length) * 0.55 }}
            />
          ))}
        </div>
        <div className="space-y-1">
          {data.rows.slice(0, 3).map((r) => (
            <div
              key={r.title}
              className="flex justify-between rounded bg-slate-50 px-1.5 py-1 dark:bg-slate-800"
            >
              <span className="truncate">{r.title}</span>
              <span className="font-bold">{formatNumber(r.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhoneScreen({ data }: { data: MockupData }) {
  return (
    <div className="flex h-full flex-col bg-white text-[0.5rem] text-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <div className="bg-brand text-brand-fg px-2 pt-4 pb-3">
        <div className="font-black">{data.appName}</div>
        <div className="mt-1 opacity-80">{data.kpis[0]?.label}</div>
        <div className="text-sm font-black">{formatNumber(data.kpis[0]?.value ?? 0)}</div>
      </div>
      <div className="flex-1 space-y-1.5 p-2">
        {data.rows.map((r) => (
          <div
            key={r.title}
            className="rounded-md border border-slate-200 p-1.5 dark:border-slate-700"
          >
            <div className="truncate font-bold">{r.title}</div>
            <div className="text-brand">{formatNumber(r.amount)} تومان</div>
          </div>
        ))}
      </div>
      <div className="bg-brand text-brand-fg m-2 rounded-md py-1.5 text-center font-bold">
        صدور فاکتور جدید
      </div>
    </div>
  );
}

export function DeviceMockup({ data, className }: { data: MockupData; className?: string }) {
  return (
    <div
      className={cn("relative mx-auto w-full max-w-xl select-none", className)}
      role="img"
      aria-label={`نمای نرم‌افزار ${data.appName} روی لپ‌تاپ و موبایل`}
    >
      {/* لپ‌تاپ */}
      <div className="relative">
        <div className="rounded-t-2xl border-[10px] border-b-[14px] border-slate-800 bg-slate-800 shadow-2xl dark:border-slate-700">
          <div className="aspect-[16/10] overflow-hidden rounded-md">
            <Screen data={data} />
          </div>
        </div>
        <div className="relative mx-[-6%] h-3 rounded-b-xl bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700">
          <div className="absolute start-1/2 top-0 h-1.5 w-1/6 -translate-x-1/2 rounded-b-md bg-slate-400 rtl:translate-x-1/2 dark:bg-slate-800" />
        </div>
      </div>
      {/* موبایل */}
      <div className="absolute -start-2 -bottom-6 w-[26%] sm:-start-6">
        <div className="rounded-[1.4rem] border-[5px] border-slate-900 bg-slate-900 shadow-2xl">
          <div className="aspect-[9/19] overflow-hidden rounded-[1rem]">
            <PhoneScreen data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
