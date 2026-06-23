"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export type BoardEvent =
  | { boardId: string; type: "refresh" }
  | { boardId: string; type: "task-moved"; taskId: string; columnId: string; orderedIds: string[] };

// A handler returns `true` if it fully applied the event (so the provider skips
// the fallback full refresh); anything else lets the provider refresh.
type Handler = (event: BoardEvent) => boolean | void;

const BoardRealtimeContext = React.createContext<{
  subscribe: (handler: Handler) => () => void;
}>({ subscribe: () => () => {} });

export function useBoardRealtime() {
  return React.useContext(BoardRealtimeContext);
}

// Owns the board's SSE connection and fans events out to in-tree subscribers.
// Events nobody patches (creates, deletes, column changes) fall back to a
// debounced router.refresh(); task moves are applied as deltas by ColumnList.
export function BoardRealtimeProvider({
  boardId,
  children,
}: {
  boardId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const handlersRef = React.useRef(new Set<Handler>());

  const subscribe = React.useCallback((handler: Handler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  React.useEffect(() => {
    const source = new EventSource(`/api/boards/${boardId}/events`);
    let refreshTimer: ReturnType<typeof setTimeout>;

    const scheduleRefresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => router.refresh(), 400);
    };

    source.onmessage = (message) => {
      let event: BoardEvent;
      try {
        event = JSON.parse(message.data) as BoardEvent;
      } catch {
        return;
      }

      let handled = false;
      for (const handler of handlersRef.current) {
        if (handler(event) === true) handled = true;
      }
      if (!handled) scheduleRefresh();
    };

    // EventSource auto-reconnects on error; no manual handling needed.

    return () => {
      clearTimeout(refreshTimer);
      source.close();
    };
  }, [boardId, router]);

  const value = React.useMemo(() => ({ subscribe }), [subscribe]);
  return <BoardRealtimeContext value={value}>{children}</BoardRealtimeContext>;
}
