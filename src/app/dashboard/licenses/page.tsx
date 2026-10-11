import Link from "next/link";
import { Globe, Monitor, Smartphone } from "lucide-react";
import { EmptyState } from "@/components/design-system/empty-state";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/dashboard/copy-button";
import { DeactivateDeviceButton, RenewButton } from "@/components/dashboard/license-actions";
import {
  LICENSE_STATUS,
  PLATFORM_LABEL,
  PageTitle,
  Panel,
  StatusBadge,
} from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate, formatRelative, toFaDigits } from "@/lib/format";
import { requireCustomer } from "@/server/session";

export const metadata = { title: "لایسنس‌ها" };

const PLATFORM_ICON = {
  WINDOWS: Monitor,
  ANDROID: Smartphone,
  WEB: Globe,
  IOS: Smartphone,
} as const;

export default async function LicensesPage() {
  const user = await requireCustomer("/dashboard/licenses");
  const licenses = await db.license.findMany({
    where: { userId: user.id },
    include: {
      product: true,
      plan: true,
      devices: { where: { isActive: true }, orderBy: { lastSeenAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  const topPlanOrder =
    (await db.plan.aggregate({ where: { isActive: true }, _max: { sortOrder: true } }))._max
      .sortOrder ?? 0;

  return (
    <>
      <PageTitle
        title="لایسنس‌ها و دستگاه‌ها"
        description="کلید لایسنس را هنگام نصب نرم‌افزار وارد کنید. برای انتقال به سیستم جدید، ابتدا دستگاه قبلی را غیرفعال کنید."
      />
      {!licenses.length ? (
        <EmptyState
          icon="KeyRound"
          title="لایسنسی ثبت نشده است"
          action={
            <Button asChild className="rounded-xl">
              <Link href="/products">خرید نرم‌افزار</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {licenses.map((l) => {
            const st = LICENSE_STATUS[l.status];
            return (
              <Panel key={l.id}>
                <div className="flex flex-wrap items-start gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold" dir="ltr" style={{ textAlign: "right" }}>
                      {l.product.name}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {l.product.industryName} · {l.plan.name}
                    </p>
                  </div>
                  <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                  <div className="ms-auto flex flex-wrap gap-2">
                    {l.plan.durationDays && l.status !== "REVOKED" && (
                      <RenewButton licenseId={l.id} />
                    )}
                    {l.plan.sortOrder < topPlanOrder && l.status !== "REVOKED" && (
                      <Button asChild size="sm" className="rounded-lg">
                        <Link href={`/dashboard/upgrade?license=${l.id}`}>ارتقای پلن</Link>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="bg-muted/60 mt-4 flex flex-wrap items-center gap-3 rounded-xl p-3">
                  <span className="text-muted-foreground text-sm">کلید لایسنس:</span>
                  <code className="font-mono text-base font-bold tracking-wider" dir="ltr">
                    {l.key}
                  </code>
                  <CopyButton value={l.key} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">تاریخ صدور</dt>
                    <dd className="font-medium">{formatDate(l.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">اعتبار سرویس</dt>
                    <dd className="font-medium">
                      {l.expiresAt ? formatDate(l.expiresAt) : "دائمی"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">دستگاه‌ها</dt>
                    <dd className="font-medium">
                      {toFaDigits(l.devices.length)} از {toFaDigits(l.maxDevices)}
                    </dd>
                  </div>
                </dl>
                {l.webUrl && (
                  <p className="mt-3 text-sm">
                    نسخه‌ی تحت وب:{" "}
                    <a
                      href={l.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-bold hover:underline"
                      dir="ltr"
                    >
                      {l.webUrl}
                    </a>
                  </p>
                )}
                {l.devices.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="mb-2 text-sm font-bold">دستگاه‌های فعال</h3>
                    <ul className="space-y-2">
                      {l.devices.map((d) => {
                        const I = PLATFORM_ICON[d.platform];
                        return (
                          <li
                            key={d.id}
                            className="flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm"
                          >
                            <I className="text-muted-foreground size-5" aria-hidden />
                            <span className="font-medium">
                              {d.deviceName || PLATFORM_LABEL[d.platform]}
                            </span>
                            <span className="text-muted-foreground">
                              آخرین اتصال {formatRelative(d.lastSeenAt)}
                            </span>
                            <span className="ms-auto">
                              <DeactivateDeviceButton
                                deviceId={d.id}
                                name={d.deviceName || PLATFORM_LABEL[d.platform]}
                              />
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </>
  );
}
