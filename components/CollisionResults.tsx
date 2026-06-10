"use client";

import type { CollisionResult } from "../lib/mockCollision";
import { CopyButton } from "./CopyButton";

function scoreColor(score: number) {
  if (score >= 76) return "text-emerald-200 border-emerald-300/30 bg-emerald-300/10";
  if (score >= 58) return "text-cyan-200 border-cyan-300/30 bg-cyan-300/10";
  return "text-rose-200 border-rose-300/30 bg-rose-300/10";
}

export function CollisionResults({ result }: { result: CollisionResult }) {
  return (
    <section className="rounded-lg border border-cyan-300/20 bg-zinc-950/80 p-5 shadow-2xl shadow-cyan-950/30 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="grid place-items-center rounded-lg border border-white/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18),rgba(24,24,27,0.2)_60%)] p-6">
          <div
            className={`grid h-40 w-40 place-items-center rounded-full border text-center ${scoreColor(
              result.matchScore,
            )}`}
          >
            <div>
              <p className="text-5xl font-black">{result.matchScore}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em]">Score</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Judge verdict
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                {result.verdictTitle}
              </h2>
            </div>
            <CopyButton
              value={`${result.verdictTitle}\n\n${result.verdictSummary}`}
              label="Copy Verdict"
            />
          </div>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            {result.verdictSummary}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
          <p className="text-sm font-semibold text-cyan-200">User A Agent</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {
              result.agentDebate.find((message) => message.agent === "User A Agent")
                ?.message
            }
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm font-semibold text-white">Judge Agent</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {
              result.agentDebate.find((message) => message.agent === "Judge Agent")
                ?.message
            }
          </p>
        </div>
        <div className="rounded-lg border border-fuchsia-300/15 bg-fuchsia-300/[0.04] p-5">
          <p className="text-sm font-semibold text-fuchsia-200">User B Agent</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {
              result.agentDebate.find((message) => message.agent === "User B Agent")
                ?.message
            }
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-white/10 bg-black/20 p-5">
          <h3 className="text-lg font-semibold text-white">Debate feed</h3>
          <div className="mt-4 space-y-3">
            {result.agentDebate.map((message) => (
              <div
                key={`${message.agent}-${message.message}`}
                className="rounded-md border border-white/10 bg-white/[0.035] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {message.agent}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {message.message}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 p-5">
          <h3 className="text-lg font-semibold text-white">Compatibility</h3>
          <div className="mt-4 space-y-4">
            {result.compatibilityBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                  <p className="font-mono text-sm text-cyan-200">{item.score}</p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-cyan-300"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  {item.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <InfoCard title="Risks / Red Flags" items={result.risks} tone="risk" />
        <InfoCard
          title="Next Steps"
          items={result.nextSteps}
          tone="steps"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <TextPanel title="Recommended Outcome" value={result.recommendedOutcome} />
        <TextPanel
          title="Role Split or Rules"
          value={result.roleSplitOrRules}
          copyLabel="Copy Rules"
        />
        <TextPanel
          title="First Message"
          value={result.firstMessage}
          copyLabel="Copy Message"
        />
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-5">
        <h3 className="text-lg font-semibold text-white">
          {result.modeSpecific.title}
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {result.modeSpecific.items.map((item) => (
            <div
              key={item.label}
              className="rounded-md border border-white/10 bg-black/20 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                {item.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "risk" | "steps";
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-300">
            <span
              className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                tone === "risk" ? "bg-rose-300" : "bg-emerald-300"
              }`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TextPanel({
  title,
  value,
  copyLabel,
}: {
  title: string;
  value: string;
  copyLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {title}
        </h3>
        {copyLabel ? <CopyButton value={value} label={copyLabel} /> : null}
      </div>
      <p className="mt-4 text-sm leading-6 text-zinc-300">{value}</p>
    </div>
  );
}
