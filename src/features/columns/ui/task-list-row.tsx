"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import type { TaskWithComments } from "@/features/boards/queries/get-board";
import { TaskBadges } from "@/features/tasks/ui/task-badges";
import { TaskDialogs } from "@/features/tasks/ui/task-dialogs";
import { useTaskCardState } from "@/features/tasks/lib/use-task-card-state";
import { PRIORITY_COLOR } from "@/features/tasks/lib/priority-color";

// A non-draggable row representation of a task, shared by the list and calendar views.
export function TaskListRow({
  task,
  boardId,
  currentUserId,
}: {
  task: TaskWithComments;
  boardId: string;
  currentUserId: string;
}) {
  const state = useTaskCardState(task, boardId);
  const priorityColor = PRIORITY_COLOR[task.priority];

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: "center",
        py: 0.75,
        px: 1,
        borderLeft: 4,
        borderColor: (theme) =>
          priorityColor === "default" ? theme.palette.divider : theme.palette[priorityColor].main,
      }}
    >
      <Stack
        spacing={0.25}
        sx={{ minWidth: 0, flexGrow: 1, cursor: "pointer" }}
        onClick={() => state.setEditOpen(true)}
      >
        <Typography variant="body2" noWrap>
          {task.title}
        </Typography>
        {task.description ? (
          <Typography variant="caption" color="text.secondary" noWrap>
            {task.description}
          </Typography>
        ) : null}
      </Stack>
      <TaskBadges priority={task.priority} dueDate={task.dueDate} commentCount={task._count.comments} />
      <IconButton size="small" onClick={() => state.setDeleteOpen(true)}>
        <DeleteIcon fontSize="small" />
      </IconButton>

      <TaskDialogs task={task} state={state} boardId={boardId} currentUserId={currentUserId} />
    </Stack>
  );
}
