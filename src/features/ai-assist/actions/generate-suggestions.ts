"use server";

import { prisma } from "@/shared/lib/db/prisma";
import { runAction } from "@/shared/lib/actions/run-action";
import { ErrorCode, err, ok } from "@/shared/lib/actions/result";
import { boardAccessFilter } from "@/shared/lib/auth/board-access";
import { generateSuggestionsSchema, suggestionsResponseSchema } from "@/features/ai-assist/schema/ai-assist-schema";
import { buildBoardSummary } from "@/features/ai-assist/lib/build-board-summary";
import { requestSuggestions } from "@/features/ai-assist/lib/gemini-client";
import { env } from "@/shared/lib/env";

export const generateSuggestions = runAction({
  schema: generateSuggestionsSchema,
  handler: async ({ boardId }, session) => {
    if (!env.GEMINI_API_KEY) {
      return err(ErrorCode.AI_UNAVAILABLE);
    }

    const board = await prisma.board.findFirst({
      where: { id: boardId, ...boardAccessFilter(session.userId) },
      include: {
        columns: {
          orderBy: { order: "asc" },
          include: { tasks: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!board) {
      return err(ErrorCode.NOT_FOUND);
    }

    try {
      const raw = await requestSuggestions(buildBoardSummary(board));
      const parsed = suggestionsResponseSchema.safeParse(raw);
      return ok({ suggestions: parsed.success ? parsed.data : [] });
    } catch (error) {
      console.error(error);
      return err(ErrorCode.AI_UNAVAILABLE);
    }
  },
});
