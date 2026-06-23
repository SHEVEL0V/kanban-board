"use client";

import * as React from "react";
import { useTransition } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import { TaskPriority } from "@/generated/prisma/browser";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { toDateInputValue } from "@/shared/lib/utils/date";
import { CommentsSection } from "@/features/comments/ui/comments-section";
import { ChecklistSection } from "@/features/tasks/ui/checklist-section";
import { useBoardContext } from "@/features/boards/ui/board-context";
import { createLabel } from "@/features/labels/actions/create-label";
import { useActionFeedback } from "@/shared/lib/actions/use-action-feedback";

const LABEL_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];

// Shared by task creation and editing — both need title + optional description.
export function TaskDialog({
  open,
  dialogTitle,
  defaultTitle = "",
  defaultDescription = "",
  defaultPriority = TaskPriority.MEDIUM,
  defaultDueDate = null,
  defaultAssigneeId = null,
  defaultLabelIds = [],
  pending = false,
  comments,
  checklist,
  onCloseAction,
  onSubmitAction,
}: {
  open: boolean;
  dialogTitle: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultPriority?: TaskPriority;
  defaultDueDate?: Date | null;
  defaultAssigneeId?: string | null;
  defaultLabelIds?: string[];
  pending?: boolean;
  comments?: { taskId: string; boardId: string; currentUserId: string };
  checklist?: { taskId: string; boardId: string; items: { id: string; content: string; done: boolean }[] };
  onCloseAction: () => void;
  onSubmitAction: (
    title: string,
    description: string,
    priority: TaskPriority,
    dueDate: Date | null,
    assigneeId: string | null,
    labelIds: string[],
  ) => void;
}) {
  const { dict } = useDictionary();
  const { boardId, boardMembers, boardLabels } = useBoardContext();
  const [title, setTitle] = React.useState(defaultTitle);
  const [description, setDescription] = React.useState(defaultDescription);
  const [priority, setPriority] = React.useState(defaultPriority);
  const [dueDate, setDueDate] = React.useState(toDateInputValue(defaultDueDate));
  const [assigneeId, setAssigneeId] = React.useState<string>(defaultAssigneeId ?? "");
  const [selectedLabelIds, setSelectedLabelIds] = React.useState<string[]>(defaultLabelIds);

  // New-label inline form state.
  const [showNewLabel, setShowNewLabel] = React.useState(false);
  const [newLabelTitle, setNewLabelTitle] = React.useState("");
  const [newLabelColor, setNewLabelColor] = React.useState(LABEL_COLORS[5]!);
  const [isPendingLabel, startLabelTransition] = useTransition();
  const { run: runLabel } = useActionFeedback();

  // Reset the fields when the dialog opens, without an effect-driven re-render.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      setPriority(defaultPriority);
      setDueDate(toDateInputValue(defaultDueDate));
      setAssigneeId(defaultAssigneeId ?? "");
      setSelectedLabelIds(defaultLabelIds);
      setShowNewLabel(false);
      setNewLabelTitle("");
    }
  }

  const toggleLabel = (id: string) =>
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );

  const submitNewLabel = () => {
    const trimmed = newLabelTitle.trim();
    if (!trimmed || !boardId) return;
    startLabelTransition(() =>
      runLabel(async () => {
        const result = await createLabel({ boardId, title: trimmed, color: newLabelColor });
        if (result.ok) {
          setSelectedLabelIds((prev) =>
            prev.includes(result.data.id) ? prev : [...prev, result.data.id],
          );
        }
        return result;
      }),
    );
    setShowNewLabel(false);
    setNewLabelTitle("");
  };

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmitAction(
      trimmed,
      description.trim(),
      priority,
      dueDate ? new Date(dueDate) : null,
      assigneeId || null,
      selectedLabelIds,
    );
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

          {boardMembers.length > 0 ? (
            <TextField
              select
              fullWidth
              label={dict.tasks.assignee}
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
            >
              <MenuItem value="">{dict.tasks.noAssignee}</MenuItem>
              {boardMembers.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name}
                </MenuItem>
              ))}
            </TextField>
          ) : null}

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
              {dict.tasks.labels}
            </Typography>
            <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: "wrap" }}>
              {boardLabels.map((label) => (
                <Chip
                  key={label.id}
                  label={label.title}
                  size="small"
                  onClick={() => toggleLabel(label.id)}
                  variant={selectedLabelIds.includes(label.id) ? "filled" : "outlined"}
                  sx={{
                    borderColor: label.color,
                    backgroundColor: selectedLabelIds.includes(label.id)
                      ? label.color
                      : "transparent",
                    color: selectedLabelIds.includes(label.id) ? "#fff" : "text.primary",
                    "&:hover": { opacity: 0.85 },
                  }}
                />
              ))}
              {showNewLabel ? (
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                  <TextField
                    size="small"
                    autoFocus
                    placeholder={dict.tasks.labelName}
                    value={newLabelTitle}
                    onChange={(e) => setNewLabelTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitNewLabel();
                      if (e.key === "Escape") setShowNewLabel(false);
                    }}
                    sx={{ width: 130 }}
                  />
                  <Stack direction="row" spacing={0.5}>
                    {LABEL_COLORS.map((c) => (
                      <Box
                        key={c}
                        onClick={() => setNewLabelColor(c)}
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          backgroundColor: c,
                          cursor: "pointer",
                          outline: newLabelColor === c ? "2px solid" : "none",
                          outlineColor: "text.primary",
                          outlineOffset: 1,
                        }}
                      />
                    ))}
                  </Stack>
                  <Button
                    size="small"
                    disabled={isPendingLabel || !newLabelTitle.trim()}
                    onClick={submitNewLabel}
                  >
                    {dict.common.add}
                  </Button>
                </Stack>
              ) : (
                <Chip
                  icon={<AddIcon sx={{ fontSize: "14px !important" }} />}
                  label={dict.tasks.addLabel}
                  size="small"
                  variant="outlined"
                  onClick={() => setShowNewLabel(true)}
                  sx={{ cursor: "pointer" }}
                />
              )}
            </Stack>
          </Box>

          {checklist ? (
            <>
              <Divider />
              <ChecklistSection
                taskId={checklist.taskId}
                boardId={checklist.boardId}
                initialItems={checklist.items}
              />
            </>
          ) : null}

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
