"use client";

import * as React from "react";
import { useTransition } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupIcon from "@mui/icons-material/Group";
import Link from "next/link";
import { inviteMember } from "@/features/boards/actions/invite-member";
import { removeMember } from "@/features/boards/actions/remove-member";
import { BoardMembersDialog } from "@/features/boards/ui/board-members-dialog";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useActionFeedback } from "@/shared/lib/use-action-feedback";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { routes } from "@/shared/lib/routes";
import type { BoardWithColumns } from "@/features/boards/queries/get-board";

export function BoardHeader({
  boardId,
  title,
  owner,
  members,
  isOwner,
  currentUserId,
}: {
  boardId: string;
  title: string;
  owner: BoardWithColumns["owner"];
  members: BoardWithColumns["members"];
  isOwner: boolean;
  currentUserId: string;
}) {
  const { dict } = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [membersOpen, setMembersOpen] = React.useState(false);
  const { error, run, clearError } = useActionFeedback();

  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
      <Button component={Link} href={routes.boards()} startIcon={<ArrowBackIcon />} size="small">
        {dict.nav.boards}
      </Button>
      <Typography variant="h4" component="h1" noWrap sx={{ flexGrow: 1 }}>
        {title}
      </Typography>
      <Tooltip title={dict.boards.manageMembers}>
        <IconButton onClick={() => setMembersOpen(true)}>
          <GroupIcon />
        </IconButton>
      </Tooltip>

      <BoardMembersDialog
        open={membersOpen}
        owner={owner}
        members={members}
        currentUserId={currentUserId}
        isOwner={isOwner}
        pending={isPending}
        onCloseAction={() => setMembersOpen(false)}
        onInviteAction={(email) => {
          startTransition(() => run(() => inviteMember({ boardId, email })));
        }}
        onRemoveAction={(memberId) => {
          setMembersOpen(false);
          startTransition(() => run(() => removeMember({ boardId, memberId })));
        }}
      />

      <ErrorSnackbar error={error} onCloseAction={clearError} />
    </Stack>
  );
}
