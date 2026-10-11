import { generateKeyPairSync } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  canonicalJson,
  generateLicenseKey,
  isLicenseKeyFormat,
  normalizeLicenseKey,
  signLicensePayload,
  verifyLicenseSignature,
} from "@/lib/license";

beforeAll(() => {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  process.env.LICENSE_PRIVATE_KEY = privateKey
    .export({ format: "der", type: "pkcs8" })
    .toString("base64");
  process.env.LICENSE_PUBLIC_KEY = publicKey
    .export({ format: "der", type: "spki" })
    .toString("base64");
});

describe("license keys", () => {
  it("generates unique, well-formed keys", () => {
    const keys = new Set(Array.from({ length: 2000 }, generateLicenseKey));
    expect(keys.size).toBe(2000);
    for (const k of keys) expect(isLicenseKeyFormat(k)).toBe(true);
  });
  it("normalizes ambiguous user input", () => {
    expect(normalizeLicenseKey(" avin-0abcd-1efgh-2jkmn-3pqrs ")).toBe(
      "AVIN-0ABCD-1EFGH-2JKMN-3PQRS",
    );
    expect(normalizeLicenseKey("AVIN-OOOOO-IIIII-LLLLL-00000")).toBe(
      "AVIN-00000-11111-11111-00000",
    );
  });
});

describe("license signatures", () => {
  it("canonical JSON is key-order independent", () => {
    expect(canonicalJson({ b: 1, a: [2, { d: 3, c: 4 }] })).toBe(
      canonicalJson({ a: [2, { c: 4, d: 3 }], b: 1 }),
    );
  });
  it("signs and verifies; detects tampering", () => {
    const { payload, signature } = signLicensePayload({
      key: "AVIN-X",
      status: "ACTIVE",
      expiresAt: null,
    });
    expect(verifyLicenseSignature(payload, signature)).toBe(true);
    expect(verifyLicenseSignature({ ...payload, status: "REVOKED" }, signature)).toBe(false);
  });
});
