"use client";

import * as React from "react";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { NotificationDialog } from "@/features/notifications/ui/notification-dialog";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import type { DueTaskNotification } from "@/features/notifications/queries/get-due-task-notifications";

export function NotificationBell({ notifications }: { notifications: DueTaskNotification[] }) {
  const { dict } = useDictionary();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Tooltip title={dict.notifications.title}>
        <IconButton color="inherit" onClick={() => setOpen(true)}>
          <Badge badgeContent={notifications.length} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <NotificationDialog open={open} notifications={notifications} onCloseAction={() => setOpen(false)} />
    </>
  );
}
