import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/permissions";

describe("hasPermission", () => {
  it("super admin has everything", () => expect(hasPermission(["*"], "orders.refund")).toBe(true));
  it("write implies read", () => expect(hasPermission(["blog.write"], "blog.read")).toBe(true));
  it("read does not imply write", () =>
    expect(hasPermission(["blog.read"], "blog.write")).toBe(false));
  it("no permissions", () => expect(hasPermission(undefined, "blog.read")).toBe(false));
});
