"use client";

import * as React from "react";
import type { BoardLabel, BoardMemberUser } from "@/features/boards/queries/get-board";

type BoardContextValue = {
  boardId: string;
  boardMembers: BoardMemberUser[];
  boardLabels: BoardLabel[];
  isViewer: boolean;
};

const BoardContext = React.createContext<BoardContextValue>({
  boardId: "",
  boardMembers: [],
  boardLabels: [],
  isViewer: false,
});

export function BoardProvider({
  children,
  boardId,
  boardMembers,
  boardLabels,
  isViewer,
}: BoardContextValue & { children: React.ReactNode }) {
  const value = React.useMemo(
    () => ({ boardId, boardMembers, boardLabels, isViewer }),
    [boardId, boardMembers, boardLabels, isViewer],
  );
  return <BoardContext value={value}>{children}</BoardContext>;
}

export function useBoardContext() {
  return React.useContext(BoardContext);
}
