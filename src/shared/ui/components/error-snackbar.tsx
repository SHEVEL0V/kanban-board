"use client";

import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import type { ErrorCode } from "@/shared/lib/actions/result";
import { useDictionary } from "@/shared/i18n/dictionary-context";

export function ErrorSnackbar({
  error,
  onCloseAction,
}: {
  error: ErrorCode | null;
  onCloseAction: () => void;
}) {
  const { dict } = useDictionary();

  return (
    <Snackbar open={error !== null} autoHideDuration={5000} onClose={onCloseAction}>
      <Alert severity="error" onClose={onCloseAction} variant="filled">
        {error ? dict.errors[error] : null}
      </Alert>
    </Snackbar>
  );
}
