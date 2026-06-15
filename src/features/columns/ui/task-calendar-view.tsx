"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { ColumnWithTasks } from "@/features/columns/ui/column-list";
import { TaskCalendarItem } from "@/features/columns/ui/task-calendar-item";
import { TaskListRow } from "@/features/columns/ui/task-list-row";
import { getCalendarGrid, isSameDay } from "@/features/columns/lib/calendar-grid";
import { taskMatchesFilters, type TaskFilters } from "@/features/columns/lib/task-filters";
import { useDictionary } from "@/shared/i18n/dictionary-context";

export function TaskCalendarView({
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
  const { dict, locale } = useDictionary();
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const allTasks = columns.flatMap((column) => column.tasks).filter((task) => taskMatchesFilters(task, filters));
  const tasksWithDueDate = allTasks.filter((task) => task.dueDate !== null);
  const tasksWithoutDueDate = allTasks.filter((task) => task.dueDate === null);

  const grid = getCalendarGrid(currentMonth);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(currentMonth);
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });

  const shiftMonth = (delta: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <IconButton aria-label={dict.views.previousMonth} onClick={() => shiftMonth(-1)}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" sx={{ minWidth: 160, textTransform: "capitalize" }}>
          {monthLabel}
        </Typography>
        <IconButton aria-label={dict.views.nextMonth} onClick={() => shiftMonth(1)}>
          <ChevronRightIcon />
        </IconButton>
        <Button
          size="small"
          onClick={() => {
            const now = new Date();
            setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
          }}
        >
          {dict.views.today}
        </Button>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
        {grid.slice(0, 7).map((date) => (
          <Typography
            key={date.getDay()}
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: "center", textTransform: "capitalize" }}
          >
            {weekdayFormatter.format(date)}
          </Typography>
        ))}
        {grid.map((date) => {
          const inCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const today = isSameDay(date, new Date());
          const dayTasks = tasksWithDueDate.filter((task) => task.dueDate && isSameDay(task.dueDate, date));

          return (
            <Paper
              key={date.toISOString()}
              variant="outlined"
              sx={{
                p: 0.75,
                minHeight: 96,
                opacity: inCurrentMonth ? 1 : 0.5,
                ...(today && { borderColor: "primary.main", borderWidth: 2 }),
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {date.getDate()}
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {dayTasks.map((task) => (
                  <TaskCalendarItem key={task.id} task={task} boardId={boardId} currentUserId={currentUserId} />
                ))}
              </Stack>
            </Paper>
          );
        })}
      </Box>

      {tasksWithoutDueDate.length > 0 ? (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {dict.views.noDueDate}
          </Typography>
          <Stack divider={<Divider />}>
            {tasksWithoutDueDate.map((task) => (
              <TaskListRow key={task.id} task={task} boardId={boardId} currentUserId={currentUserId} />
            ))}
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  );
}
