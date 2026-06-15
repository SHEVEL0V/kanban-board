"use client";

import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import FlagIcon from "@mui/icons-material/Flag";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { TaskPriority } from "@/generated/prisma/browser";
import { PRIORITY_COLOR } from "@/features/tasks/lib/priority-color";
import { useDictionary } from "@/shared/i18n/dictionary-context";

// Compact priority/due-date indicators shown on every task card.
export function TaskBadges({ priority, dueDate }: { priority: TaskPriority; dueDate: Date | null }) {
  const { dict } = useDictionary();
  // "Overdue" is a point-in-time UI hint, not derived state — reading the
  // clock here is intentional even though it's impure for the compiler.
  // eslint-disable-next-line react-hooks/purity
  const overdue = dueDate !== null && dueDate.getTime() < Date.now();

  const priorityLabel = {
    [TaskPriority.LOW]: dict.tasks.priorityLow,
    [TaskPriority.MEDIUM]: dict.tasks.priorityMedium,
    [TaskPriority.HIGH]: dict.tasks.priorityHigh,
  }[priority];

  const chipSx = {
    fontSize: "0.6875rem",
    "& .MuiChip-icon": { fontSize: 14, ml: "6px" },
    "& .MuiChip-label": { px: "6px" },
  };

  return (
    <Stack direction="row" useFlexGap spacing={0.5} sx={{ flexWrap: "nowrap", minWidth: 0 }}>
      <Chip
        icon={<FlagIcon />}
        label={priorityLabel}
        size="small"
        color={PRIORITY_COLOR[priority]}
        variant="outlined"
        sx={chipSx}
      />
      {dueDate ? (
        <Chip
          icon={<CalendarTodayIcon />}
          label={dueDate.toLocaleDateString()}
          size="small"
          color={overdue ? "error" : "default"}
          variant="outlined"
          sx={chipSx}
        />
      ) : null}
    </Stack>
  );
}
