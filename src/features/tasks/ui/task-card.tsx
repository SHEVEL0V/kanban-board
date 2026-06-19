"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskWithComments } from "@/features/boards/queries/get-board";
import { TaskBadges } from "@/features/tasks/ui/task-badges";
import { TaskDialogs } from "@/features/tasks/ui/task-dialogs";
import { useTaskCardState } from "@/features/tasks/lib/use-task-card-state";
import { PRIORITY_COLOR } from "@/features/tasks/lib/priority-color";

export function TaskCard({
  task,
  boardId,
  currentUserId,
  hidden = false,
}: {
  task: TaskWithComments;
  boardId: string;
  currentUserId: string;
  hidden?: boolean;
}) {
  const state = useTaskCardState(task, boardId);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task" },
  });

  const priorityColor = PRIORITY_COLOR[task.priority];
  const hasLabels = task.labels.length > 0;

  return (
    <Card
      ref={setNodeRef}
      variant="outlined"
      sx={{
        display: hidden ? "none" : undefined,
        opacity: isDragging ? 0.5 : 1,
        transform: CSS.Translate.toString(transform),
        transition,
        touchAction: "none",
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
          pb: hasLabels ? 0.75 : 1.5,
          "&:last-child": { pb: hasLabels ? 0.75 : 1.5 },
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
          onClick={() => state.setEditOpen(true)}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{task.title}</Typography>
          {task.description ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {task.description}
            </Typography>
          ) : null}
          <TaskBadges
            dueDate={task.dueDate}
            commentCount={task._count.comments}
            assignee={task.assignee}
            checklistItems={task.checklistItems}
            isPendingReview={task.status === "PENDING_REVIEW"}
          />
        </Stack>
        <IconButton size="small" onClick={() => state.setDeleteOpen(true)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </CardContent>

      {hasLabels ? (
        <Stack direction="row" spacing={0.5} sx={{ px: 1.5, pb: 1 }}>
          {task.labels.map((label) => (
            <Tooltip key={label.id} title={label.title} placement="top">
              <Box
                sx={{
                  height: 6,
                  borderRadius: 0.75,
                  flex: 1,
                  minWidth: 20,
                  backgroundColor: label.color,
                }}
              />
            </Tooltip>
          ))}
        </Stack>
      ) : null}

      <TaskDialogs task={task} state={state} boardId={boardId} currentUserId={currentUserId} />
    </Card>
  );
}
