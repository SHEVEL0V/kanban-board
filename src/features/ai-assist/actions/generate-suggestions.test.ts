import { ErrorCode } from "@/shared/lib/actions/result";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/shared/lib/realtime/board-events", () => ({ publishBoardEvent: vi.fn() }));
vi.mock("@/shared/lib/auth/dal", () => ({
  verifySession: vi.fn(async () => ({ userId: USER_ID })),
}));

// Mutable env so individual tests can drop the API key.
const envMock = vi.hoisted(() => ({ env: { GEMINI_API_KEY: "test-key", GEMINI_MODEL: "" } }));
vi.mock("@/shared/lib/env", () => envMock);

const geminiMock = vi.hoisted(() => ({ requestSuggestions: vi.fn() }));
vi.mock("@/features/ai-assist/lib/gemini-client", () => geminiMock);

const prismaMock = vi.hoisted(() => ({ board: { findFirst: vi.fn() } }));
vi.mock("@/shared/lib/db/prisma", () => ({ prisma: prismaMock }));

const USER_ID = "user-1";

import { generateSuggestions } from "./generate-suggestions";

const baseInput = { boardId: "board-1" };

// Minimal board shape buildBoardSummary needs.
const board = {
  title: "Board",
  columns: [{ id: "c1", title: "To Do", wipLimit: null, order: 1, tasks: [] }],
};

function suggestion(taskId: string) {
  return { taskId, taskTitle: `Task ${taskId}`, reason: "needs attention" };
}

beforeEach(() => {
  vi.clearAllMocks();
  envMock.env.GEMINI_API_KEY = "test-key";
  prismaMock.board.findFirst.mockResolvedValue(board);
  geminiMock.requestSuggestions.mockResolvedValue([]);
});

describe("generateSuggestions", () => {
  it("returns AI_UNAVAILABLE when no API key is configured", async () => {
    envMock.env.GEMINI_API_KEY = "";

    const result = await generateSuggestions(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.AI_UNAVAILABLE);
    expect(prismaMock.board.findFirst).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when the board is not accessible", async () => {
    prismaMock.board.findFirst.mockResolvedValue(null);

    const result = await generateSuggestions(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.NOT_FOUND);
    expect(geminiMock.requestSuggestions).not.toHaveBeenCalled();
  });

  it("returns the suggestions on a valid model response", async () => {
    geminiMock.requestSuggestions.mockResolvedValue([suggestion("t1"), suggestion("t2")]);

    const result = await generateSuggestions(baseInput);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.suggestions).toHaveLength(2);
  });

  it("drops duplicate suggestions for the same task, keeping the first", async () => {
    geminiMock.requestSuggestions.mockResolvedValue([
      { ...suggestion("t1"), reason: "first" },
      { ...suggestion("t1"), reason: "second" },
      suggestion("t2"),
    ]);

    const result = await generateSuggestions(baseInput);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.suggestions.map((s) => s.taskId)).toEqual(["t1", "t2"]);
      expect(result.data.suggestions[0]!.reason).toBe("first");
    }
  });

  it("returns an empty list when the model response fails validation", async () => {
    geminiMock.requestSuggestions.mockResolvedValue([{ nonsense: true }]);

    const result = await generateSuggestions(baseInput);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.suggestions).toEqual([]);
  });

  it("returns AI_UNAVAILABLE when the Gemini call throws", async () => {
    geminiMock.requestSuggestions.mockRejectedValue(new Error("network down"));

    const result = await generateSuggestions(baseInput);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(ErrorCode.AI_UNAVAILABLE);
  });
});
