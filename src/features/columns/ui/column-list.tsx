"use client";

import * as React from "react";
import Stack from "@mui/material/Stack";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import type { Column as ColumnModel } from "@/generated/prisma/client";
import { Column } from "@/features/columns/ui/column";
import { AddColumnButton } from "@/features/columns/ui/add-column-button";
import type { TaskFilters } from "@/features/columns/lib/task-filters";
import type { TaskWithComments } from "@/features/boards/queries/get-board";
import { reorderColumns } from "@/features/columns/actions/reorder-columns";
import { moveTask } from "@/features/tasks/actions/move-task";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useActionFeedback } from "@/shared/lib/actions/use-action-feedback";
import { useBoardContext } from "@/features/boards/ui/board-context";
import { useBoardRealtime } from "@/features/boards/ui/board-realtime";

export type ColumnWithTasks = ColumnModel & { tasks: TaskWithComments[] };

// Applies a remote "task-moved" event to local column state. Returns the same
// reference if the task isn't present locally (caller falls back to a refresh).
function applyTaskMove(
  columns: ColumnWithTasks[],
  event: { taskId: string; columnId: string; orderedIds: string[] },
): ColumnWithTasks[] | null {
  const moved = columns
    .flatMap((column) => column.tasks)
    .find((task) => task.id === event.taskId);
  const destExists = columns.some((column) => column.id === event.columnId);
  if (!moved || !destExists) return null;

  const movedTask = { ...moved, columnId: event.columnId };

  return columns.map((column) => {
    if (column.id === event.columnId) {
      const pool = new Map(column.tasks.map((task) => [task.id, task]));
      pool.set(event.taskId, movedTask);
      const tasks = event.orderedIds
        .map((id) => pool.get(id))
        .filter((task): task is TaskWithComments => task !== undefined);
      return { ...column, tasks };
    }
    if (column.id !== event.columnId && column.tasks.some((task) => task.id === event.taskId)) {
      return { ...column, tasks: column.tasks.filter((task) => task.id !== event.taskId) };
    }
    return column;
  });
}

export function ColumnList({
  boardId,
  columns: initialColumns,
  filters,
  currentUserId,
}: {
  boardId: string;
  columns: ColumnWithTasks[];
  filters: TaskFilters;
  currentUserId: string;
}) {
  const { isViewer } = useBoardContext();
  const { subscribe } = useBoardRealtime();
  const [columns, setColumns] = React.useState(initialColumns);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const { error, run, clearError } = useActionFeedback();

  // Re-sync local DnD state when a server action revalidates the board data.
  const [prevInitialColumns, setPrevInitialColumns] = React.useState(initialColumns);
  if (initialColumns !== prevInitialColumns) {
    setPrevInitialColumns(initialColumns);
    setColumns(initialColumns);
  }

  // Keep a live ref so the realtime handler reads current columns without
  // resubscribing on every state change.
  const columnsRef = React.useRef(columns);
  React.useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  // Apply remote task moves as deltas; signal "unhandled" so the provider
  // refreshes when we can't patch (task unknown locally / not in board view).
  React.useEffect(() => {
    return subscribe((event) => {
      if (event.type !== "task-moved") return false;
      const next = applyTaskMove(columnsRef.current, event);
      if (!next) return false;
      setColumns(next);
      return true;
    });
  }, [subscribe]);

  function findColumn(id: string) {
    return columns.find(
      (column) => column.id === id || column.tasks.some((task) => task.id === id),
    );
  }

  // Cross-column drags need a live preview, so the task moves between
  // column arrays as soon as it's dragged over another column.
  function handleDragOver(event: DragOverEvent) {
    if (isViewer) return;
    const { active, over } = event;
    if (!over || active.id === over.id || active.data.current?.["type"] !== "task") return;

    const activeColumn = findColumn(String(active.id));
    const overColumn = findColumn(String(over.id));
    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

    setColumns((prev) => {
      const movedTask = activeColumn.tasks.find((task) => task.id === active.id);
      if (!movedTask) return prev;

      const overIndex = overColumn.tasks.findIndex((task) => task.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : overColumn.tasks.length;

      return prev.map((column) => {
        if (column.id === activeColumn.id) {
          return { ...column, tasks: column.tasks.filter((task) => task.id !== active.id) };
        }
        if (column.id === overColumn.id) {
          const tasks = [...column.tasks];
          tasks.splice(insertAt, 0, { ...movedTask, columnId: overColumn.id });
          return { ...column, tasks };
        }
        return column;
      });
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (isViewer) return;
    const { active, over } = event;
    if (!over) return;

    if (active.data.current?.["type"] === "column") {
      if (active.id === over.id) return;
      const oldIndex = columns.findIndex((column) => column.id === active.id);
      const newIndex = columns.findIndex((column) => column.id === over.id);
      const next = arrayMove(columns, oldIndex, newIndex);
      setColumns(next);
      run(() => reorderColumns({ boardId, orderedIds: next.map((column) => column.id) }));
      return;
    }

    if (active.data.current?.["type"] === "task") {
      const column = findColumn(String(active.id));
      if (!column) return;

      let tasks = column.tasks;
      if (active.id !== over.id && tasks.some((task) => task.id === over.id)) {
        const oldIndex = tasks.findIndex((task) => task.id === active.id);
        const newIndex = tasks.findIndex((task) => task.id === over.id);
        tasks = arrayMove(tasks, oldIndex, newIndex);
        setColumns((prev) => prev.map((c) => (c.id === column.id ? { ...c, tasks } : c)));
      }

      run(() =>
        moveTask({
          taskId: String(active.id),
          boardId,
          columnId: column.id,
          orderedIds: tasks.map((task) => task.id),
        }),
      );
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{ overflowX: "auto", pb: 2, alignItems: "flex-start" }}
      >
        <SortableContext
          items={columns.map((column) => column.id)}
          strategy={horizontalListSortingStrategy}
        >
          {columns.map((column) => (
            <Column key={column.id} column={column} filters={filters} currentUserId={currentUserId} />
          ))}
        </SortableContext>
        {!isViewer && <AddColumnButton boardId={boardId} />}
      </Stack>

      <ErrorSnackbar error={error} onCloseAction={clearError} />
    </DndContext>
  );
}
