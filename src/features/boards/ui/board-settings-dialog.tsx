"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { useDictionary } from "@/shared/i18n/dictionary-context";

// Board-level settings: rename (any member) and delete (owner only).
export function BoardSettingsDialog({
  open,
  currentTitle,
  isOwner,
  pending,
  onCloseAction,
  onRenameAction,
  onDeleteAction,
}: {
  open: boolean;
  currentTitle: string;
  isOwner: boolean;
  pending: boolean;
  onCloseAction: () => void;
  onRenameAction: (title: string) => void;
  onDeleteAction: () => void;
}) {
  const { dict } = useDictionary();
  const [title, setTitle] = React.useState(currentTitle);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // Sync title when dialog opens with a (possibly updated) board title.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(currentTitle);
      setDeleteOpen(false);
    }
  }

  const submitRename = () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === currentTitle) return;
    onRenameAction(trimmed);
  };

  return (
    <>
      <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="xs">
        <DialogTitle>{dict.boards.boardSettings}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                label={dict.boards.boardTitle}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename();
                }}
              />
              <Button
                variant="contained"
                disabled={pending || !title.trim() || title.trim() === currentTitle}
                onClick={submitRename}
              >
                {dict.common.save}
              </Button>
            </Stack>

            {isOwner ? (
              <>
                <Divider />
                <Button
                  color="error"
                  variant="outlined"
                  disabled={pending}
                  onClick={() => setDeleteOpen(true)}
                >
                  {dict.boards.deleteBoard}
                </Button>
              </>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseAction}>{dict.common.cancel}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        title={dict.common.delete}
        description={dict.boards.deleteConfirm.replace("{title}", currentTitle)}
        onCloseAction={() => setDeleteOpen(false)}
        onConfirmAction={() => {
          setDeleteOpen(false);
          onDeleteAction();
        }}
      />
    </>
  );
}
