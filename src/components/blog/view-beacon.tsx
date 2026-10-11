"use client";

import { useEffect } from "react";

export function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const t = setTimeout(() => {
      void fetch("/api/posts/view", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }), keepalive: true }).catch(() => {});
    }, 3000);
    return () => clearTimeout(t);
  }, [slug]);
  return null;
}
