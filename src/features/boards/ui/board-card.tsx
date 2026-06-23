"use client";

import * as React from "react";
import { useTransition } from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import PeopleIcon from "@mui/icons-material/People";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import { renameBoard } from "@/features/boards/actions/rename-board";
import { deleteBoard } from "@/features/boards/actions/delete-board";
import { inviteMember } from "@/features/boards/actions/invite-member";
import { removeMember } from "@/features/boards/actions/remove-member";
import { updateMemberRole } from "@/features/boards/actions/update-member-role";
import type { BoardRole } from "@/generated/prisma/client";
import { TitleDialog } from "@/shared/ui/components/title-dialog";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { BoardMembersDialog } from "@/features/boards/ui/board-members-dialog";
import { useActionFeedback } from "@/shared/lib/actions/use-action-feedback";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { routes } from "@/shared/lib/routing/routes";

type Board = {
  id: string;
  title: string;
  owner: { id: string; name: string };
  members: { id: string; role: BoardRole; user: { id: string; name: string; email: string } }[];
};

export function BoardCard({
  board,
  isOwner,
  currentUserId,
}: {
  board: Board;
  isOwner: boolean;
  currentUserId: string;
}) {
  const { dict } = useDictionary();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [membersOpen, setMembersOpen] = React.useState(false);
  const { error, run, clearError } = useActionFeedback();

  const closeMenu = () => setMenuAnchor(null);

  const openRename = () => { closeMenu(); setRenameOpen(true); };
  const openMembers = () => { closeMenu(); setMembersOpen(true); };
  const openDelete = () => { closeMenu(); setDeleteOpen(true); };

  return (
    <>
      <Card
        variant="outlined"
        onClick={() => router.push(routes.board(board.id))}
        sx={{
          position: "relative",
          minHeight: 120,
          cursor: "pointer",
          transition: "border-color 0.15s",
          "&:hover": { borderColor: "primary.main" },
        }}
      >
        <CardHeader
          title={
            <Typography variant="h6" noWrap sx={{ pr: 4 }}>
              {board.title}
            </Typography>
          }
          subheader={
            !isOwner ? (
              <Typography variant="caption" color="text.secondary">
                {dict.boards.sharedBy.replace("{name}", board.owner.name)}
              </Typography>
            ) : null
          }
        />
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
          sx={{ position: "absolute", top: 8, right: 8 }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Card>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {isOwner && (
          <MenuItem onClick={openRename}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{dict.boards.boardTitle}</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={openMembers}>
          <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{dict.boards.members}</ListItemText>
        </MenuItem>
        {isOwner && <Divider />}
        {isOwner && (
          <MenuItem onClick={openDelete} sx={{ color: "error.main" }}>
            <ListItemIcon sx={{ color: "inherit" }}><DeleteIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{dict.boards.deleteBoard}</ListItemText>
          </MenuItem>
        )}
      </Menu>

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

      <BoardMembersDialog
        open={membersOpen}
        owner={board.owner}
        members={board.members}
        currentUserId={currentUserId}
        isOwner={isOwner}
        pending={isPending}
        onCloseAction={() => setMembersOpen(false)}
        onInviteAction={(email, role) => {
          startTransition(() => run(() => inviteMember({ boardId: board.id, email, role })));
        }}
        onRemoveAction={(memberId) => {
          startTransition(() => run(() => removeMember({ boardId: board.id, memberId })));
        }}
        onRoleChangeAction={(memberId, role: BoardRole) => {
          startTransition(() => run(() => updateMemberRole({ boardId: board.id, memberId, role })));
        }}
      />

      <ErrorSnackbar error={error} onCloseAction={clearError} />
    </>
  );
}
