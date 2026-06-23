"use client";

import * as React from "react";
import { useTransition } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { useActionFeedback } from "@/shared/lib/actions/use-action-feedback";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { updateLabel } from "@/features/labels/actions/update-label";
import type { BoardLabel } from "@/features/boards/queries/get-board";

const LABEL_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#6366f1", "#a855f7", "#ec4899",
];

export function BoardLabelsDialog({
  open,
  boardId,
  labels,
  pending,
  onCloseAction,
  onDeleteAction,
}: {
  open: boolean;
  boardId: string;
  labels: BoardLabel[];
  pending: boolean;
  onCloseAction: () => void;
  onDeleteAction: (labelId: string) => void;
}) {
  const { dict } = useDictionary();
  const [deleteTarget, setDeleteTarget] = React.useState<BoardLabel | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editColor, setEditColor] = React.useState(LABEL_COLORS[5]!);
  const [isPending, startTransition] = useTransition();
  const { error, run, clearError } = useActionFeedback();

  const startEdit = (label: BoardLabel) => {
    setEditingId(label.id);
    setEditTitle(label.title);
    setEditColor(label.color);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (labelId: string) => {
    if (!editTitle.trim()) return;
    startTransition(() =>
      run(() => updateLabel({ labelId, boardId, title: editTitle.trim(), color: editColor })),
    );
    setEditingId(null);
  };

  return (
    <>
      <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="xs">
        <DialogTitle>{dict.boards.manageLabels}</DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          {labels.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
              {dict.boards.noLabels}
            </Typography>
          ) : (
            labels.map((label, i) => (
              <React.Fragment key={label.id}>
                {i > 0 && <Divider />}
                {editingId === label.id ? (
                  <Stack spacing={1.5} sx={{ py: 1.5 }}>
                    <TextField
                      autoFocus
                      size="small"
                      fullWidth
                      label={dict.tasks.labelName}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(label.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: "3px",
                                backgroundColor: editColor,
                                mr: 1,
                                flexShrink: 0,
                              }}
                            />
                          ),
                        },
                      }}
                    />
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                        Колір:
                      </Typography>
                      {LABEL_COLORS.map((c) => (
                        <Box
                          key={c}
                          onClick={() => setEditColor(c)}
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "4px",
                            backgroundColor: c,
                            cursor: "pointer",
                            flexShrink: 0,
                            outline: editColor === c ? "2px solid" : "2px solid transparent",
                            outlineColor: editColor === c ? "text.primary" : "transparent",
                            outlineOffset: 1,
                            transition: "outline-color 0.1s",
                          }}
                        />
                      ))}
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                      <Button size="small" onClick={cancelEdit} startIcon={<CloseIcon />}>
                        {dict.common.cancel}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!editTitle.trim() || isPending}
                        onClick={() => saveEdit(label.id)}
                        startIcon={<CheckIcon />}
                      >
                        {dict.common.save}
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack direction="row" sx={{ alignItems: "center", py: 0.5, minHeight: 48 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "3px",
                        backgroundColor: label.color,
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {label.title}
                    </Typography>
                    <IconButton size="small" onClick={() => startEdit(label)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" disabled={pending} onClick={() => setDeleteTarget(label)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
              </React.Fragment>
            ))
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

      <ErrorSnackbar error={error} onCloseAction={clearError} />
    </>
  );
}
