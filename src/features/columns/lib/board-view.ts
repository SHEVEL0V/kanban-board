export type BoardViewMode = "board" | "list" | "calendar";

export const BOARD_VIEW_MODES: BoardViewMode[] = ["board", "list", "calendar"];

export function parseBoardViewMode(value: string | null): BoardViewMode {
  return (BOARD_VIEW_MODES as string[]).includes(value ?? "") ? (value as BoardViewMode) : "board";
}
