"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { useDictionary } from "@/shared/i18n/dictionary-context";

// Column title, WIP limit, and completion flag, edited from the column header.
export function ColumnSettingsDialog({
  open,
  dialogTitle,
  defaultTitle = "",
  defaultWipLimit = null,
  defaultIsCompletion = false,
  pending = false,
  onCloseAction,
  onSubmitAction,
}: {
  open: boolean;
  dialogTitle: string;
  defaultTitle?: string;
  defaultWipLimit?: number | null;
  defaultIsCompletion?: boolean;
  pending?: boolean;
  onCloseAction: () => void;
  onSubmitAction: (title: string, wipLimit: number | null, isCompletion: boolean) => void;
}) {
  const { dict } = useDictionary();
  const [title, setTitle] = React.useState(defaultTitle);
  const [wipLimit, setWipLimit] = React.useState(defaultWipLimit?.toString() ?? "");
  const [isCompletion, setIsCompletion] = React.useState(defaultIsCompletion);

  // Reset fields when the dialog opens, without an effect-driven re-render.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(defaultTitle);
      setWipLimit(defaultWipLimit?.toString() ?? "");
      setIsCompletion(defaultIsCompletion);
    }
  }

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmitAction(trimmed, wipLimit.trim() === "" ? null : Number(wipLimit), isCompletion);
  };

  return (
    <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="xs">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label={dict.columns.columnTitle}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <TextField
            fullWidth
            type="number"
            label={dict.columns.wipLimit}
            helperText={dict.columns.wipLimitHelper}
            value={wipLimit}
            onChange={(event) => setWipLimit(event.target.value)}
            slotProps={{ htmlInput: { min: 1 } }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={isCompletion}
                onChange={(e) => setIsCompletion(e.target.checked)}
              />
            }
            label={dict.columns.isCompletion}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseAction}>{dict.common.cancel}</Button>
        <Button onClick={submit} disabled={pending || !title.trim()} variant="contained">
          {dict.common.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
