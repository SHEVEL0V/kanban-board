import "server-only";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const SUGGESTIONS_RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      taskId: { type: "STRING" },
      taskTitle: { type: "STRING" },
      reason: { type: "STRING" },
      suggestedColumnId: { type: "STRING" },
      suggestedPriority: { type: "STRING", enum: ["LOW", "MEDIUM", "HIGH"] },
    },
    required: ["taskId", "taskTitle", "reason"],
  },
};

const PROMPT_INSTRUCTIONS = `You are a project management assistant for a kanban board. Given the board state below, suggest up to 5 changes that would improve task prioritization or balance work in progress (e.g. move a task out of an over-WIP-limit column, raise the priority of an overdue or due-soon task). Only suggest changes for tasks that actually need one. Respond with a JSON array of suggestions, each with a short "reason" explaining why.`;

export async function requestSuggestions(boardSummary: string): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${PROMPT_INSTRUCTIONS}\n\n${boardSummary}` }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: SUGGESTIONS_RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error("Gemini API returned no content");
  }

  return JSON.parse(text);
}
