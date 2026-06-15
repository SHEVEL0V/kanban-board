"use client";

import Alert from "@mui/material/Alert";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import type { ErrorCode } from "@/shared/lib/actions/result";

// Translates a server-returned ErrorCode into a localized message —
// the server never sends human-readable error text directly.
export function FormErrorAlert({ code }: { code?: ErrorCode }) {
  const { dict } = useDictionary();
  if (!code) return null;
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {dict.errors[code]}
    </Alert>
  );
}
