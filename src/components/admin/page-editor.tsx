"use client";

import { RichEditor } from "./rich-editor";
import { useMediaPicker } from "./media-picker";

/** ویرایشگر محتوای صفحه با امکان درج تصویر از کتابخانه‌ی رسانه */
export function ContentEditor({ name, initialHtml, minHeight }: { name: string; initialHtml: string; minHeight?: number }) {
  const { pick, dialog } = useMediaPicker();
  return (
    <>
      {dialog}
      <RichEditor name={name} initialHtml={initialHtml} onPickImage={pick} minHeight={minHeight} />
    </>
  );
}
