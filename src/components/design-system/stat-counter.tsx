"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";

/** عدد انیمیشنی که هنگام ورود به دید شروع به شمارش می‌کند */
export function StatCounter({
  value,
  suffix = "",
  label,
  duration = 1600,
}: {
  value: number;
  suffix?: string;
  label: string;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // مقدار اولیه = عدد واقعی (برای SEO و بدون JS)؛ فقط اگر زیر دید باشد از صفر انیمیت می‌شود
  const [current, setCurrent] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setCurrent(0);
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          setCurrent(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-brand text-3xl font-black md:text-5xl" aria-hidden>
        {formatNumber(current)}
        {suffix}
      </div>
      <span className="sr-only">
        {formatNumber(value)}
        {suffix}
      </span>
      <div className="text-muted-foreground mt-2 text-sm font-medium md:text-base">{label}</div>
    </div>
  );
}
