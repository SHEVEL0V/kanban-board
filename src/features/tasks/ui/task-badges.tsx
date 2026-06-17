"use client";

import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";
import ChecklistIcon from "@mui/icons-material/Checklist";
import { useDictionary } from "@/shared/i18n/dictionary-context";

// Secondary meta indicators on task cards: date, comments, checklist, assignee.
// Priority is intentionally excluded — it's already shown by the left border accent.
// Labels are excluded — rendered as color strips directly by the parent card/row.
export function TaskBadges({
  dueDate,
  commentCount,
  assignee,
  checklistItems,
}: {
  dueDate: Date | null;
  commentCount?: number;
  assignee?: { id: string; name: string } | null;
  checklistItems?: { done: boolean }[];
}) {
  const { locale } = useDictionary();
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "short" });
  // eslint-disable-next-line react-hooks/purity
  const overdue = dueDate !== null && dueDate.getTime() < Date.now();

  const chipSx = {
    fontSize: "0.6875rem",
    "& .MuiChip-icon": { fontSize: 14, ml: "6px" },
    "& .MuiChip-label": { px: "6px" },
  };

  return (
    <Stack direction="row" useFlexGap spacing={0.5} sx={{ flexWrap: "wrap", minWidth: 0, alignItems: "center" }}>
      {dueDate ? (
        <Chip
          icon={<CalendarTodayIcon />}
          label={formatter.format(dueDate)}
          size="small"
          color={overdue ? "error" : "default"}
          variant="outlined"
          sx={chipSx}
        />
      ) : null}
      {commentCount ? (
        <Chip
          icon={<CommentOutlinedIcon />}
          label={commentCount}
          size="small"
          variant="outlined"
          sx={chipSx}
        />
      ) : null}
      {checklistItems && checklistItems.length > 0 ? (
        <Chip
          icon={<ChecklistIcon />}
          label={`${checklistItems.filter((i) => i.done).length}/${checklistItems.length}`}
          size="small"
          color={checklistItems.every((i) => i.done) ? "success" : "default"}
          variant="outlined"
          sx={chipSx}
        />
      ) : null}
      {assignee ? (
        <Chip
          avatar={<Avatar sx={{ width: 16, height: 16, fontSize: "0.6rem" }}>{assignee.name[0]}</Avatar>}
          label={assignee.name}
          size="small"
          variant="outlined"
          sx={chipSx}
        />
      ) : null}
    </Stack>
  );
}
