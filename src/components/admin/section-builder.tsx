"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Copy, Eye, EyeOff, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SECTION_LABELS, sectionSchemas, type SectionType } from "@/lib/sections";
import { cn } from "@/lib/utils";
import { ListEditor, type ListRow } from "./list-editor";

export type BuilderSection = { key: string; type: SectionType; enabled: boolean; data: Record<string, unknown> };

type FieldKind = "text" | "textarea" | "url" | "cta" | "strings" | "items" | "stats" | "bool" | "html" | "json";
type Spec = { key: string; label: string; kind: FieldKind; optional?: boolean };

const T = (key: string, label: string, optional = true): Spec => ({ key, label, kind: "text", optional });
const D = (key = "description", label = "توضیح"): Spec => ({ key, label, kind: "textarea", optional: true });

/** فرم هر نوع سکشن؛ هم‌راستا با sectionSchemas */
const SPECS: Record<SectionType, Spec[]> = {
  HERO: [
    T("eyebrow", "برچسب بالای عنوان"),
    T("title", "عنوان", false),
    T("highlight", "بخش برجسته‌ی عنوان"),
    { key: "subtitle", label: "زیرعنوان", kind: "textarea" },
    { key: "primaryCta", label: "دکمه‌ی اصلی", kind: "cta", optional: true },
    { key: "secondaryCta", label: "دکمه‌ی دوم", kind: "cta", optional: true },
    { key: "bullets", label: "نکات کوتاه (هر خط یک مورد)", kind: "strings" },
    { key: "mockup", label: "داده‌ی ماکاپ داشبورد (JSON، اختیاری)", kind: "json", optional: true },
  ],
  PAIN_POINTS: [T("eyebrow", "برچسب"), T("title", "عنوان", false), D(), { key: "items", label: "دردها", kind: "items" }],
  FEATURES: [T("eyebrow", "برچسب"), T("title", "عنوان", false), D()],
  MODULES: [T("eyebrow", "برچسب"), T("title", "عنوان", false), D(), { key: "items", label: "ماژول‌ها (خالی = ماژول‌های پیش‌فرض)", kind: "items", optional: true }],
  PLATFORMS: [T("title", "عنوان", false), D()],
  GALLERY: [T("title", "عنوان", false), D()],
  PRICING: [T("eyebrow", "برچسب"), T("title", "عنوان", false), D()],
  STATS: [T("title", "عنوان"), { key: "items", label: "آمار (خالی = آمار عمومی سایت)", kind: "stats", optional: true }],
  TESTIMONIALS: [T("title", "عنوان", false), D()],
  VIDEO: [T("title", "عنوان", false), D(), { key: "embedUrl", label: "آدرس embed (آپارات/یوتیوب)", kind: "url" }],
  FAQ: [T("title", "عنوان", false), D()],
  CTA: [T("title", "عنوان", false), D(), { key: "withForm", label: "نمایش فرم درخواست دمو", kind: "bool" }],
  RELATED: [T("title", "عنوان", false)],
  RICH_TEXT: [T("title", "عنوان"), { key: "html", label: "متن (HTML ساده)", kind: "html" }],
};

const HINTS: Partial<Record<SectionType, string>> = {
  FEATURES: "کارت‌ها از تب «امکانات» خوانده می‌شوند.",
  GALLERY: "تصاویر از تب «گالری» خوانده می‌شوند.",
  PRICING: "قیمت‌ها از پلن‌ها و تب «قیمت» خوانده می‌شوند.",
  TESTIMONIALS: "نظرات از تب «نظرات» خوانده می‌شوند.",
  FAQ: "سؤالات از تب «FAQ» خوانده می‌شوند.",
  RELATED: "محصولات مرتبط از تب «اطلاعات کلی» و مقالات از وبلاگ (برچسب محصول) خوانده می‌شوند.",
};

function blankData(type: SectionType): Record<string, unknown> {
  const d: Record<string, unknown> = { title: SECTION_LABELS[type] };
  if (type === "HERO") Object.assign(d, { subtitle: "", bullets: [] });
  if (type === "PAIN_POINTS") d.items = [];
  if (type === "CTA") d.withForm = true;
  if (type === "VIDEO") d.embedUrl = "https://www.aparat.com/video/video/embed/videohash/xxxx/vt/frame";
  if (type === "RICH_TEXT") d.html = "<p></p>";
  return d;
}

/** پاک‌سازی رشته‌های خالیِ فیلدهای اختیاری قبل از ارسال */
function clean(type: SectionType, data: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const s of SPECS[type]) {
    const v = data[s.key];
    if (s.optional && (v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length))) continue;
    if (s.kind === "cta") {
      const c = v as { label?: string; href?: string } | undefined;
      if (!c?.label || !c?.href) continue;
    }
    out[s.key] = v;
  }
  return out;
}

const input = "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

