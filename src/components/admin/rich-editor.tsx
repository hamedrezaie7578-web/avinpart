"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Heading2, Heading3, ImageIcon, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2, Minus, Code } from "lucide-react";
import { cn } from "@/lib/utils";

function Btn({ on, active, label, children }: { on: () => void; active?: boolean; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={on} aria-label={label} title={label} aria-pressed={active} className={cn("rounded-md p-1.5 hover:bg-accent", active && "bg-accent text-accent-foreground")}>
      {children}
    </button>
  );
}

function Toolbar({ editor, onPickImage }: { editor: Editor; onPickImage?: () => Promise<{ url: string; alt: string } | null> }) {
  const link = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("آدرس لینک (برای حذف خالی بگذارید):", prev ?? "https://");
    if (url === null) return;
    if (!url) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };
  const image = async () => {
    const picked = onPickImage ? await onPickImage() : (() => {
      const url = window.prompt("آدرس تصویر:");
      return url ? { url, alt: window.prompt("متن جایگزین (alt):") ?? "" } : null;
    })();
    if (picked) editor.chain().focus().setImage({ src: picked.url, alt: picked.alt }).run();
  };
  return (
    <div className="sticky top-16 z-10 flex flex-wrap gap-0.5 border-b bg-card p-1.5">
      <Btn label="تیتر ۲" active={editor.isActive("heading", { level: 2 })} on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></Btn>
      <Btn label="تیتر ۳" active={editor.isActive("heading", { level: 3 })} on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></Btn>
      <span className="mx-1 w-px bg-border" />
      <Btn label="پررنگ" active={editor.isActive("bold")} on={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></Btn>
      <Btn label="ایتالیک" active={editor.isActive("italic")} on={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></Btn>
      <Btn label="کد" active={editor.isActive("code")} on={() => editor.chain().focus().toggleCode().run()}><Code className="size-4" /></Btn>
      <Btn label="لینک" active={editor.isActive("link")} on={link}><Link2 className="size-4" /></Btn>
      <span className="mx-1 w-px bg-border" />
      <Btn label="فهرست" active={editor.isActive("bulletList")} on={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></Btn>
      <Btn label="فهرست شماره‌دار" active={editor.isActive("orderedList")} on={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></Btn>
      <Btn label="نقل‌قول" active={editor.isActive("blockquote")} on={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></Btn>
      <Btn label="خط جداکننده" on={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></Btn>
      <Btn label="تصویر" on={image}><ImageIcon className="size-4" /></Btn>
      <span className="mx-1 w-px bg-border" />
      <Btn label="بازگشت" on={() => editor.chain().focus().undo().run()}><Undo2 className="size-4" /></Btn>
      <Btn label="انجام دوباره" on={() => editor.chain().focus().redo().run()}><Redo2 className="size-4" /></Btn>
    </div>
  );
}

/**
 * ویرایشگر متن غنی (Tiptap) — HTML را در یک input مخفی با نام name قرار می‌دهد
 * تا با FormData به Server Action ارسال شود.
 */
export function RichEditor({ name, initialHtml = "", onChange, placeholder = "متن را اینجا بنویسید…", onPickImage, minHeight = 320 }: { name: string; initialHtml?: string; onChange?: (html: string) => void; placeholder?: string; onPickImage?: () => Promise<{ url: string; alt: string } | null>; minHeight?: number }) {
  const [html, setHtml] = useState(initialHtml);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false }), Link.configure({ openOnClick: false, autolink: true }), Image, Placeholder.configure({ placeholder })],
    content: initialHtml,
    editorProps: { attributes: { class: "prose-fa max-w-none p-4 outline-none", dir: "rtl", style: `min-height:${minHeight}px` } },
    onUpdate: ({ editor }) => {
      const v = editor.getHTML();
      setHtml(v);
      onChange?.(v);
    },
  });
  useEffect(() => () => editor?.destroy(), [editor]);
  return (
    <div className="overflow-hidden rounded-xl border bg-background focus-within:border-primary">
      {editor && <Toolbar editor={editor} onPickImage={onPickImage} />}
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
