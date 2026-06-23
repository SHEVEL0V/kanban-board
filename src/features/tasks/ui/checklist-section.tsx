"use client";

import * as React from "react";
import { useTransition } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import LinearProgress from "@mui/material/LinearProgress";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { useActionFeedback } from "@/shared/lib/actions/use-action-feedback";
import { createChecklistItem } from "@/features/tasks/actions/create-checklist-item";
import { toggleChecklistItem } from "@/features/tasks/actions/toggle-checklist-item";
import { deleteChecklistItem } from "@/features/tasks/actions/delete-checklist-item";

type Item = { id: string; content: string; done: boolean };

// Self-contained checklist section; applies optimistic updates and resyncs from parent on revalidation.
export function ChecklistSection({
  taskId,
  boardId,
  initialItems,
}: {
  taskId: string;
  boardId: string;
  initialItems: Item[];
}) {
  const { dict } = useDictionary();
  const { run } = useActionFeedback();
  const [prevInitialItems, setPrevInitialItems] = React.useState(initialItems);
  const [items, setItems] = React.useState(initialItems);
  const [newContent, setNewContent] = React.useState("");
  const [isPending, startTransition] = useTransition();

  // Resync local state when server data arrives after revalidation (derived-state pattern).
  if (prevInitialItems !== initialItems) {
    setPrevInitialItems(initialItems);
    setItems(initialItems);
  }

  const doneCount = items.filter((i) => i.done).length;
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  const handleToggle = (item: Item) => {
    const next = !item.done;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: next } : i)));
    startTransition(() =>
      run(() => toggleChecklistItem({ id: item.id, taskId, boardId, done: next })),
    );
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(() => run(() => deleteChecklistItem({ id, taskId, boardId })));
  };

  const handleAdd = () => {
    const trimmed = newContent.trim();
    if (!trimmed) return;
    setNewContent("");
    startTransition(() => run(() => createChecklistItem({ taskId, boardId, content: trimmed })));
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.75 }}>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
          {dict.tasks.checklist}
          {items.length > 0 ? ` (${doneCount}/${items.length})` : ""}
        </Typography>
        {items.length > 0 ? (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
          />
        ) : null}
      </Stack>

      <Stack spacing={0}>
        {items.map((item) => (
          <Stack key={item.id} direction="row" sx={{ alignItems: "center" }}>
            <Checkbox size="small" checked={item.done} onChange={() => handleToggle(item)} />
            <Typography
              variant="body2"
              sx={{
                flexGrow: 1,
                textDecoration: item.done ? "line-through" : "none",
                color: item.done ? "text.secondary" : "text.primary",
              }}
            >
              {item.content}
            </Typography>
            <IconButton size="small" onClick={() => handleDelete(item.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
        <TextField
          size="small"
          fullWidth
          placeholder={dict.tasks.checklistAdd}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <IconButton size="small" onClick={handleAdd} disabled={!newContent.trim() || isPending}>
          <AddIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