function FieldEditor({ spec, value, onChange, id }: { spec: Spec; value: unknown; onChange: (v: unknown) => void; id: string }) {
  const label = (
    <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
      {spec.label}
      {!spec.optional && <span className="text-destructive"> *</span>}
    </label>
  );
  switch (spec.kind) {
    case "text":
    case "url":
      return <div>{label}<input id={id} value={String(value ?? "")} dir={spec.kind === "url" ? "ltr" : undefined} onChange={(e) => onChange(e.target.value)} className={input} /></div>;
    case "textarea":
      return <div className="sm:col-span-2">{label}<textarea id={id} value={String(value ?? "")} rows={3} onChange={(e) => onChange(e.target.value)} className={cn(input, "h-auto py-2 leading-7")} /></div>;
    case "html":
      return <div className="sm:col-span-2">{label}<textarea id={id} value={String(value ?? "")} rows={10} dir="ltr" onChange={(e) => onChange(e.target.value)} className={cn(input, "h-auto py-2 font-mono text-xs leading-6")} /><p className="mt-1 text-xs text-muted-foreground">تگ‌های مجاز: p, h2, h3, ul, ol, li, strong, em, a, blockquote, img — بقیه هنگام ذخیره حذف می‌شوند.</p></div>;
    case "bool":
      return <label className="flex items-center gap-2 text-sm sm:col-span-2"><input id={id} type="checkbox" checked={value !== false} onChange={(e) => onChange(e.target.checked)} className="size-4" />{spec.label}</label>;
    case "strings":
      return <div className="sm:col-span-2">{label}<textarea id={id} rows={4} value={((value as string[]) ?? []).join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} onBlur={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} className={cn(input, "h-auto py-2 leading-7")} /></div>;
    case "cta": {
      const c = (value as { label?: string; href?: string }) ?? {};
      return (
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="mb-1 text-xs font-medium text-muted-foreground">{spec.label}</legend>
          <input aria-label={`${spec.label} — متن`} placeholder="متن دکمه" value={c.label ?? ""} onChange={(e) => onChange({ ...c, label: e.target.value })} className={input} />
          <input aria-label={`${spec.label} — لینک`} placeholder="/contact#demo" dir="ltr" value={c.href ?? ""} onChange={(e) => onChange({ ...c, href: e.target.value })} className={input} />
        </fieldset>
      );
    }
    case "items":
      return (
        <div className="sm:col-span-2">
          <p className="mb-2 text-xs font-medium text-muted-foreground">{spec.label}</p>
          <ListEditor fields={[{ key: "icon", label: "آیکون", type: "icon" }, { key: "title", label: "عنوان" }, { key: "description", label: "توضیح", type: "textarea" }]} value={(value as ListRow[]) ?? []} onChange={onChange} />
        </div>
      );
    case "stats":
      return (
        <div className="sm:col-span-2">
          <p className="mb-2 text-xs font-medium text-muted-foreground">{spec.label}</p>
          <ListEditor fields={[{ key: "value", label: "عدد", type: "number" }, { key: "suffix", label: "پسوند (+، ٪، …)" }, { key: "label", label: "برچسب", width: "full" }]} value={(value as ListRow[]) ?? []} onChange={onChange} empty={{ value: 0, suffix: "+", label: "" }} />
        </div>
      );
    case "json":
      return <JsonField id={id} label={label} value={value} onChange={onChange} />;
  }
}

function JsonField({ id, label, value, onChange }: { id: string; label: React.ReactNode; value: unknown; onChange: (v: unknown) => void }) {
  const [text, setText] = useState(value === undefined ? "" : JSON.stringify(value, null, 2));
  const [err, setErr] = useState(false);
  return (
    <div className="sm:col-span-2">
      {label}
      <textarea
        id={id}
        rows={6}
        dir="ltr"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (!e.target.value.trim()) return setErr(false), onChange(undefined);
          try {
            onChange(JSON.parse(e.target.value));
            setErr(false);
          } catch {
            setErr(true);
          }
        }}
        className={cn(input, "h-auto py-2 font-mono text-xs leading-6", err && "border-destructive")}
        aria-invalid={err}
      />
      {err && <p className="mt-1 text-xs text-destructive">JSON نامعتبر است.</p>}
    </div>
  );
}

