"use client";

import * as React from "react";
import { useTransition } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Column as ColumnModel } from "@/generated/prisma/client";
import { updateColumn } from "@/features/columns/actions/update-column";
import { deleteColumn } from "@/features/columns/actions/delete-column";
import { TaskCard } from "@/features/tasks/ui/task-card";
import { AddTaskButton } from "@/features/tasks/ui/add-task-button";
import { taskMatchesFilters, type TaskFilters } from "@/features/columns/lib/task-filters";
import type { TaskWithComments } from "@/features/boards/queries/get-board";
import { ColumnSettingsDialog } from "@/features/columns/ui/column-settings-dialog";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useActionFeedback } from "@/shared/lib/actions/use-action-feedback";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { useBoardContext } from "@/features/boards/ui/board-context";

export function Column({
  column,
  filters,
  currentUserId,
}: {
  column: ColumnModel & { tasks: TaskWithComments[] };
  filters: TaskFilters;
  currentUserId: string;
}) {
  const { dict } = useDictionary();
  const { isViewer } = useBoardContext();
  const [isPending, startTransition] = useTransition();
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const closeMenu = () => setMenuAnchor(null);
  const openSettings = () => { closeMenu(); setSettingsOpen(true); };
  const openDelete = () => { closeMenu(); setDeleteOpen(true); };
  const { error, run, clearError } = useActionFeedback();

  const hasTasks = column.tasks.length > 0;
  const hasVisibleTasks = column.tasks.some((task) => taskMatchesFilters(task, filters));
  const overLimit = column.wipLimit !== null && column.tasks.length > column.wipLimit;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "column" },
  });

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      sx={{
        width: 280,
        flexShrink: 0,
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        opacity: isDragging ? 0.5 : 1,
        transform: CSS.Translate.toString(transform),
        transition,
        touchAction: "none",
        ...(column.isCompletion && {
          borderColor: "success.main",
          borderWidth: 2,
        }),
        ...(overLimit && {
          borderColor: "error.main",
          borderWidth: 2,
        }),
      }}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.5, minWidth: 0 }}>
          {!isViewer && (
            <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: "grab" }}>
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          )}
          <Typography variant="subtitle1" noWrap>
            {column.title}
          </Typography>
          {column.isCompletion ? (
            <CheckCircleOutlinedIcon fontSize="small" color="success" sx={{ flexShrink: 0 }} />
          ) : null}
          {column.wipLimit !== null ? (
            <Chip
              label={`${column.tasks.length}/${column.wipLimit}`}
              size="small"
              color={overLimit ? "error" : "default"}
              variant="outlined"
            />
          ) : null}
        </Stack>
        {!isViewer && (
          <IconButton size="small" sx={{ flexShrink: 0 }} onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={openSettings}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{dict.columns.settingsTitle}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={openDelete} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "inherit" }}><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{dict.common.delete}</ListItemText>
        </MenuItem>
      </Menu>

      <Stack spacing={1}>
        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              boardId={column.boardId}
              currentUserId={currentUserId}
              hidden={!taskMatchesFilters(task, filters)}
            />
          ))}
        </SortableContext>
      </Stack>

      {hasTasks && !hasVisibleTasks ? (
        <Typography variant="caption" color="text.secondary">
          {dict.filters.noMatches}
        </Typography>
      ) : null}

      <AddTaskButton columnId={column.id} boardId={column.boardId} />

      <ColumnSettingsDialog
        open={settingsOpen}
        dialogTitle={dict.columns.settingsTitle}
        defaultTitle={column.title}
        defaultWipLimit={column.wipLimit}
        defaultIsCompletion={column.isCompletion}
        pending={isPending}
        onCloseAction={() => setSettingsOpen(false)}
        onSubmitAction={(title, wipLimit, isCompletion) => {
          setSettingsOpen(false);
          startTransition(() => run(() => updateColumn({ columnId: column.id, title, wipLimit, isCompletion })));
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={dict.common.delete}
        description={dict.columns.deleteConfirm.replace("{title}", column.title)}
        onCloseAction={() => setDeleteOpen(false)}
        onConfirmAction={() => {
          startTransition(() =>
            run(() => deleteColumn({ columnId: column.id, boardId: column.boardId })),
          );
        }}
      />

      <ErrorSnackbar error={error} onCloseAction={clearError} />
    </Paper>
  );
}
