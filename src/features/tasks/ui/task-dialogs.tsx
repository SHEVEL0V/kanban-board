"use client";

import { TaskDialog } from "@/features/tasks/ui/task-dialog";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import type { TaskCardState } from "@/features/tasks/lib/use-task-card-state";
import type { TaskWithComments } from "@/features/boards/queries/get-board";

// Edit/delete dialogs shared by every task representation, driven by useTaskCardState.
export function TaskDialogs({
  task,
  state,
  boardId,
  currentUserId,
}: {
  task: TaskWithComments;
  state: TaskCardState;
  boardId: string;
  currentUserId: string;
}) {
  const { dict } = useDictionary();

  return (
    <>
      <TaskDialog
        open={state.editOpen}
        dialogTitle={task.title}
        defaultTitle={task.title}
        defaultDescription={task.description ?? ""}
        defaultPriority={task.priority}
        defaultDueDate={task.dueDate}
        pending={state.isPending}
        comments={{ taskId: task.id, boardId, currentUserId }}
        onCloseAction={() => state.setEditOpen(false)}
        onSubmitAction={state.submitEdit}
      />

      <ConfirmDialog
        open={state.deleteOpen}
        title={dict.common.delete}
        description={dict.tasks.deleteConfirm.replace("{title}", task.title)}
        onCloseAction={() => state.setDeleteOpen(false)}
        onConfirmAction={state.confirmDelete}
      />

      <ErrorSnackbar error={state.error} onCloseAction={state.clearError} />
    </>
  );
}
