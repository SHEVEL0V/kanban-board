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
