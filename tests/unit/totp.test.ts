import { describe, expect, it } from "vitest";
import { base32Decode, base32Encode, generateTotpSecret, totpCode, verifyTotp } from "@/lib/totp";

// بردار آزمون RFC 6238 (کلید ASCII «12345678901234567890»)
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("totp", () => {
  it("round-trips base32", () => {
    const buf = Buffer.from("12345678901234567890");
    expect(base32Encode(buf)).toBe(RFC_SECRET);
    expect(base32Decode(RFC_SECRET).equals(buf)).toBe(true);
  });
  it("matches RFC 6238 vectors (last 6 digits)", () => {
    expect(totpCode(RFC_SECRET, 59_000)).toBe("287082");
    expect(totpCode(RFC_SECRET, 1_111_111_109_000)).toBe("081804");
    expect(totpCode(RFC_SECRET, 1_234_567_890_000)).toBe("005924");
  });
  it("accepts ±1 step drift and rejects others", () => {
    const s = generateTotpSecret();
    const t = 1_700_000_000_000;
    expect(verifyTotp(s, totpCode(s, t), t)).toBe(true);
    expect(verifyTotp(s, totpCode(s, t - 30_000), t)).toBe(true);
    expect(verifyTotp(s, totpCode(s, t - 90_000), t)).toBe(false);
    expect(verifyTotp(s, "12ab56", t)).toBe(false);
  });
});
