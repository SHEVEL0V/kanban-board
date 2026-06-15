import Stack from "@mui/material/Stack";
import { getBoard } from "@/features/boards/queries/get-board";
import { BoardHeader } from "@/features/boards/ui/board-header";
import { ColumnList } from "@/features/columns/ui/column-list";
import { verifySession } from "@/shared/lib/dal";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const board = await getBoard(boardId);
  const { userId } = await verifySession();

  return (
    <Stack spacing={2}>
      <BoardHeader
        boardId={board.id}
        title={board.title}
        owner={board.owner}
        members={board.members}
        isOwner={board.ownerId === userId}
        currentUserId={userId}
      />
      <ColumnList boardId={board.id} columns={board.columns} />
    </Stack>
  );
}
