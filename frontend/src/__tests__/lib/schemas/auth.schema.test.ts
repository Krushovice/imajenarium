import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, userSchema } from "@/lib/schemas/auth.schema";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "secret123" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0].message;
      expect(msg).toContain("8");
    }
  });

  it("rejects missing fields", () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    email: "user@example.com",
    username: "john_doe",
    displayName: "John Doe",
    password: "strongpass1",
    confirmPassword: "strongpass1",
  };

  it("accepts valid registration data", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "different" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });

  it("rejects username shorter than 3 chars", () => {
    const result = registerSchema.safeParse({ ...valid, username: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects username longer than 32 chars", () => {
    const result = registerSchema.safeParse({ ...valid, username: "a".repeat(33) });
    expect(result.success).toBe(false);
  });

  it("rejects empty displayName", () => {
    const result = registerSchema.safeParse({ ...valid, displayName: "" });
    expect(result.success).toBe(false);
  });
});

describe("userSchema", () => {
  it("accepts valid user", () => {
    const result = userSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "user@example.com",
      username: "john",
      displayName: "John",
    });
    expect(result.success).toBe(true);
  });

  it("defaults isGuest to false", () => {
    const result = userSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "user@example.com",
      username: "john",
      displayName: "John",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isGuest).toBe(false);
  });

  it("rejects non-UUID id", () => {
    const result = userSchema.safeParse({
      id: "not-a-uuid",
      email: "user@example.com",
      username: "john",
      displayName: "John",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional avatarUrl", () => {
    const result = userSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "user@example.com",
      username: "john",
      displayName: "John",
      avatarUrl: "https://example.com/avatar.png",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid avatarUrl", () => {
    const result = userSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "user@example.com",
      username: "john",
      displayName: "John",
      avatarUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});
