"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useDroppable, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type KanbanCard = { id: string; status: string; title: string; subtitle: string; meta: string; badge?: string };
type Col = { key: string; label: string };

function Card({ c, overlay }: { c: KanbanCard; overlay?: boolean }) {
  return (
    <div className={cn("rounded-xl border bg-card p-3 text-sm shadow-sm", overlay && "rotate-2 shadow-xl")}>
      <div className="flex items-start gap-2">
        <Link href={`/admin/custom-orders/${c.id}`} className="min-w-0 flex-1 font-bold hover:text-primary" onPointerDown={(e) => e.stopPropagation()}>{c.title}</Link>
        {c.badge && <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">{c.badge}</span>}
      </div>
      <p className="mt-1 line-clamp-2 text-muted-foreground">{c.subtitle}</p>
      <p className="mt-2 text-xs text-muted-foreground">{c.meta}</p>
    </div>
  );
}

function SortableCard({ c }: { c: KanbanCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id, data: { status: c.status } });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners} className={cn("cursor-grab touch-none active:cursor-grabbing", isDragging && "opacity-40")} aria-roledescription="کارت قابل جابه‌جایی">
      <Card c={c} />
    </li>
  );
}

function Column({ col, cards }: { col: Col; cards: KanbanCard[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${col.key}`, data: { status: col.key } });
  return (
    <section aria-label={col.label} className={cn("flex w-72 shrink-0 flex-col rounded-2xl border bg-muted/40", isOver && "ring-2 ring-primary/40")}>
      <h2 className="flex items-center justify-between px-3 py-2.5 text-sm font-bold">
        {col.label}
        <span className="rounded-full bg-background px-2 text-xs text-muted-foreground">{cards.length.toLocaleString("fa-IR")}</span>
      </h2>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ol ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-2 p-2">
          {cards.map((c) => <SortableCard key={c.id} c={c} />)}
        </ol>
      </SortableContext>
    </section>
  );
}

/** بورد کانبان با Drag & Drop بین ستون‌ها؛ هر جابه‌جایی وضعیت را ذخیره و به مشتری پیامک می‌کند */
export function Kanban({ columns, initial, onMove }: { columns: Col[]; initial: KanbanCard[]; onMove: (id: string, status: string, orderedIds: string[]) => Promise<{ ok: boolean; message?: string }> }) {
  const router = useRouter();
  const [cards, setCards] = useState(initial);
  const [active, setActive] = useState<KanbanCard | null>(null);
  const [startStatus, setStartStatus] = useState<string | null>(null);
  const [, start] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const statusOf = (id: string | number) => (String(id).startsWith("col:") ? String(id).slice(4) : cards.find((c) => c.id === id)?.status);

  const onStart = (e: DragStartEvent) => {
    const c = cards.find((x) => x.id === e.active.id) ?? null;
    setActive(c);
    setStartStatus(c?.status ?? null);
  };
  const onOver = (e: DragOverEvent) => {
    if (!e.over) return;
    const to = statusOf(e.over.id);
    const from = statusOf(e.active.id);
    if (!to || to === from) return;
    setCards((cs) => cs.map((c) => (c.id === e.active.id ? { ...c, status: to } : c)));
  };
  const onEnd = (e: DragEndEvent) => {
    setActive(null);
    if (!e.over) return;
    const id = String(e.active.id);
    const status = statusOf(id)!;
    let next = cards;
    if (!String(e.over.id).startsWith("col:") && e.over.id !== id) {
      const a = cards.findIndex((c) => c.id === id);
      const b = cards.findIndex((c) => c.id === e.over!.id);
      next = arrayMove(cards, a, b);
      setCards(next);
    }
    const ordered = next.filter((c) => c.status === status).map((c) => c.id);
    if (status === startStatus && e.over.id === id) return;
    start(async () => {
      const r = await onMove(id, status, ordered);
      if (!r.ok) {
        toast.error(r.message ?? "خطا");
        setCards(initial);
      } else if (status !== startStatus) toast.success(r.message ?? "ذخیره شد.");
      router.refresh();
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragOver={onOver} onDragEnd={onEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => <Column key={col.key} col={col} cards={cards.filter((c) => c.status === col.key)} />)}
      </div>
      <DragOverlay>{active && <Card c={active} overlay />}</DragOverlay>
    </DndContext>
  );
}
