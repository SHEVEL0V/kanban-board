"use client";

import { useState } from "react";
import type { ErrorCode, Result } from "@/shared/lib/result";

// Captures the error code from a fire-and-forget mutation so the UI can
// surface it in a toast instead of silently dropping failed actions.
export function useActionFeedback() {
  const [error, setError] = useState<ErrorCode | null>(null);

  function run(action: () => Promise<Result<unknown>>) {
    void action().then((result) => {
      if (!result.ok) setError(result.code);
    });
  }

  return { error, run, clearError: () => setError(null) };
}
