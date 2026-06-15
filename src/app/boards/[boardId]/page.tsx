import Stack from "@mui/material/Stack";
import { getBoard } from "@/features/boards/queries/get-board";
import { BoardHeader } from "@/features/boards/ui/board-header";
import { ColumnList } from "@/features/columns/ui/column-list";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const board = await getBoard(boardId);

  return (
    <Stack spacing={2}>
      <BoardHeader title={board.title} />
      <ColumnList boardId={board.id} columns={board.columns} />
    </Stack>
  );
}
