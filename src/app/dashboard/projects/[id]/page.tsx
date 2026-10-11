import { notFound } from "next/navigation";
import { Paperclip } from "lucide-react";
import {
  CUSTOM_ORDER_STATUS,
  PLATFORM_LABEL,
  PageTitle,
  Panel,
  StatusBadge,
} from "@/components/dashboard/ui";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { BUDGETS, PROJECT_TYPES, TIMELINES, labelOf } from "@/lib/validations/custom-order";
import { requireCustomer } from "@/server/session";

export const metadata = { title: "جزئیات سفارش" };

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCustomer(`/dashboard/projects/${id}`);
  const o = await db.customOrder.findFirst({
    where: { id, OR: [{ userId: user.id }, { mobile: user.mobile }] },
    include: { events: { orderBy: { createdAt: "desc" } }, attachments: true },
  });
  if (!o) notFound();
  const st = CUSTOM_ORDER_STATUS[o.status];
  return (
    <>
      <PageTitle
        title={`سفارش ${o.trackingCode}`}
        description={`ثبت‌شده در ${formatDate(o.createdAt)}`}
        action={<StatusBadge tone={st.tone}>{st.label}</StatusBadge>}
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Panel title="جزئیات درخواست">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">نوع پروژه</dt>
              <dd className="font-medium">
                {o.projectTypes.map((p) => labelOf(PROJECT_TYPES, p)).join("، ")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">پلتفرم‌ها</dt>
              <dd className="font-medium">
                {o.platforms.map((p) => PLATFORM_LABEL[p]).join("، ")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">بودجه</dt>
              <dd className="font-medium">{labelOf(BUDGETS, o.budgetRange)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">زمان‌بندی</dt>
              <dd className="font-medium">{labelOf(TIMELINES, o.timeline)}</dd>
            </div>
            {o.quoteAmount && (
              <div>
                <dt className="text-muted-foreground">مبلغ پیش‌فاکتور</dt>
                <dd className="text-primary font-bold">{formatNumber(o.quoteAmount)} تومان</dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">امکانات</dt>
              <dd className="font-medium">{o.features.join("، ") || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">شرح نیاز</dt>
              <dd className="leading-8 whitespace-pre-line">{o.description}</dd>
            </div>
          </dl>
          {o.attachments.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2 border-t pt-4">
              {o.attachments.map((a) => (
                <li key={a.id}>
                  <a
                    href={`/api/attachments/${a.id}`}
                    className="bg-muted inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:underline"
                    dir="ltr"
                  >
                    <Paperclip className="size-3" aria-hidden />
                    {a.alt}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="روند پیگیری">
          <ol className="relative space-y-5 border-s-2 ps-5">
            {o.events.map((e) => (
              <li key={e.id} className="relative">
                <span
                  className="bg-primary ring-card absolute -start-[1.65rem] top-1 size-3 rounded-full ring-4"
                  aria-hidden
                />
                <p className="text-sm font-bold">{CUSTOM_ORDER_STATUS[e.status].label}</p>
                {e.message && (
                  <p className="text-muted-foreground mt-1 text-sm leading-7">{e.message}</p>
                )}
                <p className="text-muted-foreground mt-1 text-xs">{formatDateTime(e.createdAt)}</p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </>
  );
}
