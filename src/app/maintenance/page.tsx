import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { getSettings } from "@/server/queries/settings";

export const metadata: Metadata = { title: "در حال به‌روزرسانی", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Maintenance() {
  const s = await getSettings();
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Wrench className="size-8" aria-hidden /></span>
        <h1 className="text-2xl font-black">در حال به‌روزرسانی سایت هستیم</h1>
        <p className="mt-3 leading-8 text-muted-foreground">به‌زودی با امکانات بهتر برمی‌گردیم. برای پشتیبانی فوری تماس بگیرید{s.phone ? `: ${s.phone}` : "."}</p>
        <p className="mt-6 text-sm text-muted-foreground">{s.nameFa}</p>
      </div>
    </main>
  );
}
