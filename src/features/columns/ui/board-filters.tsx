"use client";

import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import { TaskPriority } from "@/generated/prisma/browser";
import {
  hasActiveFilters,
  EMPTY_TASK_FILTERS,
  type TaskFilters,
  type DueDateFilter,
} from "@/features/columns/lib/task-filters";
import { useDictionary } from "@/shared/i18n/dictionary-context";

// Client-side search/priority/due-date filter bar shown above the board's columns.
export function BoardFilters({
  filters,
  onChangeAction,
}: {
  filters: TaskFilters;
  onChangeAction: (filters: TaskFilters) => void;
}) {
  const { dict } = useDictionary();

  return (
    <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap", alignItems: "center" }}>
      <TextField
        size="small"
        placeholder={dict.filters.searchPlaceholder}
        value={filters.search}
        onChange={(event) => onChangeAction({ ...filters, search: event.target.value })}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ minWidth: 200 }}
      />
      <TextField
        select
        size="small"
        value={filters.priority}
        onChange={(event) =>
          onChangeAction({ ...filters, priority: event.target.value as TaskFilters["priority"] })
        }
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="all">{dict.filters.allPriorities}</MenuItem>
        <MenuItem value={TaskPriority.LOW}>{dict.tasks.priorityLow}</MenuItem>
        <MenuItem value={TaskPriority.MEDIUM}>{dict.tasks.priorityMedium}</MenuItem>
        <MenuItem value={TaskPriority.HIGH}>{dict.tasks.priorityHigh}</MenuItem>
      </TextField>
      <TextField
        select
        size="small"
        value={filters.dueDate}
        onChange={(event) =>
          onChangeAction({ ...filters, dueDate: event.target.value as DueDateFilter })
        }
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="all">{dict.filters.dueDateAll}</MenuItem>
        <MenuItem value="overdue">{dict.filters.overdue}</MenuItem>
        <MenuItem value="dueSoon">{dict.filters.dueSoon}</MenuItem>
        <MenuItem value="noDueDate">{dict.filters.noDueDate}</MenuItem>
      </TextField>
      {hasActiveFilters(filters) ? (
        <Button size="small" onClick={() => onChangeAction(EMPTY_TASK_FILTERS)}>
          {dict.filters.clear}
        </Button>
      ) : null}
    </Stack>
  );
}
