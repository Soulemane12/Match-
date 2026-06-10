import { NextRequest, NextResponse } from "next/server";
import type { CollisionResult } from "../../../lib/mockCollision";
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

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured. Add OPENAI_API_KEY to your environment." },
      { status: 503 },
    );
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-nano";

  let finalJson: string;
  try {
    finalJson = await createOpenAIResponse({
    apiKey,
    model,
    json: true,
    input: `You are MatchMode AI. You receive two real LinkedIn profiles and a relationship mode. Your job is to simulate four agents debating the match and produce a structured verdict.

Mode: ${body.mode}

User A LinkedIn Profile:
- Name: ${participants[0].name}
- Headline: ${participants[0].headline || "not provided"}
- Summary/Bio: ${participants[0].summary || "not provided"}
- Skills: ${participants[0].skills || "not provided"}
- Goals: ${participants[0].goals || "not provided"}
- LinkedIn: ${participants[0].linkedinUrl}

User B LinkedIn Profile:
- Name: ${participants[1].name}
- Headline: ${participants[1].headline || "not provided"}
- Summary/Bio: ${participants[1].summary || "not provided"}
- Skills: ${participants[1].skills || "not provided"}
- Goals: ${participants[1].goals || "not provided"}
- LinkedIn: ${participants[1].linkedinUrl}

Instructions:
- Each agent must reason from the actual profile data above — do not invent facts, but do infer likely skills, experience level, and working style from the headline and summary.
- User A Agent argues from User A's perspective and interests.
- User B Agent argues from User B's perspective and interests.
- Risk Agent identifies real friction points based on the profiles.
- Judge Agent gives a final verdict with a concrete matchScore 0-100.
- Be specific to these two people — no generic responses.
- Different modes must produce meaningfully different verdicts for the same pair.
- For Roommate mode, flag that professional data is a weak signal for lifestyle fit.
- Include a concrete role split, a suggested first message, and actionable next steps.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenAI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  try {
    return NextResponse.json({
      result: JSON.parse(finalJson) as CollisionResult,
      provider: "openai",
      model,
    });
  } catch {
    return NextResponse.json({ error: "OpenAI returned invalid JSON" }, { status: 502 });
  }
}
