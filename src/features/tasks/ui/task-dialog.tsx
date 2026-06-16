"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { TaskPriority } from "@/generated/prisma/browser";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { toDateInputValue } from "@/shared/lib/utils/date";
import { CommentsSection } from "@/features/comments/ui/comments-section";

// Shared by task creation and editing — both need title + optional description.
export function TaskDialog({
  open,
  dialogTitle,
  defaultTitle = "",
  defaultDescription = "",
  defaultPriority = TaskPriority.MEDIUM,
  defaultDueDate = null,
  pending = false,
  comments,
  onCloseAction,
  onSubmitAction,
}: {
  open: boolean;
  dialogTitle: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultPriority?: TaskPriority;
  defaultDueDate?: Date | null;
  pending?: boolean;
  comments?: { taskId: string; boardId: string; currentUserId: string };
  onCloseAction: () => void;
  onSubmitAction: (
    title: string,
    description: string,
    priority: TaskPriority,
    dueDate: Date | null,
  ) => void;
}) {
  const { dict } = useDictionary();
  const [title, setTitle] = React.useState(defaultTitle);
  const [description, setDescription] = React.useState(defaultDescription);
  const [priority, setPriority] = React.useState(defaultPriority);
  const [dueDate, setDueDate] = React.useState(toDateInputValue(defaultDueDate));

  // Reset the fields when the dialog opens, without an effect-driven re-render.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      setPriority(defaultPriority);
      setDueDate(toDateInputValue(defaultDueDate));
    }
  }

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmitAction(trimmed, description.trim(), priority, dueDate ? new Date(dueDate) : null);
  };

  return (
    <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="sm">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label={dict.tasks.taskTitle}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={dict.tasks.description}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              select
              fullWidth
              label={dict.tasks.priority}
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
            >
              <MenuItem value={TaskPriority.LOW}>{dict.tasks.priorityLow}</MenuItem>
              <MenuItem value={TaskPriority.MEDIUM}>{dict.tasks.priorityMedium}</MenuItem>
              <MenuItem value={TaskPriority.HIGH}>{dict.tasks.priorityHigh}</MenuItem>
            </TextField>
            <TextField
              fullWidth
              type="date"
              label={dict.tasks.dueDate}
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>

          {comments ? (
            <>
              <Divider />
              <CommentsSection
                taskId={comments.taskId}
                boardId={comments.boardId}
                currentUserId={comments.currentUserId}
              />
            </>
          ) : null}
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
