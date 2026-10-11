import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { UpgradeButton } from "@/components/dashboard/license-actions";
import { PageTitle, Panel } from "@/components/dashboard/ui";
import { formatNumber } from "@/lib/format";
import { getSettings } from "@/server/queries/settings";
import { getUpgradeOptions } from "@/server/licenses";
import { requireCustomer } from "@/server/session";
import { db } from "@/lib/db";

export const metadata = { title: "ارتقای پلن" };

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ license?: string }>;
}) {
  const user = await requireCustomer("/dashboard/licenses");
  const { license } = await searchParams;
  const data = license ? await getUpgradeOptions(license, user.id) : null;
  if (!data) notFound();
  const { taxPercent } = await getSettings();
  const highlights = new Map(
    (await db.setting.findMany({ where: { key: { startsWith: "plan." } } })).map((s) => [
      s.key,
      s.value as string[],
    ]),
  );

  return (
    <>
      <PageTitle
        title={`ارتقای ${data.license.product.name}`}
        description={`پلن فعلی: ${data.license.plan.name}. مبلغ پرداختی قبلی شما (${formatNumber(data.paid)} تومان) ${data.license.expiresAt ? "به نسبت مدت باقی‌مانده" : "به‌طور کامل"} از قیمت پلن جدید کسر می‌شود.`}
      />
      {!data.options.length ? (
        <Panel>
          <p>
            لایسنس شما در بالاترین پلن است.{" "}
            <Link href="/dashboard/licenses" className="text-primary font-bold">
              بازگشت
            </Link>
          </p>
        </Panel>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {data.options.map((o) => (
            <Panel key={o.plan.id} title={o.plan.name}>
              <p className="text-muted-foreground text-sm">{o.plan.tagline}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {(highlights.get(`plan.${o.plan.code}.highlights`) ?? []).map((h) => (
                  <li key={h} className="flex gap-2">
                    <Check className="text-primary size-4 shrink-0" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
              <dl className="mt-5 space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">قیمت پلن جدید</dt>
                  <dd>{formatNumber(o.newPrice)} تومان</dd>
                </div>
                <div className="flex justify-between font-bold">
                  <dt>مابه‌التفاوت</dt>
                  <dd>{formatNumber(o.difference)} تومان</dd>
                </div>
                <div className="text-muted-foreground flex justify-between text-xs">
                  <dt>+ مالیات بر ارزش افزوده</dt>
                  <dd>{formatNumber(Math.round((o.difference * taxPercent) / 100))} تومان</dd>
                </div>
              </dl>
              <div className="mt-5">
                <UpgradeButton
                  licenseId={data.license.id}
                  planCode={o.plan.code}
                  label={`ارتقا به ${o.plan.name}`}
                />
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
