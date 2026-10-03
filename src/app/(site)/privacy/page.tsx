import type { Metadata } from "next";
import { StaticPage } from "@/components/sections/static-page";
import { pageMetadata } from "@/server/queries/pages";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("privacy", "/privacy");
}

export default function Page() {
  return <StaticPage slug="privacy" path="/privacy" />;
}
