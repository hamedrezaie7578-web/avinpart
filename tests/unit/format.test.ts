import { describe, expect, it } from "vitest";
import { formatPrice, normalizeMobile, toEnDigits, toFaDigits } from "@/lib/format";

describe("format", () => {
  it("converts digits", () => {
    expect(toFaDigits(2026)).toBe("۲۰۲۶");
    expect(toEnDigits("۰۹۱۲٣")).toBe("09123");
  });
  it("formats prices with Persian thousands separators", () => {
    expect(formatPrice(10_000_000)).toBe("۱۰٬۰۰۰٬۰۰۰ تومان");
  });
  it.each([
    ["09121234567", "09121234567"],
    ["+989121234567", "09121234567"],
    ["۰۹۱۲ ۱۲۳ ۴۵۶۷", "09121234567"],
    ["9121234567", "09121234567"],
    ["0812345678", null],
  ])("normalizeMobile(%s)", (input, expected) => {
    expect(normalizeMobile(input)).toBe(expected);
  });
});
