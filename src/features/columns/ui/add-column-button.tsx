"use client";

import * as React from "react";
import { useTransition } from "react";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { createColumn } from "@/features/columns/actions/create-column";
import { TitleDialog } from "@/shared/ui/components/title-dialog";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useActionFeedback } from "@/shared/lib/use-action-feedback";
import { useDictionary } from "@/shared/i18n/dictionary-context";

export function AddColumnButton({ boardId }: { boardId: string }) {
  const { dict } = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = React.useState(false);
  const { error, run, clearError } = useActionFeedback();

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        sx={{ minWidth: 220, alignSelf: "flex-start" }}
      >
        {dict.columns.newColumn}
      </Button>

      <TitleDialog
        open={open}
        dialogTitle={dict.columns.newColumn}
        label={dict.columns.columnTitle}
        pending={isPending}
        onCloseAction={() => setOpen(false)}
        onSubmitAction={(title) => {
          setOpen(false);
          startTransition(() => run(() => createColumn({ boardId, title })));
        }}
      />

      <ErrorSnackbar error={error} onCloseAction={clearError} />
    </>
  );
}