function SortableCard({ s, index, open, onToggleOpen, onChange, onRemove, onDuplicate }: { s: BuilderSection; index: number; open: boolean; onToggleOpen: () => void; onChange: (s: BuilderSection) => void; onRemove: () => void; onDuplicate: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.key });
  const valid = sectionSchemas[s.type].safeParse(clean(s.type, s.data)).success;
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("rounded-2xl border bg-card", isDragging && "z-10 shadow-xl", !s.enabled && "opacity-60")}>
      <div className="flex items-center gap-2 p-3">
        <button type="button" {...attributes} {...listeners} className="cursor-grab rounded p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing" aria-label={`جابه‌جایی سکشن ${index + 1}`}>
          <GripVertical className="size-5" />
        </button>
        <button type="button" onClick={onToggleOpen} className="flex min-w-0 flex-1 items-center gap-2 text-start" aria-expanded={open}>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-bold">{SECTION_LABELS[s.type]}</span>
          <span className="truncate text-sm">{String(s.data.title ?? "")}</span>
          {!valid && <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">ناقص</span>}
          <ChevronDown className={cn("ms-auto size-4 shrink-0 transition", open && "rotate-180")} aria-hidden />
        </button>
        <button type="button" onClick={() => onChange({ ...s, enabled: !s.enabled })} className="rounded p-1.5 hover:bg-accent" aria-label={s.enabled ? "غیرفعال کردن" : "فعال کردن"} title={s.enabled ? "فعال" : "غیرفعال"}>
          {s.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
        <button type="button" onClick={onDuplicate} className="rounded p-1.5 hover:bg-accent" aria-label="کپی سکشن"><Copy className="size-4" /></button>
        <button type="button" onClick={() => window.confirm("این سکشن حذف شود؟") && onRemove()} className="rounded p-1.5 text-destructive hover:bg-destructive/10" aria-label="حذف سکشن"><Trash2 className="size-4" /></button>
      </div>
      {open && (
        <div className="grid gap-3 border-t p-4 sm:grid-cols-2">
          {HINTS[s.type] && <p className="rounded-lg bg-primary/10 p-2 text-xs text-primary sm:col-span-2">{HINTS[s.type]}</p>}
          {SPECS[s.type].map((spec) => (
            <FieldEditor key={spec.key} id={`${s.key}-${spec.key}`} spec={spec} value={s.data[spec.key]} onChange={(v) => onChange({ ...s, data: { ...s.data, [spec.key]: v } })} />
          ))}
        </div>
      )}
    </li>
  );
}

let seq = 0;
const newKey = () => `n${Date.now().toString(36)}${seq++}`;

/**
 * Section builder: افزودن، حذف، فعال/غیرفعال، کپی و مرتب‌سازی Drag & Drop سکشن‌های لندینگ.
 * کل فهرست یک‌جا ذخیره می‌شود و سرور هر سکشن را با اسکیمای Zod همان نوع اعتبارسنجی می‌کند.
 */
export function SectionBuilder({ initial, action, previewHref }: { initial: BuilderSection[]; action: (f: FormData) => Promise<{ ok: boolean; message?: string }>; previewHref?: string }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [addType, setAddType] = useState<SectionType>("RICH_TEXT");
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const update = (next: BuilderSection[]) => {
    setItems(next);
    setDirty(true);
  };
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((i) => i.key === e.active.id);
    const to = items.findIndex((i) => i.key === e.over!.id);
    update(arrayMove(items, from, to));
  };
  const save = () =>
    start(async () => {
      const f = new FormData();
      f.set("payload", JSON.stringify(items.map((s) => ({ type: s.type, enabled: s.enabled, data: clean(s.type, s.data) }))));
      const r = await action(f);
      if (!r.ok) return void toast.error(r.message ?? "خطا");
      toast.success(r.message ?? "ذخیره شد.");
      setDirty(false);
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-3">
        <label htmlFor="add-section" className="sr-only">نوع سکشن</label>
        <select id="add-section" value={addType} onChange={(e) => setAddType(e.target.value as SectionType)} className={cn(input, "w-auto")}>
          {(Object.keys(SECTION_LABELS) as SectionType[]).map((t) => <option key={t} value={t}>{SECTION_LABELS[t]}</option>)}
        </select>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl"
          onClick={() => {
            const key = newKey();
            update([...items, { key, type: addType, enabled: true, data: blankData(addType) }]);
            setOpen(key);
          }}
        >
          <Plus className="size-4" aria-hidden />
          افزودن سکشن
        </Button>
        <span className="ms-auto text-xs text-muted-foreground">{dirty ? "تغییرات ذخیره نشده" : "همه‌چیز ذخیره است"}</span>
        {previewHref && <Button asChild variant="ghost" className="h-10 rounded-xl"><a href={previewHref} target="_blank" rel="noreferrer">پیش‌نمایش</a></Button>}
        <Button type="button" onClick={save} disabled={pending || !dirty} className="h-10 rounded-xl px-6 font-bold">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          ذخیره‌ی سکشن‌ها
        </Button>
      </div>
      {!items.length && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">هنوز سکشنی ندارد؛ صفحه با چیدمان پیش‌فرض نمایش داده می‌شود.</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-3">
            {items.map((s, i) => (
              <SortableCard
                key={s.key}
                s={s}
                index={i}
                open={open === s.key}
                onToggleOpen={() => setOpen(open === s.key ? null : s.key)}
                onChange={(n) => update(items.map((x) => (x.key === s.key ? n : x)))}
                onRemove={() => update(items.filter((x) => x.key !== s.key))}
                onDuplicate={() => {
                  const copy = { ...s, key: newKey(), data: structuredClone(s.data) };
                  update([...items.slice(0, i + 1), copy, ...items.slice(i + 1)]);
                }}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}
