"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import type { ColumnWithTasks } from "@/features/columns/ui/column-list";
import { TaskListRow } from "@/features/columns/ui/task-list-row";
import { taskMatchesFilters, type TaskFilters } from "@/features/columns/lib/task-filters";
import { useDictionary } from "@/shared/i18n/dictionary-context";

// Flat, grouped-by-column list view over the same board data as the Kanban view.
export function TaskListView({
  boardId,
  columns,
  filters,
  currentUserId,
}: {
  boardId: string;
  columns: ColumnWithTasks[];
  filters: TaskFilters;
  currentUserId: string;
}) {
  const { dict } = useDictionary();

  const groups = columns
    .map((column) => ({
      column,
      tasks: column.tasks.filter((task) => taskMatchesFilters(task, filters)),
    }))
    .filter((group) => group.tasks.length > 0);

  if (groups.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {dict.filters.noMatches}
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {groups.map(({ column, tasks }) => (
        <Paper key={column.id} variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle1">{column.title}</Typography>
            <Chip label={tasks.length} size="small" variant="outlined" />
          </Stack>
          <Stack divider={<Divider />}>
            {tasks.map((task) => (
              <TaskListRow key={task.id} task={task} boardId={boardId} currentUserId={currentUserId} />
            ))}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
