import type { MatchMode, Participant } from "./storage";

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

function textFor(participant: Participant) {
  return [
    participant.name,
    participant.headline,
    participant.summary,
    participant.skills,
    participant.goals,
  ]
    .join(" ")
    .toLowerCase();
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function clamp(score: number) {
  return Math.max(18, Math.min(96, Math.round(score)));
}

function scorePair(
  userA: Participant,
  userB: Participant,
  mode: MatchMode,
): number {
  const a = textFor(userA);
  const b = textFor(userB);
  const combined = `${a} ${b}`;

  let score = 62;

  if (
    hasAny(combined, ["next.js", "typescript", "openai", "backend", "prototype"]) &&
    hasAny(combined, ["figma", "ux", "brand", "research", "pitch"])
  ) {
    score += mode === "Hackathon Partner" ? 24 : 11;
  }

  if (hasAny(combined, ["ship", "mvp", "hackathon", "fast"])) {
    score += mode === "Hackathon Partner" ? 9 : 2;
  }

  if (mode === "Roommate") {
    score = 48;
    if (hasAny(combined, ["quiet", "clean", "early", "budget"])) score += 12;
    if (hasAny(combined, ["late", "guests", "music", "messy"])) score -= 10;
  }

  if (mode === "Cofounder") {
    if (hasAny(combined, ["startup", "founder", "ownership", "growth"])) score += 12;
    if (hasAny(combined, ["trial", "part-time", "student"])) score -= 6;
  }

  if (mode === "Job Referral") {
    if (hasAny(combined, ["credible", "backend", "product", "research"])) score += 8;
    if (!userA.linkedinUrl || !userB.linkedinUrl) score -= 6;
  }

  return clamp(score);
}

function breakdown(
  mode: MatchMode,
  score: number,
  userA: Participant,
  userB: Participant,
): CompatibilityItem[] {
  const names = `${userA.name} and ${userB.name}`;

  const map: Record<MatchMode, CompatibilityItem[]> = {
    "Hackathon Partner": [
      {
        label: "Build speed",
        score: clamp(score + 4),
        explanation: `${names} have enough execution energy to compress discovery, build, and demo into one tight cycle.`,
      },
      {
        label: "Skill complement",
        score: clamp(score + 8),
        explanation:
          "One side can own technical depth while the other sharpens product clarity, UX, and storytelling.",
      },
      {
        label: "Scope control",
        score: clamp(score - 7),
        explanation:
          "The strongest risk is overbuilding. They need a narrow demo path and one impressive moment.",
      },
      {
        label: "Demo ability",
        score: clamp(score + 6),
        explanation:
          "The pair can translate prototype mechanics into a judge-friendly narrative.",
      },
    ],
    Roommate: [
      {
        label: "Lifestyle signal quality",
        score: 42,
        explanation:
          "LinkedIn-style profile data is weak for roommate fit, so this mode needs extra lifestyle answers.",
      },
      {
        label: "Boundary clarity",
        score: clamp(score - 3),
        explanation:
          "Professional goals show some communication style, but house rules must be explicit.",
      },
      {
        label: "Conflict risk",
        score: clamp(100 - score + 20),
        explanation:
          "Different work rhythms can become noise, guest, and schedule friction at home.",
      },
      {
        label: "Budget reliability",
        score: clamp(score + 2),
        explanation:
          "No strong financial signal is available, so budget fit should be verified directly.",
      },
    ],
    Cofounder: [
      {
        label: "Ambition match",
        score: clamp(score + 3),
        explanation:
          "Their goals suggest momentum, but cofounder fit requires commitment and ownership clarity.",
      },
      {
        label: "Execution balance",
        score: clamp(score + 7),
        explanation:
          "Build plus product strategy is a real company-forming combination if trust holds.",
      },
      {
        label: "Risk tolerance",
        score: clamp(score - 8),
        explanation:
          "They need a direct conversation about runway, time commitment, and decision rights.",
      },
      {
        label: "Ownership expectations",
        score: clamp(score - 6),
        explanation:
          "Equity, veto power, and founder titles should not be assumed from a good collaboration score.",
      },
    ],
    "Project Collaborator": [
      {
        label: "Ownership clarity",
        score: clamp(score + 4),
        explanation:
          "The pair can divide deliverables cleanly if they define interfaces and deadlines early.",
      },
      {
        label: "Work style fit",
        score: clamp(score + 2),
        explanation:
          "Their profiles suggest complementary strengths without needing deep personal alignment.",
      },
      {
        label: "Delivery risk",
        score: clamp(score - 4),
        explanation:
          "The main risk is unclear scope or one person becoming the default project manager.",
      },
      {
        label: "Feedback loop",
        score: clamp(score + 1),
        explanation:
          "Frequent reviews will keep quality high and prevent late-stage mismatch.",
      },
    ],
    "Mentor / Mentee": [
      {
        label: "Experience gap",
        score: clamp(score - 2),
        explanation:
          "The relationship works best if one person clearly owns guidance and the other owns action.",
      },
      {
        label: "Learning goals",
        score: clamp(score + 5),
        explanation:
          "The stated goals provide a concrete path for useful mentorship rather than vague advice.",
      },
      {
        label: "Cadence fit",
        score: clamp(score - 5),
        explanation:
          "Mentorship needs a repeatable cadence and lightweight prep to avoid fading out.",
      },
      {
        label: "Growth path",
        score: clamp(score + 3),
        explanation:
          "Their skills map well to progressive milestones and portfolio outcomes.",
      },
    ],
    "Job Referral": [
      {
        label: "Credibility",
        score: clamp(score + 1),
        explanation:
          "The profile story has enough signal for an intro if achievements are concrete.",
      },
      {
        label: "Role fit",
        score: clamp(score + 5),
        explanation:
          "Skills and goals need to map directly to the target role before asking for a referral.",
      },
      {
        label: "Trust risk",
        score: clamp(score - 9),
        explanation:
          "Referral asks are trust-sensitive; the referrer needs proof, not just enthusiasm.",
      },
      {
        label: "Ask quality",
        score: clamp(score + 2),
        explanation:
          "A concise ask with a target role and resume link would make this much stronger.",
      },
    ],
    "Study Partner": [
      {
        label: "Focus alignment",
        score: clamp(score + 2),
        explanation:
          "The pair can help each other if sessions have a clear agenda and measurable output.",
      },
      {
        label: "Complementary strengths",
        score: clamp(score + 4),
        explanation:
          "Different strengths are useful for explaining concepts and reviewing each other's blind spots.",
      },
      {
        label: "Schedule discipline",
        score: clamp(score - 6),
        explanation:
          "This fit depends on consistent meeting times more than profile similarity.",
      },
      {
        label: "Accountability",
        score: clamp(score + 1),
        explanation:
          "Shared goals can support accountability if they commit to weekly deliverables.",
      },
    ],
    "Club / Team Member": [
      {
        label: "Culture add",
        score: clamp(score + 3),
        explanation:
          "Their backgrounds can add breadth to a team if expectations are explicit.",
      },
      {
        label: "Reliability",
        score: clamp(score - 2),
        explanation:
          "The team should assign a small first responsibility before depending on them heavily.",
      },
      {
        label: "Role clarity",
        score: clamp(score + 5),
        explanation:
          "Clear functional roles will prevent duplicated effort and social ambiguity.",
      },
      {
        label: "Team energy",
        score: clamp(score + 1),
        explanation:
          "The pair likely brings useful energy if meetings stay outcome-oriented.",
      },
    ],
  };

  return map[mode];
}

function modeSpecific(mode: MatchMode, userA: Participant, userB: Participant) {
  const firstNames = `${userA.name.split(" ")[0]} and ${userB.name.split(" ")[0]}`;
  const map: Record<MatchMode, CollisionResult["modeSpecific"]> = {
    "Hackathon Partner": {
      title: "Hackathon plan",
      items: [
        {
          label: "Best project idea",
          value:
            "Build a profile-collision demo that scans two people, picks a context, and produces an explainable verdict.",
        },
        {
          label: "Role split",
          value: `${userA.name} owns app architecture, data flow, and prototype mechanics. ${userB.name} owns UX, narrative, pitch deck, and demo polish.`,
        },
        {
          label: "3-hour build plan",
          value:
            "Hour 1: lock story and data model. Hour 2: build the core interaction. Hour 3: polish the demo path and rehearse the pitch.",
        },
        {
          label: "Scope warning",
          value:
            "Do not build auth, billing, or a complex backend. One room, two profiles, one great verdict.",
        },
        {
          label: "Demo strategy",
          value:
            "Show the same pair getting different verdicts across Hackathon Partner and Roommate to make the concept click.",
        },
      ],
    },
    Roommate: {
      title: "Roommate fit",
      items: [
        {
          label: "Data warning",
          value:
            "LinkedIn-style profiles do not reveal cleanliness, guests, noise, sleep, or chore habits. Add lifestyle questions before trusting this verdict.",
        },
        {
          label: "House rules",
          value:
            "Define quiet hours, guest limits, cleaning rotation, shared supply budget, and how conflicts get raised.",
        },
        {
          label: "Conflict risks",
          value:
            "Work intensity and different social rhythms can create resentment if expectations stay implicit.",
        },
        {
          label: "Quiet hours",
          value:
            "Start with 11 PM to 8 AM on weekdays, with advance notice for exceptions.",
        },
        {
          label: "Dealbreakers",
          value:
            "Unpaid rent, repeated late-night guests, ignored chores, or passive-aggressive conflict should end the arrangement.",
        },
      ],
    },
    Cofounder: {
      title: "Founder fit",
      items: [
        {
          label: "Startup direction",
          value:
            "A product-led AI workflow tool is plausible if they validate a painful matching decision first.",
        },
        {
          label: "Equity warning",
          value:
            "Do not split equity based on one exciting session. Use a vesting schedule and define cliffs.",
        },
        {
          label: "Trial project",
          value:
            "Run a two-week sprint with one shipping milestone, one customer interview target, and one decision meeting.",
        },
        {
          label: "Ownership risk",
          value:
            "The biggest risk is unclear final decision authority when product quality and shipping speed conflict.",
        },
        {
          label: "Decision verdict",
          value:
            "Promising enough for a trial sprint, not enough for immediate cofounder commitment.",
        },
      ],
    },
    "Job Referral": {
      title: "Referral strategy",
      items: [
        {
          label: "Referral strength",
          value:
            "Moderate to strong if the candidate can show a concise portfolio artifact or measurable result.",
        },
        {
          label: "Best ask",
          value:
            "Ask for feedback on one target role first, then request a referral only if the fit is obvious.",
        },
        {
          label: "Weak points",
          value:
            "Broad goals and missing proof weaken trust. Add a resume, portfolio link, and target job ID.",
        },
        {
          label: "Message strategy",
          value:
            "Keep it short: context, target role, evidence, and permission to say no.",
        },
      ],
    },
    "Mentor / Mentee": {
      title: "Mentorship plan",
      items: [
        {
          label: "Meeting cadence",
          value:
            "Meet every two weeks for 30 minutes, with the mentee sending notes and blockers 24 hours before.",
        },
        {
          label: "Focus area 1",
          value: "Turn broad ambition into one measurable near-term project.",
        },
        {
          label: "Focus area 2",
          value: "Review work samples and improve the story behind the work.",
        },
        {
          label: "Focus area 3",
          value: "Build a repeatable feedback loop with clear next actions.",
        },
      ],
    },
    "Project Collaborator": {
      title: "Collaboration plan",
      items: [
        {
          label: "Operating model",
          value:
            "Use a shared task board, 48-hour check-ins, and one owner for each deliverable.",
        },
        {
          label: "Definition of done",
          value:
            "Every task needs an output, reviewer, deadline, and acceptance criteria.",
        },
        {
          label: "Handoff rule",
          value:
            "No handoff without context, links, and the next expected decision.",
        },
      ],
    },
    "Study Partner": {
      title: "Study system",
      items: [
        {
          label: "Session format",
          value:
            "Start with 10 minutes of goals, 40 minutes of focus, and 10 minutes teaching back what was learned.",
        },
        {
          label: "Accountability rule",
          value:
            "Each person brings one hard question and leaves with one finished artifact.",
        },
        {
          label: "Review loop",
          value:
            "Use a weekly quiz or teach-back to prove progress instead of just logging hours.",
        },
      ],
    },
    "Club / Team Member": {
      title: "Team onboarding",
      items: [
        {
          label: "Best first role",
          value:
            "Give each person a bounded starter task that proves reliability in one week.",
        },
        {
          label: "Team rule",
          value:
            "Make ownership public: every project needs one lead, one backup, and a visible deadline.",
        },
        {
          label: "Culture check",
          value:
            "Watch whether they improve team momentum or create hidden coordination work.",
        },
      ],
    },
  };

  return {
    ...map[mode],
    items: map[mode].items.map((item) => ({
      ...item,
      value: item.value.replace("The pair", firstNames),
    })),
  };
}

export function generateCollisionResult({
  mode,
  participants,
}: {
  mode: MatchMode;
  participants: [Participant, Participant];
}): CollisionResult {
  const [userA, userB] = participants;
  const score = scorePair(userA, userB, mode);
  const userAGoal = userA.goals || "make progress quickly";
  const userBGoal = userB.goals || "create a strong outcome";
  const highScore = score >= 76;
  const mediumScore = score >= 58;

  const verdictTitle =
    mode === "Roommate"
      ? score >= 62
        ? "Possible, but verify lifestyle data"
        : "Do not decide from profile data alone"
      : highScore
        ? "Strong contextual match"
        : mediumScore
          ? "Promising with guardrails"
          : "High-friction match";

  const verdictSummary =
    mode === "Roommate"
      ? `${userA.name} and ${userB.name} may look compatible professionally, but roommate fit needs direct lifestyle answers about sleep, guests, cleaning, noise, and budget.`
      : `${userA.name} brings ${userA.headline || "useful execution signal"}, while ${userB.name} brings ${userB.headline || "a complementary profile"}. For ${mode}, the fit changes because the relationship rewards different evidence than a generic compatibility score.`;

  const roleSplitOrRules =
    mode === "Roommate"
      ? "Rules: write quiet hours, cleaning rotation, guest policy, shared expense process, and a 24-hour conflict reset rule before agreeing."
      : mode === "Hackathon Partner"
        ? `${userA.name}: technical architecture, prototype, integrations. ${userB.name}: product framing, UX, brand, pitch, user story. Joint rule: cut scope before cutting polish.`
        : mode === "Cofounder"
          ? "Start with a trial project, written decision rights, vesting conversation, weekly founder review, and a no-assumptions equity policy."
          : mode === "Job Referral"
            ? "Referrer reviews proof first. Candidate sends one target role, one paragraph of fit, portfolio/resume link, and a low-pressure ask."
            : `${userA.name} owns their strongest skill lane, ${userB.name} owns theirs, and both agree on cadence, handoffs, and a visible definition of done.`;

  const firstMessage =
    mode === "Roommate"
      ? `Hey ${userB.name}, before we judge roommate fit from profiles, can we compare sleep schedule, cleaning standards, guests, noise, budget, and how we handle conflict?`
      : `Hey ${userB.name}, I think we may have a strong ${mode.toLowerCase()} fit: my goal is ${userAGoal}, and your goal around ${userBGoal} seems complementary. Want to run a short test project or call to validate it?`;

  return {
    matchScore: score,
    verdictTitle,
    verdictSummary,
    agentDebate: [
      {
        agent: "User A Agent",
        message: `${userA.name} is optimizing for ${userAGoal}. The strongest signal is ${userA.skills || "their stated experience"}, but they need clear expectations to avoid wasted motion.`,
      },
      {
        agent: "User B Agent",
        message: `${userB.name} is optimizing for ${userBGoal}. Their profile adds ${userB.skills || "complementary strengths"}, which changes the fit most in ${mode}.`,
      },
      {
        agent: "Risk Agent",
        message:
          mode === "Roommate"
            ? "Professional profiles are not enough for roommate decisions. Missing lifestyle data is the biggest risk."
            : "The main risk is assuming broad compatibility transfers into this specific relationship. Validate with a small test before committing.",
      },
      {
        agent: "Judge Agent",
        message: `${verdictTitle}. The score is ${score}/100 because ${mode} rewards specific evidence, not general chemistry.`,
      },
    ],
    compatibilityBreakdown: breakdown(mode, score, userA, userB),
    risks:
      mode === "Roommate"
        ? [
            "LinkedIn-style data does not show cleanliness, sleep, guests, or noise tolerance.",
            "Different daily rhythms could create friction even if professional profiles look aligned.",
            "Budget, chores, and conflict style need explicit agreement.",
          ]
        : [
            "Strong profiles can still fail if expectations are vague.",
            "The relationship mode may require evidence neither profile currently proves.",
            "Decision rights, cadence, and scope need to be written down early.",
          ],
    recommendedOutcome:
      mode === "Roommate"
        ? "Run a lifestyle questionnaire before making any roommate decision."
        : highScore
          ? "Proceed with a short, high-signal trial and keep the scope narrow."
          : mediumScore
            ? "Proceed only with guardrails, a timebox, and explicit success criteria."
            : "Do not commit yet. Gather more evidence or choose a lower-stakes interaction.",
    roleSplitOrRules,
    firstMessage,
    nextSteps:
      mode === "Roommate"
        ? [
            "Answer sleep, guests, cleaning, budget, and noise questions separately.",
            "Write house rules before agreeing.",
            "Discuss dealbreakers directly.",
            "Try a one-week expectation check if possible.",
          ]
        : [
            "Run a 30-minute alignment call focused only on this relationship mode.",
            "Define a small trial with one measurable output.",
            "Write roles, cadence, and decision rights.",
            "Review fit after the trial before increasing commitment.",
          ],
    modeSpecific: modeSpecific(mode, userA, userB),
  };
}
