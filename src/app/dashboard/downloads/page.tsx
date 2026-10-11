import Link from "next/link";
import { Download, Globe, Monitor, Smartphone } from "lucide-react";
import { EmptyState } from "@/components/design-system/empty-state";
import { Button } from "@/components/ui/button";
import { PLATFORM_LABEL, PageTitle, Panel } from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireCustomer } from "@/server/session";

export const metadata = { title: "دانلودها" };

const ICON = { WINDOWS: Monitor, ANDROID: Smartphone, WEB: Globe, IOS: Smartphone } as const;

export default async function DownloadsPage() {
  const user = await requireCustomer("/dashboard/downloads");
  const licenses = await db.license.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: { product: true, plan: true },
  });

  const sections = await Promise.all(
    licenses.map(async (l) => {
      const platforms = l.plan.platforms.filter((p) => p !== "WEB");
      const releases = await Promise.all(
        platforms.map((platform) =>
          db.release.findFirst({
            where: {
              isPublished: true,
              isDemo: false,
              platform,
              OR: [{ productId: l.productId }, { productId: null }],
            },
            orderBy: { createdAt: "desc" },
          }),
        ),
      );
      return {
        license: l,
        items: platforms.map((p, i) => ({ platform: p, release: releases[i] })),
      };
    }),
  );

  return (
    <>
      <PageTitle
        title="دانلود نرم‌افزارها"
        description="آخرین نسخه‌ی نرم‌افزارهای شما بر اساس پلن خریداری‌شده."
      />
      {!sections.length ? (
        <EmptyState
          icon="Download"
          title="لایسنس فعالی ندارید"
          description="پس از خرید، فایل‌های نصب اینجا در دسترس است."
          action={
            <Button asChild className="rounded-xl">
              <Link href="/download">نسخه‌ی دموی رایگان</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {sections.map(({ license: l, items }) => (
            <Panel key={l.id} title={`${l.product.name} — ${l.plan.name}`}>
              <ul className="grid gap-3 sm:grid-cols-2">
                {items.map(({ platform, release }) => {
                  const I = ICON[platform];
                  return (
                    <li key={platform} className="flex items-center gap-3 rounded-xl border p-4">
                      <I className="text-primary size-7" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">نسخه‌ی {PLATFORM_LABEL[platform]}</p>
                        <p
                          className="text-muted-foreground text-xs"
                          dir={release ? "ltr" : undefined}
                          style={{ textAlign: "right" }}
                        >
                          {release
                            ? `v${release.version} · ${formatDate(release.createdAt)}`
                            : "به‌زودی منتشر می‌شود"}
                        </p>
                      </div>
                      {release && (
                        <Button asChild size="sm" className="rounded-lg">
                          <a href={`/api/download/${release.id}`}>
                            <Download className="size-4" aria-hidden />
                            دانلود
                          </a>
                        </Button>
                      )}
                    </li>
                  );
                })}
                {l.plan.platforms.includes("WEB") && (
                  <li className="flex items-center gap-3 rounded-xl border p-4">
                    <Globe className="text-primary size-7" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">نسخه‌ی تحت وب</p>
                      <p className="text-muted-foreground text-xs">
                        {l.webUrl
                          ? "بدون نصب، از هر مرورگری"
                          : "لینک ورود پس از راه‌اندازی توسط پشتیبانی فعال می‌شود"}
                      </p>
                    </div>
                    {l.webUrl && (
                      <Button asChild size="sm" variant="outline" className="rounded-lg">
                        <a href={l.webUrl} target="_blank" rel="noopener noreferrer">
                          ورود
                        </a>
                      </Button>
                    )}
                  </li>
                )}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
