"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import HistoryIcon from "@mui/icons-material/History";
import type { ColumnWithTasks } from "@/features/columns/ui/column-list";
import { ColumnList } from "@/features/columns/ui/column-list";
import { TaskListView } from "@/features/columns/ui/task-list-view";
import { TaskCalendarView } from "@/features/columns/ui/task-calendar-view";
import { BoardFilters } from "@/features/columns/ui/board-filters";
import { ViewSwitcher } from "@/features/columns/ui/view-switcher";
import { ActivityDialog } from "@/features/activity/ui/activity-dialog";
import { AiAssistButton } from "@/features/ai-assist/ui/ai-assist-button";
import { EMPTY_TASK_FILTERS } from "@/features/columns/lib/task-filters";
import type { BoardViewMode } from "@/features/columns/lib/board-view";
import { parseBoardViewMode } from "@/features/columns/lib/board-view";
import type { ActivityEntry } from "@/features/activity/queries/get-activity-log";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { BoardProvider } from "@/features/boards/ui/board-context";
import { BoardRealtimeProvider } from "@/features/boards/ui/board-realtime";
import type { BoardLabel, BoardMemberUser } from "@/features/boards/queries/get-board";

// Top-level client wrapper: holds the shared filters/view state and renders
// the Kanban board, list, or calendar view over the same column/task data.
export function BoardView({
  boardId,
  columns,
  activities,
  currentUserId,
  boardMembers,
  boardLabels,
  isViewer,
}: {
  boardId: string;
  columns: ColumnWithTasks[];
  activities: ActivityEntry[];
  currentUserId: string;
  boardMembers: BoardMemberUser[];
  boardLabels: BoardLabel[];
  isViewer: boolean;
}) {
  const { dict } = useDictionary();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = parseBoardViewMode(searchParams.get("view"));
  const [filters, setFilters] = React.useState(EMPTY_TASK_FILTERS);
  const [activityOpen, setActivityOpen] = React.useState(false);

  const setView = (next: BoardViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "board") {
      params.delete("view");
    } else {
      params.set("view", next);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <BoardProvider boardId={boardId} boardMembers={boardMembers} boardLabels={boardLabels} isViewer={isViewer}>
      <BoardRealtimeProvider boardId={boardId}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          useFlexGap
          spacing={1}
          sx={{ flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}
        >
          <BoardFilters filters={filters} onChangeAction={setFilters} />
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Tooltip title={dict.activity.title}>
              <IconButton onClick={() => setActivityOpen(true)}>
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            <AiAssistButton boardId={boardId} columns={columns} />
            <ViewSwitcher view={view} onChangeAction={setView} />
          </Stack>
        </Stack>

        {view === "board" ? (
          <ColumnList boardId={boardId} columns={columns} filters={filters} currentUserId={currentUserId} />
        ) : null}
        {view === "list" ? (
          <TaskListView boardId={boardId} columns={columns} filters={filters} currentUserId={currentUserId} />
        ) : null}
        {view === "calendar" ? (
          <TaskCalendarView boardId={boardId} columns={columns} filters={filters} currentUserId={currentUserId} />
        ) : null}

        <ActivityDialog
          open={activityOpen}
          activities={activities}
          currentUserId={currentUserId}
          onCloseAction={() => setActivityOpen(false)}
        />
      </Stack>
      </BoardRealtimeProvider>
    </BoardProvider>
  );
}
