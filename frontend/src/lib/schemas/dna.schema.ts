import { z } from "zod";

export const literaryDNASchema = z.object({
  userId: z.string().uuid(),
  emotionalProfile: z.record(z.string(), z.number().min(0).max(1)),
  atmospherePreferences: z.record(z.string(), z.number().min(0).max(1)),
  complexityScore: z.number().min(0).max(1),
  pacingPreference: z.number().min(0).max(1),
  preferredEras: z.array(z.string()).default([]),
  languagePreferences: z.array(z.string()).default([]),
  readingVelocity: z.number().min(0).optional(),
  updatedAt: z.string().datetime(),
});

export type LiteraryDNA = z.infer<typeof literaryDNASchema>;
