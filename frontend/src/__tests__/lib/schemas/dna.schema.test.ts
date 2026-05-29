import { describe, it, expect } from "vitest";
import { literaryDNASchema } from "@/lib/schemas/dna.schema";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_DATETIME = "2024-01-15T10:30:00.000Z";

const validDNA = {
  userId: VALID_UUID,
  emotionalProfile: { melancholic: 0.7, hopeful: 0.3 },
  atmospherePreferences: { urban: 0.8, rural: 0.2 },
  complexityScore: 0.6,
  pacingPreference: 0.4,
  updatedAt: VALID_DATETIME,
};

describe("literaryDNASchema", () => {
  it("accepts valid DNA", () => {
    expect(literaryDNASchema.safeParse(validDNA).success).toBe(true);
  });

  it("defaults preferredEras and languagePreferences to []", () => {
    const r = literaryDNASchema.safeParse(validDNA);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.preferredEras).toEqual([]);
      expect(r.data.languagePreferences).toEqual([]);
    }
  });

  it("rejects complexityScore > 1", () => {
    expect(literaryDNASchema.safeParse({ ...validDNA, complexityScore: 1.1 }).success).toBe(false);
  });

  it("rejects complexityScore < 0", () => {
    expect(literaryDNASchema.safeParse({ ...validDNA, complexityScore: -0.1 }).success).toBe(false);
  });

  it("rejects pacingPreference > 1", () => {
    expect(literaryDNASchema.safeParse({ ...validDNA, pacingPreference: 2 }).success).toBe(false);
  });

  it("rejects emotionalProfile values > 1", () => {
    const r = literaryDNASchema.safeParse({
      ...validDNA,
      emotionalProfile: { dark: 1.5 },
    });
    expect(r.success).toBe(false);
  });

  it("rejects emotionalProfile values < 0", () => {
    const r = literaryDNASchema.safeParse({
      ...validDNA,
      emotionalProfile: { dark: -0.1 },
    });
    expect(r.success).toBe(false);
  });

  it("accepts optional readingVelocity", () => {
    const r = literaryDNASchema.safeParse({ ...validDNA, readingVelocity: 25.5 });
    expect(r.success).toBe(true);
  });

  it("rejects non-UUID userId", () => {
    expect(literaryDNASchema.safeParse({ ...validDNA, userId: "bad-id" }).success).toBe(false);
  });

  it("rejects invalid datetime updatedAt", () => {
    expect(literaryDNASchema.safeParse({ ...validDNA, updatedAt: "not-a-date" }).success).toBe(false);
  });

  it("accepts full DNA with all fields", () => {
    const r = literaryDNASchema.safeParse({
      ...validDNA,
      preferredEras: ["XIX", "XX"],
      languagePreferences: ["ru", "en"],
      readingVelocity: 30,
    });
    expect(r.success).toBe(true);
  });
});
