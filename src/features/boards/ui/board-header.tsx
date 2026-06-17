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
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { inviteMember } from "@/features/boards/actions/invite-member";
import { removeMember } from "@/features/boards/actions/remove-member";
import { deleteLabel } from "@/features/labels/actions/delete-label";
import { renameBoard } from "@/features/boards/actions/rename-board";
import { deleteBoard } from "@/features/boards/actions/delete-board";
import { BoardMembersDialog } from "@/features/boards/ui/board-members-dialog";
import { BoardLabelsDialog } from "@/features/boards/ui/board-labels-dialog";
import { BoardSettingsDialog } from "@/features/boards/ui/board-settings-dialog";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useActionFeedback } from "@/shared/lib/actions/use-action-feedback";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import { routes } from "@/shared/lib/routing/routes";
import type { ErrorCode } from "@/shared/lib/actions/result";
import type { BoardLabel, BoardWithColumns } from "@/features/boards/queries/get-board";

export function BoardHeader({
  boardId,
  title,
  owner,
  members,
  labels,
  isOwner,
  currentUserId,
}: {
  boardId: string;
  title: string;
  owner: BoardWithColumns["owner"];
  members: BoardWithColumns["members"];
  labels: BoardLabel[];
  isOwner: boolean;
  currentUserId: string;
}) {
  const { dict } = useDictionary();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSettingsPending, startSettingsTransition] = useTransition();
  const [membersOpen, setMembersOpen] = React.useState(false);
  const [labelsOpen, setLabelsOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const { error, run, clearError } = useActionFeedback();
  const [settingsError, setSettingsError] = React.useState<ErrorCode | null>(null);

  const handleRename = (newTitle: string) => {
    setSettingsOpen(false);
    startSettingsTransition(() =>
      run(() => renameBoard({ boardId, title: newTitle })),
    );
  };

  // Delete needs a client-side redirect after server action succeeds.
  const handleDelete = () => {
    setSettingsOpen(false);
    startSettingsTransition(async () => {
      const result = await deleteBoard({ boardId });
      if (result.ok) {
        router.push(routes.boards());
      } else {
        setSettingsError(result.code);
      }
    });
  };

  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
      <Button component={Link} href={routes.boards()} startIcon={<ArrowBackIcon />} size="small">
        {dict.nav.boards}
      </Button>
      <Typography variant="h4" component="h1" noWrap sx={{ flexGrow: 1 }}>
        {title}
      </Typography>

      <Tooltip title={dict.boards.manageLabels}>
        <IconButton onClick={() => setLabelsOpen(true)}>
          <LocalOfferIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={dict.boards.manageMembers}>
        <IconButton onClick={() => setMembersOpen(true)}>
          <GroupIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={dict.boards.boardSettings}>
        <IconButton onClick={() => setSettingsOpen(true)}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <BoardLabelsDialog
        open={labelsOpen}
        labels={labels}
        pending={isPending}
        onCloseAction={() => setLabelsOpen(false)}
        onDeleteAction={(labelId) => {
          setLabelsOpen(false);
          startTransition(() => run(() => deleteLabel({ boardId, labelId })));
        }}
      />

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

      <BoardSettingsDialog
        open={settingsOpen}
        currentTitle={title}
        isOwner={isOwner}
        pending={isSettingsPending}
        onCloseAction={() => setSettingsOpen(false)}
        onRenameAction={handleRename}
        onDeleteAction={handleDelete}
      />

      <ErrorSnackbar error={error} onCloseAction={clearError} />
      <ErrorSnackbar error={settingsError} onCloseAction={() => setSettingsError(null)} />
    </Stack>
  );
}
