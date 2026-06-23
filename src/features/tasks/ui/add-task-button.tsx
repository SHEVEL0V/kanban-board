"use client";

import * as React from "react";
import { useTransition } from "react";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import { createTask } from "@/features/tasks/actions/create-task";
import { TaskDialog } from "@/features/tasks/ui/task-dialog";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useActionFeedback } from "@/shared/lib/actions/use-action-feedback";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { useBoardContext } from "@/features/boards/ui/board-context";

export function AddTaskButton({ columnId, boardId }: { columnId: string; boardId: string }) {
  const { dict } = useDictionary();
  const { isViewer } = useBoardContext();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = React.useState(false);
  const { error, run, clearError } = useActionFeedback();

  // Hooks must run unconditionally — bail out only after they're called.
  if (isViewer) return null;

  return (
    <>
      <Button size="small" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
        {dict.tasks.newTask}
      </Button>

      <TaskDialog
        open={open}
        dialogTitle={dict.tasks.newTask}
        pending={isPending}
        onCloseAction={() => setOpen(false)}
        onSubmitAction={(title, description, priority, dueDate, assigneeId, labelIds) => {
          setOpen(false);
          startTransition(() =>
            run(() =>
              createTask({
                columnId,
                boardId,
                title,
                description: description || undefined,
                priority,
                dueDate,
                assigneeId,
                labelIds,
              }),
            ),
          );
        }}
      />

      <ErrorSnackbar error={error} onCloseAction={clearError} />
    </>
  );
}
