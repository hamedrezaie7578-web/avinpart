import type { Metadata } from "next";
import { NotFoundContent } from "@/components/sections/not-found-content";

export const metadata: Metadata = { title: "صفحه پیدا نشد", robots: { index: false } };

export default function NotFound() {
  return <NotFoundContent />;
}
