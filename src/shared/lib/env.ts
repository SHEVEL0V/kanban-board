import "server-only";

import { z } from "zod";

// Fails at startup if any required env var is missing or malformed.
export const env = z
  .object({
    SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().optional(),
  })
  .parse(process.env);
