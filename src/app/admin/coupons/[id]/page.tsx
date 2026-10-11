import { notFound } from "next/navigation";
import { AdminPage, Card } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/coupon-form";
import { DeleteButton } from "@/components/admin/form";
import { db } from "@/lib/db";
import { requireAdmin } from "@/server/admin/guard";
import { deleteCoupon, saveCoupon } from "@/server/actions/admin/coupons";

export const metadata = { title: "کد تخفیف" };

export default async function CouponPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("coupons.write");
  const { id } = await params;
  const isNew = id === "new";
  const [coupon, products, plans] = await Promise.all([
    isNew ? null : db.coupon.findUnique({ where: { id } }),
    db.product.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.plan.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!isNew && !coupon) notFound();
  return (
    <AdminPage
      title={isNew ? "کد تخفیف جدید" : `کد ${coupon!.code}`}
      back={{ href: "/admin/coupons", label: "کدهای تخفیف" }}
      actions={!isNew && <DeleteButton action={deleteCoupon.bind(null, id)} redirectTo="/admin/coupons" />}
    >
      <Card className="max-w-3xl">
        <CouponForm coupon={coupon} products={products} plans={plans} action={saveCoupon.bind(null, isNew ? null : id)} />
      </Card>
    </AdminPage>
  );
}
