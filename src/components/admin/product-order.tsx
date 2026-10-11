"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Item = { id: string; name: string; industryName: string; categoryId: string | null };

function Row({ item, cats, onCat }: { item: Item; cats: Array<{ id: string; name: string }>; onCat: (c: string | null) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-2 rounded-xl border bg-card p-2 ${isDragging ? "z-10 shadow-lg" : ""}`}>
      <button type="button" {...attributes} {...listeners} className="cursor-grab rounded p-1 text-muted-foreground hover:bg-accent" aria-label={`جابه‌جایی ${item.name}`}><GripVertical className="size-4" /></button>
      <span className="min-w-0 flex-1 truncate text-sm"><b>{item.name}</b> <span className="text-muted-foreground">— {item.industryName}</span></span>
      <select value={item.categoryId ?? ""} onChange={(e) => onCat(e.target.value || null)} aria-label={`دسته‌ی ${item.name}`} className="h-8 rounded-lg border bg-background px-2 text-xs">
        <option value="">بدون دسته</option>
        {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </li>
  );
}

/** مرتب‌سازی Drag & Drop محصولات (ترتیب نمایش در منو و صفحه‌ی محصولات) و تعیین دسته */
export function ProductOrder({ initial, cats, action }: { initial: Item[]; cats: Array<{ id: string; name: string }>; action: (f: FormData) => Promise<{ ok: boolean; message?: string }> }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setItems((xs) => arrayMove(xs, xs.findIndex((x) => x.id === e.active.id), xs.findIndex((x) => x.id === e.over!.id)));
    setDirty(true);
  };
  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {items.map((it) => (
              <Row key={it.id} item={it} cats={cats} onCat={(c) => { setItems(items.map((x) => (x.id === it.id ? { ...x, categoryId: c } : x))); setDirty(true); }} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <div className="mt-4 flex justify-end">
        <Button
          disabled={!dirty || pending}
          className="h-10 rounded-xl px-6 font-bold"
          onClick={() =>
            start(async () => {
              const f = new FormData();
              f.set("payload", JSON.stringify(items.map((i) => ({ id: i.id, categoryId: i.categoryId }))));
              const r = await action(f);
              if (!r.ok) return void toast.error(r.message ?? "خطا");
              toast.success(r.message ?? "ذخیره شد.");
              setDirty(false);
              router.refresh();
            })
          }
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          ذخیره‌ی ترتیب
        </Button>
      </div>
    </div>
  );
}
