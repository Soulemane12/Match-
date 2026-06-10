import { NextRequest, NextResponse } from "next/server";
import { generateCollisionResult, type CollisionResult } from "../../../lib/mockCollision";
import { MATCH_MODES, type MatchMode, type Participant } from "../../../lib/storage";

const responsesUrl = "https://api.openai.com/v1/responses";

const collisionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "matchScore",
    "verdictTitle",
    "verdictSummary",
    "agentDebate",
    "compatibilityBreakdown",
    "risks",
    "recommendedOutcome",
    "roleSplitOrRules",
    "firstMessage",
    "nextSteps",
    "modeSpecific",
  ],
  properties: {
    matchScore: { type: "number" },
    verdictTitle: { type: "string" },
    verdictSummary: { type: "string" },
    agentDebate: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["agent", "message"],
        properties: {
          agent: {
            type: "string",
            enum: ["User A Agent", "User B Agent", "Judge Agent", "Risk Agent"],
          },
          message: { type: "string" },
        },
      },
    },
    compatibilityBreakdown: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "score", "explanation"],
        properties: {
          label: { type: "string" },
          score: { type: "number" },
          explanation: { type: "string" },
        },
      },
    },
    risks: { type: "array", items: { type: "string" } },
    recommendedOutcome: { type: "string" },
    roleSplitOrRules: { type: "string" },
    firstMessage: { type: "string" },
    nextSteps: { type: "array", items: { type: "string" } },
    modeSpecific: {
      type: "object",
      additionalProperties: false,
      required: ["title", "items"],
      properties: {
        title: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["label", "value"],
            properties: {
              label: { type: "string" },
              value: { type: "string" },
            },
          },
        },
      },
    },
  },
};

function extractOutputText(response: unknown) {
  const directText = (response as { output_text?: string }).output_text;
  if (directText) {
    return directText;
  }

  const output = (response as { output?: unknown[] }).output;
  if (!Array.isArray(output)) {
    return "";
  }

  return output
    .flatMap((item) => {
      const content = (item as { content?: unknown[] }).content;
      return Array.isArray(content) ? content : [];
    })
    .map((content) => (content as { text?: string }).text ?? "")
    .join("");
}

async function createOpenAIResponse({
  apiKey,
  model,
  input,
  json,
}: {
  apiKey: string;
  model: string;
  input: string;
  json?: boolean;
}) {
  const response = await fetch(responsesUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input,
      reasoning: { effort: model.includes("nano") ? "minimal" : "low" },
      text: json
        ? {
            format: {
              type: "json_schema",
              name: "matchmode_collision_result",
              schema: collisionSchema,
              strict: true,
            },
            verbosity: "medium",
          }
        : { format: { type: "text" }, verbosity: "low" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  return extractOutputText(await response.json());
}

function isMatchMode(value: unknown): value is MatchMode {
  return typeof value === "string" && MATCH_MODES.includes(value as MatchMode);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    mode?: unknown;
    participants?: unknown;
  } | null;

  if (!body || !isMatchMode(body.mode) || !Array.isArray(body.participants)) {
    return NextResponse.json({ error: "Invalid collision input" }, { status: 400 });
  }

  const participants = body.participants.slice(0, 2) as Participant[];

  if (participants.length < 2) {
    return NextResponse.json(
      { error: "Two participants are required" },
      { status: 400 },
    );
  }

  const fallback = generateCollisionResult({
    mode: body.mode,
    participants: [participants[0], participants[1]],
  });
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ result: fallback, provider: "mock" });
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-nano";

  try {
    const finalJson = await createOpenAIResponse({
      apiKey,
      model,
      json: true,
      input: `You are MatchMode AI. Simulate User A Agent, User B Agent, Risk Agent, and Judge Agent interacting, then produce a structured verdict for whether these two LinkedIn-style profiles are a good match for the selected relationship mode.

Mode: ${body.mode}
User A: ${JSON.stringify(participants[0])}
User B: ${JSON.stringify(participants[1])}

Rules:
- Return only the JSON object matching the schema.
- The same two users must get different verdicts for different modes.
- Be concrete, not generic.
- For Roommate mode, explicitly warn that LinkedIn data is not enough and lifestyle data is needed.
- matchScore must be 0 to 100.
- agentDebate must include User A Agent, User B Agent, Judge Agent, and Risk Agent.
- Include practical role split/rules, first message, and next steps.`,
    });

    return NextResponse.json({
      result: JSON.parse(finalJson) as CollisionResult,
      provider: "openai",
      model,
    });
  } catch {
    return NextResponse.json({ result: fallback, provider: "mock_fallback" });
  }
}
