"use client";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { activityLabel } from "@/features/activity/lib/activity-label";
import type { ActivityEntry } from "@/features/activity/queries/get-activity-log";

export function ActivityDialog({
  open,
  activities,
  currentUserId,
  onCloseAction,
}: {
  open: boolean;
  activities: ActivityEntry[];
  currentUserId: string;
  onCloseAction: () => void;
}) {
  const { dict, locale } = useDictionary();
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="sm">
      <DialogTitle>{dict.activity.title}</DialogTitle>
      <DialogContent>
        {activities.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {dict.activity.empty}
          </Typography>
        ) : (
          <List dense disablePadding>
            {activities.map((entry) => (
              <ListItem key={entry.id} disableGutters divider>
                <ListItemText
                  primary={activityLabel(entry, dict, currentUserId)}
                  secondary={formatter.format(entry.createdAt)}
                />
              </ListItem>
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
