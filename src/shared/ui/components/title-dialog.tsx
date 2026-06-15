"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useDictionary } from "@/shared/i18n/dictionary-context";

// Reused by every "create/rename with a single title field" dialog
// (boards, columns, tasks) to avoid duplicating the same form scaffold.
export function TitleDialog({
  open,
  dialogTitle,
  label,
  defaultValue = "",
  pending = false,
  onCloseAction,
  onSubmitAction,
}: {
  open: boolean;
  dialogTitle: string;
  label: string;
  defaultValue?: string;
  pending?: boolean;
  onCloseAction: () => void;
  onSubmitAction: (value: string) => void;
}) {
  const { dict } = useDictionary();
  const [value, setValue] = React.useState(defaultValue);

  // Reset the field when the dialog opens, without an effect-driven re-render.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setValue(defaultValue);
  }

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmitAction(trimmed);
  };

  return (
    <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="xs">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label={label}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseAction}>{dict.common.cancel}</Button>
        <Button onClick={submit} disabled={pending || !value.trim()} variant="contained">
          {dict.common.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
