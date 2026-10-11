"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";
import { invalidate } from "@/server/admin/revalidate";

const PLATFORMS = ["WINDOWS", "ANDROID", "WEB", "IOS"] as const;

export async function savePlan(id: string, f: FormData) {
  return adminAction("plans.write", async (admin) => {
    const plan = await db.plan.findUnique({ where: { id } });
    if (!plan) throw new ActionError("پلن یافت نشد.");
    const data = {
      name: fd.str(f, "name", { required: "نام پلن را وارد کنید." }),
      tagline: fd.str(f, "tagline"),
      price: fd.int(f, "price", { required: "قیمت را وارد کنید.", min: 0 })!,
      compareAtPrice: fd.int(f, "compareAtPrice", { min: 0 }),
      isPopular: fd.bool(f, "isPopular"),
      platforms: fd.arr(f, "platforms").filter((p): p is (typeof PLATFORMS)[number] => (PLATFORMS as readonly string[]).includes(p)),
      durationDays: fd.int(f, "durationDays", { min: 1 }),
      renewalPrice: fd.int(f, "renewalPrice", { min: 0 }),
      maxDevices: fd.int(f, "maxDevices", { min: 1 }) ?? 1,
      sortOrder: fd.int(f, "sortOrder") ?? 0,
      isActive: fd.bool(f, "isActive"),
    };
    if (data.compareAtPrice !== null && data.compareAtPrice <= data.price) throw new ActionError("قیمت خط‌خورده باید بیشتر از قیمت فروش باشد.");
    const highlights = fd.lines(f, "highlights");
    await db.$transaction([
      // فقط یک پلن «محبوب» داریم
      ...(data.isPopular ? [db.plan.updateMany({ where: { id: { not: id } }, data: { isPopular: false } })] : []),
      db.plan.update({ where: { id }, data }),
      db.setting.upsert({ where: { key: `plan.${plan.code}.highlights` }, create: { key: `plan.${plan.code}.highlights`, value: highlights }, update: { value: highlights } }),
    ]);
    await audit(admin.id, "plan.update", "Plan", id, { ...data, highlights, oldPrice: plan.price });
    invalidate.plans();
    invalidate.settings();
    return { ok: true, message: "پلن ذخیره شد." };
  });
}

const comparison = z.array(
  z.object({
    id: z.string().optional(),
    group: z.string().trim().min(1, { error: "گروه ردیف خالی است." }),
    title: z.string().trim().min(1, { error: "عنوان ردیف خالی است." }),
    tooltip: z.string().optional().nullable(),
    values: z.record(z.string(), z.object({ included: z.boolean(), note: z.string().optional().nullable() })),
  }),
);

/** ذخیره‌ی کامل جدول مقایسه‌ی پلن‌ها */
export async function saveComparison(f: FormData) {
  return adminAction("plans.write", async (admin) => {
    let rows: z.infer<typeof comparison>;
    try {
      const r = comparison.safeParse(JSON.parse(String(f.get("payload"))));
      if (!r.success) throw new ActionError(r.error.issues[0]?.message ?? "داده نامعتبر");
      rows = r.data;
    } catch (e) {
      if (e instanceof ActionError) throw e;
      throw new ActionError("داده نامعتبر");
    }
    const planIds = new Set((await db.plan.findMany({ select: { id: true } })).map((p) => p.id));
    await db.$transaction(async (tx) => {
      const keep = rows.map((r) => r.id).filter(Boolean) as string[];
      await tx.comparisonFeature.deleteMany({ where: { id: { notIn: keep } } });
      for (const [i, r] of rows.entries()) {
        const data = { group: r.group, title: r.title, tooltip: r.tooltip || null, sortOrder: i };
        const feat = r.id ? await tx.comparisonFeature.update({ where: { id: r.id }, data }) : await tx.comparisonFeature.create({ data });
        await tx.planFeatureValue.deleteMany({ where: { featureId: feat.id } });
        const values = Object.entries(r.values).filter(([pid]) => planIds.has(pid));
        if (values.length) await tx.planFeatureValue.createMany({ data: values.map(([planId, v]) => ({ planId, featureId: feat.id, included: v.included, note: v.note || null })) });
      }
    });
    await audit(admin.id, "plan.comparison", "ComparisonFeature", null, { count: rows.length });
    invalidate.plans();
    return { ok: true, message: "جدول مقایسه ذخیره شد." };
  });
}

export async function saveDiscount(id: string | null, f: FormData) {
  return adminAction("plans.write", async (admin) => {
    const percent = fd.int(f, "percent", { min: 1 });
    const amount = fd.int(f, "amount", { min: 1 });
    if (!percent === !amount) throw new ActionError("فقط یکی از «درصد» یا «مبلغ» را وارد کنید.");
    if (percent && percent > 90) throw new ActionError("درصد تخفیف حداکثر ۹۰.");
    const startsAt = fd.date(f, "startsAt");
    const endsAt = fd.date(f, "endsAt");
    if (!startsAt || !endsAt || endsAt <= startsAt) throw new ActionError("بازه‌ی زمانی معتبر وارد کنید.");
    const data = { planId: fd.opt(f, "planId"), productId: fd.opt(f, "productId"), percent, amount, label: fd.opt(f, "label"), startsAt, endsAt, isActive: fd.bool(f, "isActive") };
    const d = id ? await db.timedDiscount.update({ where: { id }, data }) : await db.timedDiscount.create({ data });
    await audit(admin.id, id ? "discount.update" : "discount.create", "TimedDiscount", d.id, data);
    invalidate.plans();
    invalidate.products();
    return { ok: true, message: "تخفیف زمان‌دار ذخیره شد." };
  });
}

export async function deleteDiscount(id: string) {
  return adminAction("plans.write", async (admin) => {
    await db.timedDiscount.delete({ where: { id } });
    await audit(admin.id, "discount.delete", "TimedDiscount", id);
    invalidate.plans();
    invalidate.products();
    return { ok: true, message: "حذف شد." };
  });
}
