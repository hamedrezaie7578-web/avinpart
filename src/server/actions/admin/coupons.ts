"use server";

import { db } from "@/lib/db";
import { adminAction, audit, ActionError } from "@/server/admin/guard";
import { fd } from "@/server/admin/fd";

function parse(f: FormData) {
  const code = fd.str(f, "code", { required: "کد را وارد کنید." }).toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) throw new ActionError("کد فقط حروف لاتین بزرگ، عدد، - و _ (۳ تا ۳۲ کاراکتر).");
  const type = fd.str(f, "type") === "AMOUNT" ? "AMOUNT" : "PERCENT";
  const value = fd.int(f, "value", { required: "مقدار تخفیف را وارد کنید.", min: 1 })!;
  if (type === "PERCENT" && value > 100) throw new ActionError("درصد تخفیف حداکثر ۱۰۰ است.");
  return {
    code,
    type,
    value,
    maxUses: fd.int(f, "maxUses"),
    perUserLimit: fd.int(f, "perUserLimit"),
    minAmount: fd.int(f, "minAmount"),
    productIds: fd.arr(f, "productIds"),
    planIds: fd.arr(f, "planIds"),
    startsAt: fd.date(f, "startsAt"),
    endsAt: fd.date(f, "endsAt"),
    isActive: fd.bool(f, "isActive"),
  } as const;
}

export async function saveCoupon(id: string | null, f: FormData) {
  return adminAction<{ id: string }>("coupons.write", async (admin) => {
    const data = parse(f);
    const c = id ? await db.coupon.update({ where: { id }, data }) : await db.coupon.create({ data });
    await audit(admin.id, id ? "coupon.update" : "coupon.create", "Coupon", c.id, data);
    return { ok: true, message: "کد تخفیف ذخیره شد.", data: { id: c.id } };
  });
}

export async function deleteCoupon(id: string) {
  return adminAction("coupons.write", async (admin) => {
    const used = await db.order.count({ where: { couponId: id } });
    if (used) {
      await db.coupon.update({ where: { id }, data: { isActive: false } });
      await audit(admin.id, "coupon.deactivate", "Coupon", id);
      return { ok: true, message: "این کد در سفارش‌ها استفاده شده؛ به‌جای حذف غیرفعال شد." };
    }
    await db.coupon.delete({ where: { id } });
    await audit(admin.id, "coupon.delete", "Coupon", id);
    return { ok: true, message: "حذف شد." };
  });
}
