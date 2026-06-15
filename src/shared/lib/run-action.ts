import "server-only";

import type { z } from "zod";
import { revalidatePath } from "next/cache";
import { verifySession, type AuthenticatedSession } from "@/shared/lib/dal";
import { ErrorCode, err, type Result } from "@/shared/lib/result";

type AuthedConfig<TInput, TOutput> = {
  schema: z.ZodType<TInput>;
  requireAuth?: true;
  revalidate?: (data: TInput, output: TOutput) => string[];
  handler: (data: TInput, session: AuthenticatedSession) => Promise<Result<TOutput>>;
};

type PublicConfig<TInput, TOutput> = {
  schema: z.ZodType<TInput>;
  requireAuth: false;
  revalidate?: (data: TInput, output: TOutput) => string[];
  handler: (data: TInput, session: null) => Promise<Result<TOutput>>;
};

function toPlainObject(input: unknown): unknown {
  if (input instanceof FormData) {
    return Object.fromEntries(input.entries());
  }
  return input;
}

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

// Auth -> validation -> handler -> revalidation, with uniform error handling.
// All Server Actions should be built through this factory.
export function runAction<TInput, TOutput>(
  config: AuthedConfig<TInput, TOutput> | PublicConfig<TInput, TOutput>,
) {
  return async function action(input: unknown): Promise<Result<TOutput>> {
    const session = config.requireAuth === false ? null : await verifySession();

    const parsed = config.schema.safeParse(toPlainObject(input));
    if (!parsed.success) {
      return err(ErrorCode.VALIDATION, parsed.error.flatten().fieldErrors as never);
    }

    try {
      const result = await (config.requireAuth === false
        ? config.handler(parsed.data, null)
        : config.handler(parsed.data, session as AuthenticatedSession));

      if (result.ok && config.revalidate) {
        for (const path of config.revalidate(parsed.data, result.data)) {
          revalidatePath(path);
        }
      }

      return result;
    } catch (error) {
      if (isNextRedirectError(error)) throw error;
      console.error(error);
      return err(ErrorCode.SERVER_ERROR);
    }
  };
}
