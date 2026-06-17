"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import type { BoardLabel } from "@/features/boards/queries/get-board";

// Per-board label management dialog: lists all labels with deletion.
export function BoardLabelsDialog({
  open,
  labels,
  pending,
  onCloseAction,
  onDeleteAction,
}: {
  open: boolean;
  labels: BoardLabel[];
  pending: boolean;
  onCloseAction: () => void;
  onDeleteAction: (labelId: string) => void;
}) {
  const { dict } = useDictionary();
  const [deleteTarget, setDeleteTarget] = React.useState<BoardLabel | null>(null);

  return (
    <>
      <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="xs">
        <DialogTitle>{dict.boards.manageLabels}</DialogTitle>
        <DialogContent>
          {labels.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {dict.boards.noLabels}
            </Typography>
          ) : (
            <List dense disablePadding>
              {labels.map((label) => (
                <ListItem
                  key={label.id}
                  disableGutters
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      disabled={pending}
                      onClick={() => setDeleteTarget(label)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      backgroundColor: label.color,
                      mr: 1.5,
                      flexShrink: 0,
                    }}
                  />
                  <ListItemText primary={label.title} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseAction}>{dict.common.cancel}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={dict.common.delete}
        description={dict.boards.deleteLabelConfirm.replace("{title}", deleteTarget?.title ?? "")}
        onCloseAction={() => setDeleteTarget(null)}
        onConfirmAction={() => {
          if (deleteTarget) onDeleteAction(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </>
  );
}
