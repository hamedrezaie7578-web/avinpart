"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition, type ReactNode } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Result = { ok: boolean; message?: string; data?: unknown };

/**
 * فرم عمومی پنل: FormData را به Server Action می‌دهد، نتیجه را toast می‌کند
 * و در صورت نیاز به مسیر دیگری هدایت یا صفحه را refresh می‌کند.
 */
export function ActionForm({
  action,
  children,
  submitLabel = "ذخیره",
  redirectTo,
  resetOnSuccess,
  className,
  footer = true,
}: {
  action: (fd: FormData) => Promise<Result>;
  children: ReactNode;
  submitLabel?: string;
  redirectTo?: string | ((data: unknown) => string);
  resetOnSuccess?: boolean;
  className?: string;
  footer?: boolean;
}) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  return (
    <form
      ref={ref}
      className={cn("grid gap-4", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await action(fd);
          if (!r.ok) return void toast.error(r.message ?? "خطا");
          toast.success(r.message ?? "ذخیره شد.");
          if (resetOnSuccess) ref.current?.reset();
          if (redirectTo) router.push(typeof redirectTo === "function" ? redirectTo(r.data) : redirectTo);
          else router.refresh();
        });
      }}
    >
      {children}
      {footer && (
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="h-10 rounded-xl px-6 font-bold">
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}

/** دکمه‌ی اجرای یک Server Action (مثل حذف یا تغییر وضعیت) با تأیید اختیاری */
export function ActionButton({
  action,
  children,
  confirm: confirmText,
  variant = "outline",
  size = "sm",
  redirectTo,
  className,
}: {
  action: () => Promise<Result>;
  children: ReactNode;
  confirm?: string;
  variant?: "outline" | "default" | "destructive" | "ghost";
  size?: "sm" | "default";
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={pending}
      className={cn("rounded-lg", className)}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        start(async () => {
          const r = await action();
          if (!r.ok) return void toast.error(r.message ?? "خطا");
          toast.success(r.message ?? "انجام شد.");
          if (redirectTo) router.push(redirectTo);
          else router.refresh();
        });
      }}
    >
      {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}

export function DeleteButton({ action, redirectTo, label = "حذف" }: { action: () => Promise<Result>; redirectTo?: string; label?: string }) {
  return (
    <ActionButton action={action} redirectTo={redirectTo} confirm="از حذف این مورد مطمئن هستید؟ این کار قابل بازگشت نیست." variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
      <Trash2 className="size-4" aria-hidden />
      {label}
    </ActionButton>
  );
}

const inputCls = "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

export function Field({ label, name, hint, className, ...rest }: { label: string; name: string; hint?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="mb-1.5 block text-sm font-medium">{label}</label>
      <input id={`f-${name}`} name={name} className={inputCls} {...rest} />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, name, hint, className, rows = 4, ...rest }: { label: string; name: string; hint?: string; className?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="mb-1.5 block text-sm font-medium">{label}</label>
      <textarea id={`f-${name}`} name={name} rows={rows} className={cn(inputCls, "h-auto py-2 leading-7")} {...rest} />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Select({ label, name, options, className, hint, ...rest }: { label: string; name: string; options: Array<{ value: string; label: string }>; className?: string; hint?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="mb-1.5 block text-sm font-medium">{label}</label>
      <select id={`f-${name}`} name={name} className={inputCls} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Check({ label, name, defaultChecked, value = "on", hint }: { label: string; name: string; defaultChecked?: boolean; value?: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-[var(--primary)]" />
      <span>
        {label}
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}
