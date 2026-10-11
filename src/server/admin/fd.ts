import "server-only";
import { toEnDigits } from "@/lib/format";
import { ActionError } from "./guard";

/** خواندن مقادیر FormData با نرمال‌سازی ارقام فارسی */
export const fd = {
  str(f: FormData, k: string, opts: { required?: string; max?: number } = {}): string {
    const v = String(f.get(k) ?? "").trim();
    if (opts.required && !v) throw new ActionError(opts.required);
    if (opts.max && v.length > opts.max) throw new ActionError(`طول «${k}» بیش از حد مجاز است.`);
    return v;
  },
  opt(f: FormData, k: string): string | null {
    const v = String(f.get(k) ?? "").trim();
    return v || null;
  },
  int(f: FormData, k: string, opts: { required?: string; min?: number } = {}): number | null {
    const raw = toEnDigits(String(f.get(k) ?? "")).replace(/[,٬\s]/g, "").trim();
    if (!raw) {
      if (opts.required) throw new ActionError(opts.required);
      return null;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n)) throw new ActionError("عدد واردشده نامعتبر است.");
    if (opts.min !== undefined && n < opts.min) throw new ActionError("عدد واردشده کمتر از حد مجاز است.");
    return n;
  },
  float(f: FormData, k: string): number | null {
    const raw = toEnDigits(String(f.get(k) ?? "")).trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) throw new ActionError("عدد واردشده نامعتبر است.");
    return n;
  },
  bool(f: FormData, k: string): boolean {
    return f.get(k) === "on" || f.get(k) === "true";
  },
  arr(f: FormData, k: string): string[] {
    return f.getAll(k).map((v) => String(v).trim()).filter(Boolean);
  },
  lines(f: FormData, k: string): string[] {
    return String(f.get(k) ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  },
  date(f: FormData, k: string): Date | null {
    const v = String(f.get(k) ?? "").trim();
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) throw new ActionError("تاریخ نامعتبر است.");
    return d;
  },
  slug(f: FormData, k: string): string {
    const v = String(f.get(k) ?? "").trim().toLowerCase();
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v)) throw new ActionError("نامک (slug) فقط حروف کوچک انگلیسی، عدد و خط تیره.");
    return v;
  },
};

/** تبدیل Date به مقدار input[type=datetime-local] */
export function toLocalInput(d: Date | null | undefined): string {
  if (!d) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
