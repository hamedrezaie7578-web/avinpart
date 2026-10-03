import { describe, expect, it } from "vitest";
import {
  auditTheme,
  BRAND_THEME,
  contrastRatio,
  ensureContrast,
  themeSchema,
  type ProductTheme,
} from "@/lib/theme";
import { products } from "../../prisma/seed/data/products";

describe("contrastRatio", () => {
  it("black on white is 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });
  it("is symmetric", () => {
    expect(contrastRatio("#4f46e5", "#fff")).toBeCloseTo(contrastRatio("#ffffff", "#4f46e5"));
  });
});

describe("ensureContrast", () => {
  it("lightens a dark color on dark background until AA", () => {
    const c = ensureContrast("#1e3a8a", "#0b0d14", 4.5);
    expect(contrastRatio(c, "#0b0d14")).toBeGreaterThanOrEqual(4.5);
  });
});

describe("product palettes meet WCAG AA", () => {
  it.each<[string, ProductTheme]>([
    ["brand", BRAND_THEME],
    ...products.map((p): [string, ProductTheme] => [p.slug, p.theme]),
  ])("%s", (_slug, theme) => {
    expect(themeSchema.safeParse(theme).success).toBe(true);
    expect(auditTheme(theme)).toEqual([]);
  });
});

describe("catalog", () => {
  it("has 26 unique products whose names start with Avin", () => {
    expect(products).toHaveLength(26);
    expect(new Set(products.map((p) => p.slug)).size).toBe(26);
    for (const p of products) expect(p.name.startsWith("Avin")).toBe(true);
  });
});
