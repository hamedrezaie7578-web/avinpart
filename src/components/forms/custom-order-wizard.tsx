"use client";

import { useRef, useState, useTransition } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Loader2,
  Paperclip,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCustomOrder } from "@/server/actions/custom-orders";
import {
  BUDGETS,
  FEATURE_OPTIONS,
  PLATFORMS,
  PROJECT_TYPES,
  TIMELINES,
  customOrderSchema,
  labelOf,
  type CustomOrderInput,
} from "@/lib/validations/custom-order";
import { formatNumber, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS: Array<{ title: string; fields: FieldPath<CustomOrderInput>[] }> = [
  {
    title: "اطلاعات تماس",
    fields: ["contactName", "mobile", "email", "businessName", "businessField"],
  },
  { title: "نوع پروژه", fields: ["projectTypes", "platforms"] },
  { title: "شرح نیازها", fields: ["features", "description"] },
  { title: "بودجه و زمان", fields: ["budgetRange", "timeline"] },
  { title: "پیوست فایل", fields: ["attachmentIds"] },
  { title: "بازبینی و ثبت", fields: [] },
];

const input =
  "h-12 w-full rounded-xl border bg-background px-4 text-base outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 aria-invalid:border-destructive";
const choice =
  "flex cursor-pointer items-center gap-3 rounded-xl border bg-background p-3.5 text-sm font-medium transition hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-accent has-[:checked]:text-accent-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring";

type Uploaded = { id: string; name: string; size: number };

function Err({ msg, id }: { msg?: string; id?: string }) {
  return msg ? (
    <p id={id} className="text-destructive mt-1.5 text-sm">
      {msg}
    </p>
  ) : null;
}

/** فرم چندمرحله‌ای سفارش نرم‌افزار اختصاصی / طراحی سایت */
export function CustomOrderWizard({
  type = "CUSTOM_SOFTWARE",
}: {
  type?: "CUSTOM_SOFTWARE" | "WEBSITE";
}) {
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<Uploaded[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  const form = useForm<CustomOrderInput>({
    resolver: zodResolver(customOrderSchema),
    mode: "onTouched",
    defaultValues: {
      type,
      contactName: "",
      mobile: "",
      email: "",
      businessName: "",
      businessField: "",
      projectTypes: type === "WEBSITE" ? ["website"] : [],
      platforms: type === "WEBSITE" ? ["WEB"] : [],
      features: [],
      description: "",
      attachmentIds: [],
      website: "",
    },
  });
  const { register, formState, trigger, setValue, watch } = form;
  const errors = formState.errors;

  const goTo = (s: number) => {
    setStep(s);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const next = async () => {
    if (await trigger(STEPS[step]!.fields, { shouldFocus: true })) goTo(step + 1);
  };

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    setUploadError(null);
    if (files.length + list.length > 5)
      return setUploadError("حداکثر ۵ فایل می‌توانید پیوست کنید.");
    const fd = new FormData();
    Array.from(list).forEach((f) => fd.append("files", f));
    setUploading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { files?: Uploaded[]; error?: string };
      if (!res.ok || !json.files) throw new Error(json.error ?? "آپلود ناموفق بود.");
      const all = [...files, ...json.files];
      setFiles(all);
      setValue(
        "attachmentIds",
        all.map((f) => f.id),
      );
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "آپلود ناموفق بود.");
    } finally {
      setUploading(false);
    }
  }

  const submit = form.handleSubmit((values) => {
    setServerError(null);
    start(async () => {
      const r = await createCustomOrder(values);
      if (r.ok && r.trackingCode) setDone(r.trackingCode);
      else setServerError(r.message);
    });
  });

  if (done) {
    return (
      <div role="status" className="bg-card rounded-3xl border p-8 text-center md:p-12">
        <CheckCircle2 className="text-success mx-auto size-16" aria-hidden />
        <h3 className="mt-5 text-2xl font-extrabold">درخواست شما ثبت شد</h3>
        <p className="text-muted-foreground mt-3 leading-8">کد پیگیری شما (برایتان پیامک هم شد):</p>
        <p
          className="bg-accent text-accent-foreground mx-auto mt-3 w-fit rounded-xl px-6 py-3 text-2xl font-black tracking-wider"
          dir="ltr"
        >
          {done}
        </p>
        <p className="text-muted-foreground mt-6 leading-8">
          کارشناسان ما حداکثر تا یک روز کاری برای جلسه‌ی نیازسنجی رایگان با شما تماس می‌گیرند. وضعیت
          سفارش را بعد از ورود با همین شماره موبایل در{" "}
          <Link href="/dashboard/projects" className="text-primary font-bold hover:underline">
            پنل کاربری
          </Link>{" "}
          ببینید.
        </p>
      </div>
    );
  }

  const v = watch();

  return (
    <div ref={topRef} className="bg-card scroll-mt-24 rounded-3xl border p-5 shadow-xl md:p-8">
      {/* نوار مراحل */}
      <ol className="mb-8 grid grid-cols-6 gap-1.5" aria-label="مراحل فرم">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className="flex flex-col items-center gap-2 text-center"
            aria-current={i === step ? "step" : undefined}
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold transition",
                i < step && "border-primary bg-primary text-primary-foreground",
                i === step && "border-primary text-primary",
                i > step && "text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-4" aria-hidden /> : toFaDigits(i + 1)}
            </span>
            <span
              className={cn(
                "hidden text-xs sm:block",
                i === step ? "font-bold" : "text-muted-foreground",
              )}
            >
              {s.title}
            </span>
          </li>
        ))}
      </ol>
      <h3 className="mb-6 text-xl font-extrabold">
        مرحله‌ی {toFaDigits(step + 1)} از {toFaDigits(STEPS.length)}: {STEPS[step]!.title}
      </h3>

      <form onSubmit={(e) => e.preventDefault()} noValidate>
        <input
          type="text"
          {...register("website")}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden
        />

        {step === 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="co-name" className="mb-1.5 block text-sm font-medium">
                نام و نام خانوادگی *
              </label>
              <input
                id="co-name"
                autoComplete="name"
                className={input}
                aria-invalid={!!errors.contactName}
                {...register("contactName")}
              />
              <Err msg={errors.contactName?.message} />
            </div>
            <div>
              <label htmlFor="co-mobile" className="mb-1.5 block text-sm font-medium">
                شماره موبایل *
              </label>
              <input
                id="co-mobile"
                inputMode="tel"
                autoComplete="tel"
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className={input}
                aria-invalid={!!errors.mobile}
                {...register("mobile")}
              />
              <Err msg={errors.mobile?.message} />
            </div>
            <div>
              <label htmlFor="co-email" className="mb-1.5 block text-sm font-medium">
                ایمیل <span className="text-muted-foreground">(اختیاری)</span>
              </label>
              <input
                id="co-email"
                type="email"
                dir="ltr"
                autoComplete="email"
                className={input}
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <Err msg={errors.email?.message} />
            </div>
            <div>
              <label htmlFor="co-biz" className="mb-1.5 block text-sm font-medium">
                نام شرکت / کسب‌وکار <span className="text-muted-foreground">(اختیاری)</span>
              </label>
              <input
                id="co-biz"
                autoComplete="organization"
                className={input}
                {...register("businessName")}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="co-field" className="mb-1.5 block text-sm font-medium">
                حوزه‌ی فعالیت *
              </label>
              <input
                id="co-field"
                placeholder="مثلاً: تولید قطعات صنعتی، زنجیره‌ی فروشگاهی، کلینیک زیبایی…"
                className={input}
                aria-invalid={!!errors.businessField}
                {...register("businessField")}
              />
              <Err msg={errors.businessField?.message} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-7">
            <fieldset>
              <legend className="mb-3 font-bold">چه چیزی می‌خواهید بسازیم؟ *</legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {PROJECT_TYPES.map((p) => (
                  <label key={p.value} className={choice}>
                    <input
                      type="checkbox"
                      value={p.value}
                      className="size-4 accent-[var(--primary)]"
                      {...register("projectTypes")}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
              <Err msg={errors.projectTypes?.message} />
            </fieldset>
            <fieldset>
              <legend className="mb-3 font-bold">روی چه پلتفرم‌هایی؟ *</legend>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {PLATFORMS.map((p) => (
                  <label key={p.value} className={cn(choice, "justify-center")}>
                    <input
                      type="checkbox"
                      value={p.value}
                      className="size-4 accent-[var(--primary)]"
                      {...register("platforms")}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
              <Err msg={errors.platforms?.message} />
            </fieldset>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-7">
            <fieldset>
              <legend className="mb-3 font-bold">
                امکانات موردنیاز{" "}
                <span className="text-muted-foreground font-normal">(هر چند مورد که لازم است)</span>
              </legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {FEATURE_OPTIONS.map((f) => (
                  <label key={f} className={choice}>
                    <input
                      type="checkbox"
                      value={f}
                      className="size-4 accent-[var(--primary)]"
                      {...register("features")}
                    />
                    {f}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="co-desc" className="mb-1.5 block font-bold">
                نیازتان را با زبان خودتان توضیح دهید *
              </label>
              <p id="co-desc-hint" className="text-muted-foreground mb-2 text-sm">
                چه مشکلی دارید، الان کار را چطور انجام می‌دهید، چند نفر از نرم‌افزار استفاده می‌کنند
                و چه نتیجه‌ای انتظار دارید؟
              </p>
              <textarea
                id="co-desc"
                rows={7}
                aria-describedby="co-desc-hint"
                aria-invalid={!!errors.description}
                className="bg-background focus:border-primary focus:ring-primary/15 aria-invalid:border-destructive w-full rounded-xl border p-4 text-base leading-8 outline-none focus:ring-4"
                {...register("description")}
              />
              <div className="flex justify-between">
                <Err msg={errors.description?.message} />
                <span className="text-muted-foreground ms-auto mt-1.5 text-xs">
                  {toFaDigits(v.description?.length ?? 0)} / ۵۰۰۰
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-7">
            <fieldset>
              <legend className="mb-3 font-bold">بودجه‌ی تقریبی *</legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {BUDGETS.map((b) => (
                  <label key={b.value} className={choice}>
                    <input
                      type="radio"
                      value={b.value}
                      className="size-4 accent-[var(--primary)]"
                      {...register("budgetRange")}
                    />
                    {b.label}
                  </label>
                ))}
              </div>
              <Err msg={errors.budgetRange?.message} />
            </fieldset>
            <fieldset>
              <legend className="mb-3 font-bold">زمان‌بندی موردنظر *</legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {TIMELINES.map((t) => (
                  <label key={t.value} className={choice}>
                    <input
                      type="radio"
                      value={t.value}
                      className="size-4 accent-[var(--primary)]"
                      {...register("timeline")}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
              <Err msg={errors.timeline?.message} />
            </fieldset>
          </div>
        )}

        {step === 4 && (
          <div>
            <p className="text-muted-foreground mb-4 leading-7">
              اگر مستندات، فرم‌های فعلی، نمونه‌ی گزارش یا فایل اکسلی دارید که به درک نیازتان کمک
              می‌کند، اینجا پیوست کنید. این مرحله اختیاری است.
            </p>
            <label
              htmlFor="co-files"
              className={cn(
                "hover:border-primary hover:bg-accent/40 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition",
                uploading && "pointer-events-none opacity-60",
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void upload(e.dataTransfer.files);
              }}
            >
              {uploading ? (
                <Loader2 className="text-primary size-10 animate-spin" aria-hidden />
              ) : (
                <FileUp className="text-primary size-10" aria-hidden />
              )}
              <span className="mt-3 font-bold">
                {uploading ? "در حال آپلود…" : "فایل‌ها را اینجا رها کنید یا کلیک کنید"}
              </span>
              <span className="text-muted-foreground mt-1 text-sm">
                PDF، تصویر، Word، Excel یا ZIP — حداکثر ۵ فایل، هرکدام ۱۰ مگابایت
              </span>
              <input
                id="co-files"
                type="file"
                multiple
                className="sr-only"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.doc,.docx,.xls,.xlsx,.txt"
                onChange={(e) => void upload(e.target.files)}
              />
            </label>
            {uploadError && (
              <p role="alert" className="text-destructive mt-3 text-sm">
                {uploadError}
              </p>
            )}
            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                    <Paperclip className="text-muted-foreground size-4" aria-hidden />
                    <span className="flex-1 truncate" dir="ltr">
                      {f.name}
                    </span>
                    <span className="text-muted-foreground">
                      {formatNumber(Math.ceil(f.size / 1024))} KB
                    </span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg p-1.5"
                      aria-label={`حذف ${f.name}`}
                      onClick={() => {
                        const rest = files.filter((x) => x.id !== f.id);
                        setFiles(rest);
                        setValue(
                          "attachmentIds",
                          rest.map((x) => x.id),
                        );
                      }}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 5 && (
          <dl className="divide-y rounded-2xl border">
            {(
              [
                ["نام", v.contactName],
                ["موبایل", v.mobile],
                ["ایمیل", v.email || "—"],
                ["کسب‌وکار", [v.businessName, v.businessField].filter(Boolean).join(" — ")],
                [
                  "نوع پروژه",
                  (v.projectTypes ?? []).map((p) => labelOf(PROJECT_TYPES, p)).join("، "),
                ],
                ["پلتفرم‌ها", (v.platforms ?? []).map((p) => labelOf(PLATFORMS, p)).join("، ")],
                ["امکانات", (v.features ?? []).join("، ") || "—"],
                ["شرح نیاز", v.description],
                ["بودجه", v.budgetRange ? labelOf(BUDGETS, v.budgetRange) : "—"],
                ["زمان‌بندی", v.timeline ? labelOf(TIMELINES, v.timeline) : "—"],
                ["پیوست‌ها", files.length ? `${toFaDigits(files.length)} فایل` : "ندارد"],
              ] as const
            ).map(([k, val]) => (
              <div key={k} className="grid gap-1 p-4 sm:grid-cols-[8rem_1fr]">
                <dt className="text-muted-foreground text-sm font-bold">{k}</dt>
                <dd className="leading-7 whitespace-pre-line">{val}</dd>
              </div>
            ))}
          </dl>
        )}

        {serverError && (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive mt-5 rounded-xl p-3 text-sm"
          >
            {serverError}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t pt-6">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl px-5"
              onClick={() => goTo(step - 1)}
            >
              <ChevronRight className="size-4" aria-hidden />
              مرحله‌ی قبل
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              className="h-12 rounded-xl px-6 font-bold"
              onClick={next}
              disabled={uploading}
            >
              {step === 4 && !files.length ? "رد شدن از این مرحله" : "مرحله‌ی بعد"}
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              type="button"
              className="h-12 rounded-xl px-8 font-bold"
              onClick={submit}
              disabled={pending}
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {pending ? "در حال ثبت…" : "ثبت نهایی درخواست"}
            </Button>
          )}
        </div>
        <p className="text-muted-foreground mt-4 text-center text-xs">
          اطلاعات شما محرمانه است و فقط برای بررسی پروژه استفاده می‌شود. ثبت درخواست و جلسه‌ی
          نیازسنجی رایگان است.
        </p>
      </form>
    </div>
  );
}
