import { getBoards } from "@/features/boards/queries/get-boards";
import { BoardList } from "@/features/boards/ui/board-list";

export default async function BoardsPage() {
  const boards = await getBoards();

  return <BoardList boards={boards} />;
}
