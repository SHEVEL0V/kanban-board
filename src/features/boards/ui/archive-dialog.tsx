"use client";

import * as React from "react";
import { useTransition } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import RestoreIcon from "@mui/icons-material/Restore";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { PRIORITY_COLOR } from "@/features/tasks/lib/priority-color";
import { getArchivedTasks, type ArchivedTask } from "@/features/boards/queries/get-archived-tasks";
import { restoreTask } from "@/features/tasks/actions/restore-task";

const priorityBorderColor: Record<string, string> = {
  success: "#22c55e",
  warning: "#f97316",
  error: "#ef4444",
  default: "transparent",
};

// Archive dialog: confirmed-complete tasks with restore option.
export function ArchiveDialog({
  open,
  boardId,
  onCloseAction,
}: {
  open: boolean;
  boardId: string;
  onCloseAction: () => void;
}) {
  const { dict, locale } = useDictionary();
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const [tasks, setTasks] = React.useState<ArchivedTask[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [restoringId, setRestoringId] = React.useState<string | null>(null);
  const [, startTransition] = useTransition();

  const fetchTasks = React.useCallback(() => {
    setLoading(true);
    getArchivedTasks(boardId).then((result) => {
      if (result.ok) setTasks(result.data);
      setLoading(false);
    });
  }, [boardId]);

  // Fetch when dialog opens.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) fetchTasks();
  }

  const handleRestore = (taskId: string) => {
    setRestoringId(taskId);
    startTransition(async () => {
      await restoreTask({ taskId, boardId });
      setRestoringId(null);
      fetchTasks();
    });
  };

  const getDays = (task: ArchivedTask) => {
    if (!task.archivedAt) return null;
    const ms = task.archivedAt.getTime() - task.createdAt.getTime();
    return Math.max(1, Math.round(ms / 86_400_000));
  };

  return (
    <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="sm">
      <DialogTitle>{dict.boards.archive}</DialogTitle>
      <DialogContent sx={{ px: 0, pb: 0 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : tasks.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 2 }}>
            {dict.boards.archiveEmpty}
          </Typography>
        ) : (
          <List dense disablePadding>
            {tasks.map((task) => {
              const colorKey = PRIORITY_COLOR[task.priority];
              const borderColor = priorityBorderColor[colorKey] ?? priorityBorderColor.default;
              const days = getDays(task);
              const isRestoring = restoringId === task.id;
              return (
                <ListItem
                  key={task.id}
                  divider
                  sx={{ borderLeft: 3, borderColor, gap: 1, opacity: isRestoring ? 0.5 : 1 }}
                  secondaryAction={
                    <Tooltip title={dict.boards.restoreTask}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={isRestoring || restoringId !== null}
                          onClick={() => handleRestore(task.id)}
                        >
                          <RestoreIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  }
                >
                  <ListItemText
                    primary={task.title}
                    secondary={[
                      task.column.title,
                      task.assignee && dict.boards.completedBy.replace("{name}", task.assignee.name),
                      task.archivedAt && formatter.format(task.archivedAt),
                    ].filter(Boolean).join(" · ")}
                  />
                  {days !== null ? (
                    <Chip
                      label={dict.boards.completionDays.replace("{days}", String(days))}
                      size="small"
                      variant="outlined"
                      sx={{ flexShrink: 0 }}
                    />
                  ) : null}
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseAction}>{dict.common.cancel}</Button>
      </DialogActions>
    </Dialog>
  );
}
