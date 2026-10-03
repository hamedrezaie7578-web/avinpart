import { describe, expect, it } from "vitest";
import { couponDiscount, resolvePrice, upgradeDifference } from "@/lib/pricing";

const now = new Date("2026-10-03T10:00:00Z");
const d = (days: number) => new Date(now.getTime() + days * 86400000);

describe("resolvePrice", () => {
  it("uses the global plan price by default", () => {
    expect(resolvePrice({ price: 10_000_000 }, null, [], now)).toMatchObject({
      price: 10_000_000,
      compareAtPrice: null,
    });
  });
  it("applies a product override", () => {
    const r = resolvePrice(
      { price: 60_000_000, compareAtPrice: 70_000_000 },
      { price: 55_000_000 },
      [],
      now,
    );
    expect(r.price).toBe(55_000_000);
    expect(r.compareAtPrice).toBeNull();
  });
  it("applies the best active timed discount and shows the base as strikethrough", () => {
    const r = resolvePrice(
      { price: 60_000_000 },
      null,
      [
        { percent: 10, startsAt: d(-1), endsAt: d(5), isActive: true, label: "جشنواره" },
        { percent: 30, startsAt: d(1), endsAt: d(5), isActive: true },
        { amount: 2_000_000, startsAt: d(-1), endsAt: d(5), isActive: true },
      ],
      now,
    );
    expect(r.price).toBe(54_000_000);
    expect(r.compareAtPrice).toBe(60_000_000);
    expect(r.discountPercent).toBe(10);
    expect(r.discountLabel).toBe("جشنواره");
  });
  it("ignores expired or inactive discounts", () => {
    const r = resolvePrice(
      { price: 100 },
      null,
      [{ percent: 50, startsAt: d(-5), endsAt: d(-1), isActive: true }],
      now,
    );
    expect(r.price).toBe(100);
  });
});

describe("couponDiscount", () => {
  it("caps at subtotal and respects minimum", () => {
    expect(couponDiscount(1000, { type: "AMOUNT", value: 5000 })).toBe(1000);
    expect(couponDiscount(1000, { type: "PERCENT", value: 20, minAmount: 2000 })).toBe(0);
    expect(couponDiscount(10_000_000, { type: "PERCENT", value: 15 })).toBe(1_500_000);
  });
});

describe("upgradeDifference", () => {
  it("credits full price of a perpetual license", () => {
    expect(
      upgradeDifference({
        newPrice: 60_000_000,
        paidPrice: 10_000_000,
        expiresAt: null,
        startedAt: d(-100),
        now,
      }),
    ).toBe(50_000_000);
  });
  it("credits the remaining share of a time-limited license", () => {
    expect(
      upgradeDifference({
        newPrice: 90_000_000,
        paidPrice: 60_000_000,
        expiresAt: d(182.5),
        startedAt: d(-182.5),
        now,
      }),
    ).toBe(60_000_000);
  });
});
