"use client";

import * as React from "react";
import { useTransition } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/generated/prisma/client";
import { updateTask } from "@/features/tasks/actions/update-task";
import { deleteTask } from "@/features/tasks/actions/delete-task";
import { TaskDialog } from "@/features/tasks/ui/task-dialog";
import { TaskBadges } from "@/features/tasks/ui/task-badges";
import { PRIORITY_COLOR } from "@/features/tasks/lib/priority-color";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useActionFeedback } from "@/shared/lib/use-action-feedback";
import { useDictionary } from "@/shared/i18n/dictionary-context";

export function TaskCard({
  task,
  boardId,
  hidden = false,
}: {
  task: Task;
  boardId: string;
  hidden?: boolean;
}) {
  const { dict } = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const { error, run, clearError } = useActionFeedback();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task" },
  });

  const priorityColor = PRIORITY_COLOR[task.priority];

  return (
    <Card
      ref={setNodeRef}
      variant="outlined"
      sx={{
        display: hidden ? "none" : undefined,
        opacity: isDragging ? 0.5 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        borderLeftWidth: 4,
        borderLeftColor: (theme) =>
          priorityColor === "default" ? theme.palette.divider : theme.palette[priorityColor].main,
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 1,
          p: 1.5,
          "&:last-child": { pb: 1.5 },
        }}
      >
        <IconButton
          size="small"
          {...attributes}
          {...listeners}
          sx={{ cursor: "grab", mt: -0.5, ml: -0.5 }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
        <Stack
          spacing={0.5}
          sx={{ minWidth: 0, flexGrow: 1, cursor: "pointer" }}
          onClick={() => setEditOpen(true)}
        >
          <Typography variant="body2">{task.title}</Typography>
          {task.description ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {task.description}
            </Typography>
          ) : null}
          <TaskBadges priority={task.priority} dueDate={task.dueDate} />
        </Stack>
        <IconButton size="small" onClick={() => setDeleteOpen(true)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </CardContent>

      <TaskDialog
        open={editOpen}
        dialogTitle={task.title}
        defaultTitle={task.title}
        defaultDescription={task.description ?? ""}
        defaultPriority={task.priority}
        defaultDueDate={task.dueDate}
        pending={isPending}
        onCloseAction={() => setEditOpen(false)}
        onSubmitAction={(title, description, priority, dueDate) => {
          setEditOpen(false);
          startTransition(() =>
            run(() =>
              updateTask({ taskId: task.id, boardId, title, description, priority, dueDate }),
            ),
          );
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={dict.common.delete}
        description={dict.tasks.deleteConfirm.replace("{title}", task.title)}
        onCloseAction={() => setDeleteOpen(false)}
        onConfirmAction={() => {
          startTransition(() => run(() => deleteTask({ taskId: task.id, boardId })));
        }}
      />

      <ErrorSnackbar error={error} onCloseAction={clearError} />
    </Card>
  );
}
