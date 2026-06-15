"use client";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useDictionary } from "@/shared/i18n/dictionary-context";

export function ConfirmDialog({
  open,
  title,
  description,
  onConfirmAction,
  onCloseAction,
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirmAction: () => void;
  onCloseAction: () => void;
}) {
  const { dict } = useDictionary();

  return (
    <Dialog open={open} onClose={onCloseAction}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseAction}>{dict.common.cancel}</Button>
        <Button
          color="error"
          onClick={() => {
            onConfirmAction();
            onCloseAction();
          }}
        >
          {dict.common.delete}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
