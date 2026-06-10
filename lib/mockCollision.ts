export type AgentMessage = {
  agent: "User A Agent" | "User B Agent" | "Judge Agent" | "Risk Agent";
  message: string;
};

export type CompatibilityItem = {
  label: string;
  score: number;
  explanation: string;
};

export type CollisionResult = {
  matchScore: number;
  verdictTitle: string;
  verdictSummary: string;
  agentDebate: AgentMessage[];
  compatibilityBreakdown: CompatibilityItem[];
  risks: string[];
  recommendedOutcome: string;
  roleSplitOrRules: string;
  firstMessage: string;
  nextSteps: string[];
  modeSpecific: {
    title: string;
    items: { label: string; value: string }[];
  };
};
