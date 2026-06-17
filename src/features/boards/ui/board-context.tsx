"use client";

import * as React from "react";
import type { BoardLabel, BoardMemberUser } from "@/features/boards/queries/get-board";

type BoardContextValue = {
  boardId: string;
  boardMembers: BoardMemberUser[];
  boardLabels: BoardLabel[];
};

const BoardContext = React.createContext<BoardContextValue>({
  boardId: "",
  boardMembers: [],
  boardLabels: [],
});

export function BoardProvider({
  children,
  boardId,
  boardMembers,
  boardLabels,
}: BoardContextValue & { children: React.ReactNode }) {
  const value = React.useMemo(
    () => ({ boardId, boardMembers, boardLabels }),
    [boardId, boardMembers, boardLabels],
  );
  return <BoardContext value={value}>{children}</BoardContext>;
}

export function useBoardContext() {
  return React.useContext(BoardContext);
}
