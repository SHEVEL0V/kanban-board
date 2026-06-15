"use client";

import * as React from "react";
import { useTransition } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Link from "next/link";
import { renameBoard } from "@/features/boards/actions/rename-board";
import { deleteBoard } from "@/features/boards/actions/delete-board";
import { TitleDialog } from "@/shared/ui/components/title-dialog";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useActionFeedback } from "@/shared/lib/use-action-feedback";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { routes } from "@/shared/lib/routes";

export function BoardCard({
  board,
  isOwner,
}: {
  board: { id: string; title: string; owner: { name: string } };
  isOwner: boolean;
}) {
  const { dict } = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const { error, run, clearError } = useActionFeedback();

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" noWrap>
          {board.title}
        </Typography>
        {!isOwner ? (
          <Typography variant="caption" color="text.secondary">
            {dict.boards.sharedBy.replace("{name}", board.owner.name)}
          </Typography>
        ) : null}
      </CardContent>
      <CardActions sx={{ justifyContent: "space-between" }}>
        <Button component={Link} href={routes.board(board.id)} size="small">
          {dict.boards.open}
        </Button>
        {isOwner ? (
          <div>
            <IconButton size="small" onClick={() => setRenameOpen(true)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => setDeleteOpen(true)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        ) : null}
      </CardActions>

      <TitleDialog
        open={renameOpen}
        dialogTitle={dict.boards.boardTitle}
        label={dict.boards.boardTitle}
        defaultValue={board.title}
        pending={isPending}
        onCloseAction={() => setRenameOpen(false)}
        onSubmitAction={(title) => {
          setRenameOpen(false);
          startTransition(() => run(() => renameBoard({ boardId: board.id, title })));
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={dict.common.delete}
        description={dict.boards.deleteConfirm.replace("{title}", board.title)}
        onCloseAction={() => setDeleteOpen(false)}
        onConfirmAction={() => {
          startTransition(() => run(() => deleteBoard({ boardId: board.id })));
        }}
      />

      <ErrorSnackbar error={error} onCloseAction={clearError} />
    </Card>
  );
}
