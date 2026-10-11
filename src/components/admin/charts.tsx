"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber, formatPriceShort } from "@/lib/format";

const tick = { fill: "var(--muted-foreground)", fontSize: 11 };

function TooltipBox({ active, payload, label, unit = "تومان" }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-bold text-foreground">{formatNumber(payload[0]!.value)} {unit}</p>
    </div>
  );
}

/** درآمد روزانه (یک سری؛ عنوان کارت نام سری است و legend لازم ندارد) */
export function RevenueChart({ data }: { data: Array<{ label: string; value: number }> }) {
  return (
    <div className="h-72" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} reversed />
          <YAxis tick={tick} tickLine={false} axisLine={false} width={72} orientation="right" tickFormatter={(v: number) => formatPriceShort(v).replace(" تومان", "")} />
          <Tooltip content={<TooltipBox />} cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} fill="url(#rev)" activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** فروش هر محصول (میله‌ای افقی، یک رنگ؛ مقدار دقیق در tooltip و جدول کنار نمودار) */
export function BarsChart({ data, unit = "تومان" }: { data: Array<{ label: string; value: number }>; unit?: string }) {
  return (
    <div style={{ height: Math.max(160, data.length * 40) }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }} barCategoryGap={8}>
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
          <XAxis type="number" tick={tick} tickLine={false} axisLine={false} reversed tickFormatter={(v: number) => formatPriceShort(v).replace(" تومان", "")} />
          <YAxis type="category" dataKey="label" tick={tick} tickLine={false} axisLine={false} width={96} orientation="right" />
          <Tooltip content={<TooltipBox unit={unit} />} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="value" fill="var(--chart-1)" maxBarSize={24} radius={[4, 0, 0, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
