import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPage, Card, DL } from "@/components/admin/ui";
import { ActionButton, ActionForm, Field, Select, TextArea } from "@/components/admin/form";
import { LICENSE_STATUS, PLATFORM_LABEL, StatusBadge } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDateTime, formatRelative, toFaDigits } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { toLocalInput } from "@/server/admin/fd";
import { adminDeactivateDevice, updateLicense } from "@/server/actions/admin/licenses";

export const metadata = { title: "لایسنس" };

export default async function LicenseAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("licenses.read");
  const { id } = await params;
  const l = await db.license.findUnique({
    where: { id },
    include: { product: true, plan: true, user: true, orderItem: { include: { order: true } }, devices: { orderBy: { lastSeenAt: "desc" } }, logs: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  if (!l) notFound();
  const st = LICENSE_STATUS[l.status];
  return (
    <AdminPage title={l.key} back={{ href: "/admin/licenses", label: "لایسنس‌ها" }} actions={<StatusBadge tone={st.tone}>{st.label}</StatusBadge>}>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <Card title="اطلاعات">
            <DL
              items={[
                ["محصول", l.product.name],
                ["پلن", l.plan.name],
                ["مشتری", <Link key="u" href={`/admin/customers/${l.userId}`} className="text-primary hover:underline">{l.user.name || toFaDigits(l.user.mobile)}</Link>],
                ["سفارش", l.orderItem ? <Link key="o" href={`/admin/orders/${l.orderItem.orderId}`} className="text-primary hover:underline">#{toFaDigits(l.orderItem.order.number)}</Link> : "صدور دستی"],
                ["صدور", formatDateTime(l.createdAt)],
              ]}
            />
          </Card>
          <Card title="ویرایش">
            <ActionForm action={updateLicense.bind(null, l.id)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="وضعیت" name="status" defaultValue={l.status} options={Object.entries(LICENSE_STATUS).map(([value, v]) => ({ value, label: v.label }))} />
                <Field label="حداکثر دستگاه" name="maxDevices" type="number" min={1} defaultValue={l.maxDevices} />
                <Field label="تاریخ انقضا (خالی = دائمی)" name="expiresAt" type="datetime-local" defaultValue={toLocalInput(l.expiresAt)} />
                <Field label="لینک نسخه‌ی تحت وب" name="webUrl" dir="ltr" defaultValue={l.webUrl ?? ""} />
              </div>
              <TextArea label="یادداشت داخلی" name="note" defaultValue={l.note ?? ""} rows={2} />
            </ActionForm>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title={`دستگاه‌ها (${toFaDigits(l.devices.filter((d) => d.isActive).length)} فعال از ${toFaDigits(l.maxDevices)})`}>
            {l.devices.length ? (
              <ul className="divide-y text-sm">
                {l.devices.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 py-2">
                    <span className="font-medium">{d.deviceName || PLATFORM_LABEL[d.platform]}</span>
                    <span className="text-xs text-muted-foreground">{PLATFORM_LABEL[d.platform]} · آخرین اتصال {formatRelative(d.lastSeenAt)}</span>
                    <span className="font-mono text-[0.65rem] text-muted-foreground" dir="ltr">{d.hardwareId.slice(0, 12)}…</span>
                    <span className="ms-auto">
                      {d.isActive ? <ActionButton action={adminDeactivateDevice.bind(null, d.id)} confirm="دستگاه غیرفعال شود؟">غیرفعال‌سازی</ActionButton> : <StatusBadge tone="gray">غیرفعال</StatusBadge>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">هنوز روی دستگاهی فعال نشده است.</p>
            )}
          </Card>
          <Card title="لاگ فعال‌سازی و اعتبارسنجی">
            <ul className="max-h-96 divide-y overflow-y-auto text-xs">
              {l.logs.map((g) => (
                <li key={g.id} className="flex flex-wrap gap-3 py-1.5">
                  <span className="font-bold">{g.action}</span>
                  <span className={g.result.startsWith("denied") ? "text-destructive" : "text-muted-foreground"}>{g.result}</span>
                  {g.ip && <span dir="ltr" className="text-muted-foreground">{g.ip}</span>}
                  <span className="ms-auto text-muted-foreground">{formatDateTime(g.createdAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
