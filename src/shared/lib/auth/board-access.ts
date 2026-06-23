import "server-only";

// Reusable Prisma where-fragment: boards the user can access (owner or any member).
export function boardAccessFilter(userId: string) {
  return { OR: [{ ownerId: userId }, { members: { some: { userId } } }] };
}

// Write-access filter: owner or EDITOR member. Used in mutating actions to
// block VIEWER members from modifying board content.
export function boardEditorFilter(userId: string) {
  return {
    OR: [{ ownerId: userId }, { members: { some: { userId, role: "EDITOR" as const } } }],
  };
}

// Where-fragment selecting a board the user may edit. Use in findFirst/findMany
// so VIEWER members and outsiders resolve to NOT_FOUND.
export function boardEditableWhere(boardId: string, userId: string) {
  return { id: boardId, ...boardEditorFilter(userId) };
}

// Where-fragment selecting a task only if the user may edit its board. Centralizes
// the column→board access join repeated across every task mutation.
export function taskEditableWhere(taskId: string, boardId: string, userId: string) {
  return { id: taskId, column: { boardId, board: boardEditorFilter(userId) } };
}

// Where-fragment selecting a column the user may edit within a given board.
export function columnEditableWhere(columnId: string, boardId: string, userId: string) {
  return { id: columnId, boardId, board: boardEditorFilter(userId) };
}
