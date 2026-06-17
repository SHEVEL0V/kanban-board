"use client";

import Link from "next/link";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { routes } from "@/shared/lib/routing/routes";
import { PRIORITY_COLOR } from "@/features/tasks/lib/priority-color";
import type { AssignedTaskNotification, DueTaskNotification } from "@/features/notifications/queries/get-due-task-notifications";

const priorityBorderColor: Record<string, string> = {
  success: "#22c55e",
  warning: "#f97316",
  error: "#ef4444",
  default: "transparent",
};

export function NotificationDialog({
  open,
  notifications,
  assignedTasks,
  onCloseAction,
}: {
  open: boolean;
  notifications: DueTaskNotification[];
  assignedTasks: AssignedTaskNotification[];
  onCloseAction: () => void;
}) {
  const { dict, locale } = useDictionary();
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const isEmpty = notifications.length === 0 && assignedTasks.length === 0;

  return (
    <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="sm">
      <DialogTitle>{dict.notifications.title}</DialogTitle>
      <DialogContent sx={{ px: 0, pb: 0 }}>
        {isEmpty ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 2 }}>
            {dict.notifications.empty}
          </Typography>
        ) : (
          <>
            {notifications.length > 0 && (
              <>
                <Typography variant="overline" color="text.secondary" sx={{ px: 3 }}>
                  {dict.notifications.deadlines}
                </Typography>
                <List dense disablePadding>
                  {notifications.map((notification) => (
                    <ListItemButton
                      key={notification.taskId}
                      component={Link}
                      href={routes.board(notification.boardId)}
                      onClick={onCloseAction}
                      divider
                    >
                      <ListItemText
                        primary={notification.taskTitle}
                        secondary={`${notification.boardTitle} · ${dict.notifications.dueOn.replace("{date}", formatter.format(notification.dueDate))}`}
                      />
                      <Chip
                        label={notification.status === "overdue" ? dict.notifications.overdue : dict.notifications.dueSoon}
                        size="small"
                        color={notification.status === "overdue" ? "error" : "warning"}
                        variant="outlined"
                      />
                    </ListItemButton>
                  ))}
                </List>
              </>
            )}

            {notifications.length > 0 && assignedTasks.length > 0 && <Divider sx={{ my: 1 }} />}

            {assignedTasks.length > 0 && (
              <>
                <Typography variant="overline" color="text.secondary" sx={{ px: 3 }}>
                  {dict.notifications.assignedToMe}
                </Typography>
                <List dense disablePadding>
                  {assignedTasks.map((task) => {
                    const colorKey = PRIORITY_COLOR[task.priority];
                    const borderColor = priorityBorderColor[colorKey] ?? priorityBorderColor.default;
                    return (
                      <ListItemButton
                        key={task.taskId}
                        component={Link}
                        href={routes.board(task.boardId)}
                        onClick={onCloseAction}
                        divider
                        sx={{ borderLeft: 3, borderColor }}
                      >
                        <ListItemText
                          primary={task.taskTitle}
                          secondary={`${task.boardTitle} · ${task.columnTitle}`}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseAction}>{dict.common.cancel}</Button>
      </DialogActions>
    </Dialog>
  );
}
