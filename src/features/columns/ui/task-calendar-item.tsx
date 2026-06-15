"use client";

import Chip from "@mui/material/Chip";
import type { TaskWithComments } from "@/features/boards/queries/get-board";
import { TaskDialogs } from "@/features/tasks/ui/task-dialogs";
import { useTaskCardState } from "@/features/tasks/lib/use-task-card-state";
import { PRIORITY_COLOR } from "@/features/tasks/lib/priority-color";

// A compact, clickable chip representing a task inside a calendar day cell.
export function TaskCalendarItem({
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
    <>
      <Chip
        label={task.title}
        size="small"
        color={priorityColor === "default" ? undefined : priorityColor}
        variant="outlined"
        onClick={() => state.setEditOpen(true)}
        sx={{ maxWidth: "100%", justifyContent: "flex-start" }}
      />
      <TaskDialogs task={task} state={state} boardId={boardId} currentUserId={currentUserId} />
    </>
  );
}
