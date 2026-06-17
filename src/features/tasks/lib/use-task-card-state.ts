"use client";

import * as React from "react";
import { useTransition } from "react";
import type { Task, TaskPriority } from "@/generated/prisma/client";
import { updateTask } from "@/features/tasks/actions/update-task";
import { deleteTask } from "@/features/tasks/actions/delete-task";
import { useActionFeedback } from "@/shared/lib/actions/use-action-feedback";

// Shared edit/delete state for any task representation (board card, list row, calendar entry).
export function useTaskCardState(task: Task, boardId: string) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const { error, run, clearError } = useActionFeedback();

  const submitEdit = (
    title: string,
    description: string,
    priority: TaskPriority,
    dueDate: Date | null,
    assigneeId: string | null,
    labelIds: string[],
  ) => {
    setEditOpen(false);
    startTransition(() =>
      run(() =>
        updateTask({ taskId: task.id, boardId, title, description, priority, dueDate, assigneeId, labelIds }),
      ),
    );
  };

  const confirmDelete = () => {
    startTransition(() => run(() => deleteTask({ taskId: task.id, boardId })));
  };

  return {
    isPending,
    editOpen,
    setEditOpen,
    deleteOpen,
    setDeleteOpen,
    error,
    clearError,
    submitEdit,
    confirmDelete,
  };
}

export type TaskCardState = ReturnType<typeof useTaskCardState>;
