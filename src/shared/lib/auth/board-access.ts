import "server-only";

// Reusable Prisma where-fragment: boards the user can access (owner or member).
export function boardAccessFilter(userId: string) {
  return { OR: [{ ownerId: userId }, { members: { some: { userId } } }] };
}
