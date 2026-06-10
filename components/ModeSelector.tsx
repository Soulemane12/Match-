"use client";

import { MATCH_MODES, type MatchMode } from "../lib/storage";

export const modeDescriptions: Record<MatchMode, string> = {
  "Hackathon Partner":
    "Tests build speed, skill complement, scope control, demo ability, and shipping risk.",
  Roommate:
    "Tests lifestyle compatibility, habits, boundaries, and conflict risk.",
  Cofounder:
    "Tests ambition, commitment, ownership, risk tolerance, and execution fit.",
  "Project Collaborator":
    "Tests ownership clarity, working cadence, feedback style, and delivery reliability.",
  "Mentor / Mentee":
    "Tests experience gap, learning goals, mentor usefulness, cadence, and growth path.",
  "Job Referral":
    "Tests credibility, role fit, strength of ask, shared context, and trust risk.",
  "Study Partner":
    "Tests focus habits, schedule discipline, learning style, and accountability fit.",
  "Club / Team Member":
    "Tests team role clarity, reliability, culture add, and collaboration energy.",
};

export function ModeSelector({
  selectedMode,
  onModeChange,
}: {
  selectedMode: MatchMode;
  onModeChange: (mode: MatchMode) => void;
}) {
  return (
    <div className="w-full max-w-md">
      <label htmlFor="match-mode" className="mb-2 block text-sm font-medium text-zinc-300">
        Step 3 · Match Mode
      </label>
      <select
        id="match-mode"
        className="h-12 w-full rounded-md border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
        value={selectedMode}
        onChange={(event) => onModeChange(event.target.value as MatchMode)}
      >
        {MATCH_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {mode}
          </option>
        ))}
      </select>
      <p className="mt-3 min-h-[72px] rounded-md border border-cyan-300/10 bg-cyan-300/[0.06] px-4 py-3 text-sm leading-6 text-cyan-50/80">
        {modeDescriptions[selectedMode]}
      </p>
    </div>
  );
}
