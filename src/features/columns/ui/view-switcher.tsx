"use client";

import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import ViewListIcon from "@mui/icons-material/ViewList";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import type { BoardViewMode } from "@/features/columns/lib/board-view";
import { useDictionary } from "@/shared/i18n/dictionary-context";

export function ViewSwitcher({
  view,
  onChangeAction,
}: {
  view: BoardViewMode;
  onChangeAction: (view: BoardViewMode) => void;
}) {
  const { dict } = useDictionary();

  return (
    <ToggleButtonGroup
      value={view}
      exclusive
      size="small"
      onChange={(_event, value: BoardViewMode | null) => {
        if (value) onChangeAction(value);
      }}
    >
      <ToggleButton value="board" aria-label={dict.views.board}>
        <ViewKanbanIcon fontSize="small" sx={{ mr: 1 }} />
        {dict.views.board}
      </ToggleButton>
      <ToggleButton value="list" aria-label={dict.views.list}>
        <ViewListIcon fontSize="small" sx={{ mr: 1 }} />
        {dict.views.list}
      </ToggleButton>
      <ToggleButton value="calendar" aria-label={dict.views.calendar}>
        <CalendarMonthIcon fontSize="small" sx={{ mr: 1 }} />
        {dict.views.calendar}
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
