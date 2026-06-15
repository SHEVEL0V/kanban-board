import { getBoards } from "@/features/boards/queries/get-boards";
import { BoardList } from "@/features/boards/ui/board-list";
import { verifySession } from "@/shared/lib/dal";

export default async function BoardsPage() {
  const boards = await getBoards();
  const { userId } = await verifySession();

  return <BoardList boards={boards} currentUserId={userId} />;
}
