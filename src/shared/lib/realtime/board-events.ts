import "server-only";

import { EventEmitter } from "node:events";
import pg from "pg";
import { prisma } from "@/shared/lib/db/prisma";
import { env } from "@/shared/lib/env";

// Single Postgres channel for all boards; the boardId travels in the payload so
// we only ever hold ONE LISTEN connection per server instance regardless of how
// many boards/clients are connected.
const CHANNEL = "board_events";

export type BoardEvent =
  | { boardId: string; type: "refresh" }
  | {
      boardId: string;
      type: "task-moved";
      taskId: string;
      columnId: string;
      orderedIds: string[];
    };

// Survives dev hot-reload so we don't leak listener connections.
type Store = {
  emitter?: EventEmitter;
  client?: pg.Client;
  connecting?: Promise<void>;
};
const globalForEvents = globalThis as unknown as { __boardEvents?: Store };
globalForEvents.__boardEvents ??= {};
const store = globalForEvents.__boardEvents;

function getEmitter(): EventEmitter {
  if (!store.emitter) {
    store.emitter = new EventEmitter();
    store.emitter.setMaxListeners(0); // one listener per open SSE connection
  }
  return store.emitter;
}

function reset() {
  store.client = undefined;
  store.connecting = undefined;
  // Auto-reconnect if anyone is still subscribed.
  if (store.emitter && store.emitter.eventNames().length > 0) {
    setTimeout(() => void ensureListener().catch(() => {}), 1_000);
  }
}

async function ensureListener(): Promise<void> {
  if (store.client) return;
  if (store.connecting) return store.connecting;

  store.connecting = (async () => {
    const client = new pg.Client({ connectionString: env.DIRECT_URL });
    client.on("error", (err) => {
      console.error("[board-events] listener error:", err);
      reset();
    });
    client.on("end", () => reset());

    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);

    client.on("notification", (msg) => {
      if (!msg.payload) return;
      try {
        const event = JSON.parse(msg.payload) as BoardEvent;
        getEmitter().emit(event.boardId, event);
      } catch (err) {
        console.error("[board-events] bad payload:", err);
      }
    });

    store.client = client;
  })();

  try {
    await store.connecting;
  } finally {
    store.connecting = undefined;
  }
}

// Subscribes an in-process handler to a board's events. Returns an unsubscribe fn.
export async function subscribeBoard(
  boardId: string,
  handler: (event: BoardEvent) => void,
): Promise<() => void> {
  await ensureListener();
  const emitter = getEmitter();
  emitter.on(boardId, handler);
  return () => emitter.off(boardId, handler);
}

// Broadcasts an event to every instance via NOTIFY. NOTIFY is a single
// statement, so it works fine through the transaction-mode pool (unlike LISTEN).
export async function publishBoardEvent(event: BoardEvent): Promise<void> {
  try {
    await prisma.$executeRawUnsafe("SELECT pg_notify($1, $2)", CHANNEL, JSON.stringify(event));
  } catch (err) {
    console.error("[board-events] publish failed:", err);
  }
}
