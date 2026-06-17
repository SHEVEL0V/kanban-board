import Stack from "@mui/material/Stack";
import { getBoard } from "@/features/boards/queries/get-board";
import { getActivityLog } from "@/features/activity/queries/get-activity-log";
import { BoardHeader } from "@/features/boards/ui/board-header";
import { BoardView } from "@/features/columns/ui/board-view";
import { verifySession } from "@/shared/lib/auth/dal";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const [board, activities, { userId }] = await Promise.all([
    getBoard(boardId),
    getActivityLog(boardId),
    verifySession(),
  ]);

  return (
    <Stack spacing={2}>
      <BoardHeader
        boardId={board.id}
        title={board.title}
        owner={board.owner}
        members={board.members}
        labels={board.labels}
        isOwner={board.ownerId === userId}
        currentUserId={userId}
      />
      <BoardView
        boardId={board.id}
        columns={board.columns}
        activities={activities}
        currentUserId={userId}
        boardMembers={[
          { id: board.owner.id, name: board.owner.name },
          ...board.members.map((m) => ({ id: m.user.id, name: m.user.name })),
        ]}
        boardLabels={board.labels}
      />
    </Stack>
  );
}
