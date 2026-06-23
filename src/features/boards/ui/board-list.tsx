"use client";

import * as React from "react";
import { useTransition } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import { createBoard } from "@/features/boards/actions/create-board";
import { BoardCard } from "@/features/boards/ui/board-card";
import { CreateBoardDialog } from "@/features/boards/ui/create-board-dialog";
import { ErrorSnackbar } from "@/shared/ui/components/error-snackbar";
import { useActionFeedback } from "@/shared/lib/actions/use-action-feedback";
import { useDictionary } from "@/shared/i18n/dictionary-context";
import type { BoardTemplate } from "@/features/boards/lib/board-templates";

type BoardSummary = {
  id: string;
  title: string;
  ownerId: string;
  owner: { id: string; name: string };
  members: { id: string; role: import("@/generated/prisma/client").BoardRole; user: { id: string; name: string; email: string } }[];
};

export function BoardList({
  boards,
  currentUserId,
}: {
  boards: BoardSummary[];
  currentUserId: string;
}) {
  const { dict } = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = React.useState(false);
  const { error, run, clearError } = useActionFeedback();

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          {dict.boards.title}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          {dict.boards.newBoard}
        </Button>
      </Stack>

      {boards.length === 0 ? (
        <Typography color="text.secondary">{dict.boards.empty}</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 2,
          }}
        >
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              isOwner={board.ownerId === currentUserId}
              currentUserId={currentUserId}
            />
          ))}
        </Box>
      )}

      <CreateBoardDialog
        open={createOpen}
        pending={isPending}
        onCloseAction={() => setCreateOpen(false)}
        onSubmitAction={(title, template: BoardTemplate) => {
          setCreateOpen(false);
          startTransition(() => run(() => createBoard({ title, columns: template.columns })));
        }}
      />

      <ErrorSnackbar error={error} onCloseAction={clearError} />
    </Box>
  );
}
