import { routes } from "@/shared/lib/routing/routes";

// Centralized registry of paths invalidated by mutations — keeps revalidatePath()
// calls inside runAction out of individual feature actions.
export const CacheTags = {
  boards: () => routes.boards(),
  board: (boardId: string) => routes.board(boardId),
} as const;
