"use client";

import * as React from "react";
import { useTransition } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { generateSuggestions } from "@/features/ai-assist/actions/generate-suggestions";
import { moveTask } from "@/features/tasks/actions/move-task";
import { updateTask } from "@/features/tasks/actions/update-task";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useActionFeedback } from "@/shared/lib/actions/use-action-feedback";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import type { ColumnWithTasks } from "@/features/columns/ui/column-list";
import type { Suggestion } from "@/features/ai-assist/schema/ai-assist-schema";
import { ok, type Result } from "@/shared/lib/actions/result";

export function AiAssistDialog({
  open,
  boardId,
  columns,
  onCloseAction,
}: {
  open: boolean;
  boardId: string;
  columns: ColumnWithTasks[];
  onCloseAction: () => void;
}) {
  const { dict } = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = React.useState<Suggestion[] | null>(null);
  const { error, run, clearError } = useActionFeedback();

  const generate = () => {
    startTransition(() =>
      run(async () => {
        const result = await generateSuggestions({ boardId });
        if (result.ok) setSuggestions(result.data.suggestions);
        return result;
      }),
    );
  };

  const applySuggestion = (suggestion: Suggestion) => {
    let current: { task: ColumnWithTasks["tasks"][number]; columnId: string } | null = null;
    for (const column of columns) {
      const task = column.tasks.find((t) => t.id === suggestion.taskId);
      if (task) current = { task, columnId: column.id };
    }
    if (!current) return;

    const operations: Promise<Result<unknown>>[] = [];

    if (suggestion.suggestedColumnId && suggestion.suggestedColumnId !== current.columnId) {
      const target = columns.find((column) => column.id === suggestion.suggestedColumnId);
      if (target) {
        operations.push(
          moveTask({
            taskId: suggestion.taskId,
            boardId,
            columnId: target.id,
            orderedIds: [...target.tasks.map((t) => t.id), suggestion.taskId],
          }),
        );
      }
    }

    if (suggestion.suggestedPriority && suggestion.suggestedPriority !== current.task.priority) {
      operations.push(
        updateTask({
          taskId: suggestion.taskId,
          boardId,
          title: current.task.title,
          description: current.task.description ?? undefined,
          priority: suggestion.suggestedPriority,
          dueDate: current.task.dueDate,
        }),
      );
    }

    startTransition(() =>
      run(async () => {
        const results = await Promise.all(operations);
        const failed = results.find((result) => !result.ok);
        if (failed) return failed;
        setSuggestions((prev) => prev?.filter((item) => item.taskId !== suggestion.taskId) ?? null);
        return ok(undefined);
      }),
    );
  };

  const columnTitle = (columnId: string) => columns.find((column) => column.id === columnId)?.title;

  return (
    <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="sm">
      <DialogTitle>{dict.aiAssist.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {dict.aiAssist.description}
          </Typography>

          <Button onClick={generate} disabled={isPending} variant="contained" sx={{ alignSelf: "flex-start" }}>
            {isPending ? <CircularProgress size={20} /> : dict.aiAssist.generateButton}
          </Button>

          {suggestions !== null && suggestions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {dict.aiAssist.noSuggestions}
            </Typography>
          ) : null}

          {suggestions && suggestions.length > 0 ? (
            <List dense disablePadding>
              {suggestions.map((suggestion) => (
                <ListItem
                  key={suggestion.taskId}
                  disableGutters
                  divider
                  secondaryAction={
                    <Button size="small" onClick={() => applySuggestion(suggestion)} disabled={isPending}>
                      {dict.aiAssist.apply}
                    </Button>
                  }
                >
                  <ListItemText
                    primary={suggestion.taskTitle}
                    secondary={
                      <>
                        {suggestion.reason}
                        {suggestion.suggestedColumnId
                          ? ` — ${dict.aiAssist.moveTo}: ${columnTitle(suggestion.suggestedColumnId) ?? ""}`
                          : null}
                        {suggestion.suggestedPriority
                          ? ` — ${dict.aiAssist.priorityChange}: ${dict.tasks[`priority${capitalize(suggestion.suggestedPriority)}` as "priorityLow" | "priorityMedium" | "priorityHigh"]}`
                          : null}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseAction}>{dict.common.cancel}</Button>
      </DialogActions>

      <ErrorSnackbar error={error} onCloseAction={clearError} />
    </Dialog>
  );
}

function capitalize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
