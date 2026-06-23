import { type NextRequest } from "next/server";
import { verifySession } from "@/shared/lib/auth/dal";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";
import { prisma } from "@/shared/lib/db/prisma";
import { subscribeBoard } from "@/shared/lib/realtime/board-events";

export const dynamic = "force-dynamic";

// SSE endpoint: streams board change events to connected clients. Subscribes to
// the shared in-process emitter (one LISTEN connection per instance) — opening a
// board no longer costs a dedicated Postgres connection.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;

  let userId: string;
  try {
    ({ userId } = await verifySession());
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const board = await prisma.board.findFirst({
    where: { id: boardId, ...boardAccessFilter(userId) },
    select: { id: true },
  });
  if (!board) {
    return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // stream already closed
        }
      };

      unsubscribe = await subscribeBoard(boardId, (event) => {
        enqueue(`data: ${JSON.stringify(event)}\n\n`);
      });

      // Keep the connection alive through proxies.
      heartbeat = setInterval(() => enqueue(": heartbeat\n\n"), 25_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });

      enqueue(": connected\n\n");
    },
    cancel() {
      clearInterval(heartbeat);
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
