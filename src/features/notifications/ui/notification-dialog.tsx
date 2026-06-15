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
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { routes } from "@/shared/lib/routing/routes";
import type { DueTaskNotification } from "@/features/notifications/queries/get-due-task-notifications";

export function NotificationDialog({
  open,
  notifications,
  onCloseAction,
}: {
  open: boolean;
  notifications: DueTaskNotification[];
  onCloseAction: () => void;
}) {
  const { dict, locale } = useDictionary();
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="sm">
      <DialogTitle>{dict.notifications.title}</DialogTitle>
      <DialogContent>
        {notifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {dict.notifications.empty}
          </Typography>
        ) : (
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
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseAction}>{dict.common.cancel}</Button>
      </DialogActions>
    </Dialog>
  );
}
