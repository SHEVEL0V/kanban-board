// Single source of truth for internal URLs — avoids hardcoded path template
// literals scattered across features.
export const routes = {
  home: () => "/",
  login: () => "/login",
  register: () => "/register",
  boards: () => "/boards",
  board: (boardId: string) => `/boards/${boardId}`,
} as const;
