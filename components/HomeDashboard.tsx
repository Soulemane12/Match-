"use client";

import { useEffect, useMemo, useState } from "react";
import { CollisionResults } from "./CollisionResults";
import { ModeSelector } from "./ModeSelector";
import { ParticipantCard } from "./ParticipantCard";
import { generateCollisionResult, type CollisionResult } from "../lib/mockCollision";
import {
  createParticipant,
  getCurrentRoom,
  isLocalStorageAvailable,
  replaceParticipants,
  resetRoom,
  type MatchMode,
  type Participant,
  type Room,
} from "../lib/storage";

const loadingSteps = [
  "Reading profiles",
  "Creating profile agents",
  "Simulating interaction",
  "Checking risks",
  "Judge evaluating",
  "Generating verdict",
];

const builderDesignerPair = [
  createParticipant({
    name: "Avery Stone",
    linkedinUrl: "https://linkedin.com/in/avery-stone-ai-builder",
    headline: "Full-stack AI builder · Next.js, TypeScript, OpenAI",
    summary:
      "Fast prototype builder who has shipped hackathon demos, map products, AI workflows, backend services, and polished MVPs under tight deadlines.",
    skills:
      "Next.js, TypeScript, OpenAI, maps, backend, hackathons, fast prototyping",
    goals: "ship an MVP quickly, win a demo, validate a real product wedge",
    imageUrl: "",
  }),
  createParticipant({
    name: "Maya Chen",
    linkedinUrl: "https://linkedin.com/in/maya-chen-product-design",
    headline: "Product designer and strategist · Figma, UX, brand, pitch",
    summary:
      "Designer-strategist who turns messy product ideas into clear flows, visual systems, compelling decks, research insights, and judge-friendly narratives.",
    skills: "Figma, UX, branding, pitch decks, user research, product strategy",
    goals: "make a polished and explainable product, sharpen the story, impress judges",
    imageUrl: "",
  }),
] satisfies Participant[];

const roommatePair = [
  createParticipant({
    name: "Jordan Rivera",
    linkedinUrl: "https://linkedin.com/in/jordan-rivera-student",
    headline: "Computer science student · early schedule · quiet study habits",
    summary:
      "Morning-focused student who likes a clean kitchen, quiet nights, shared calendars, and direct conversations before problems build up.",
    skills: "quiet, clean, early schedule, budget conscious, direct communication",
    goals: "stable study routine, predictable rent, calm apartment environment",
    imageUrl: "",
  }),
  createParticipant({
    name: "Sam Patel",
    linkedinUrl: "https://linkedin.com/in/sam-patel-student",
    headline: "Marketing student · late-night creative work · social organizer",
    summary:
      "Creative student who works late, hosts project groups, likes music while working, and prefers flexible shared-space rules.",
    skills: "late schedule, social, guests, music, flexible chores, group projects",
    goals: "make friends, keep rent affordable, have a flexible apartment vibe",
    imageUrl: "",
  }),
] satisfies Participant[];

function refreshRoom() {
  return getCurrentRoom();
}

export function HomeDashboard() {
  const [storageError, setStorageError] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [origin, setOrigin] = useState("");
  const [selectedMode, setSelectedMode] = useState<MatchMode>("Hackathon Partner");
  const [result, setResult] = useState<CollisionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isLocalStorageAvailable()) {
        setStorageError(
          "localStorage is unavailable. Enable browser storage to run the MatchMode local demo.",
        );
        return;
      }

      setOrigin(window.location.origin);
      setRoom(refreshRoom());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const syncRoom = () => {
      try {
        if (isLocalStorageAvailable()) {
          setRoom(refreshRoom());
        }
      } catch {
        setStorageError(
          "localStorage is unavailable. Enable browser storage to run the MatchMode local demo.",
        );
      }
    };
    const interval = window.setInterval(syncRoom, 1000);
    window.addEventListener("storage", syncRoom);
    window.addEventListener("matchmode-storage", syncRoom);
    window.addEventListener("focus", syncRoom);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", syncRoom);
      window.removeEventListener("matchmode-storage", syncRoom);
      window.removeEventListener("focus", syncRoom);
    };
  }, []);

  const joinUrls = useMemo(() => {
    if (!origin || !room) {
      return { A: "", B: "" };
    }

    return {
      A: `${origin}/join/${room.roomId}?slot=A`,
      B: `${origin}/join/${room.roomId}?slot=B`,
    };
  }, [origin, room]);

  function handleResetRoom() {
    const nextRoom = resetRoom();
    setRoom(nextRoom);
    setResult(null);
  }

  function loadParticipants(participants: Participant[]) {
    if (!room) {
      return;
    }

    const nextRoom = replaceParticipants(room.roomId, participants);
    setRoom(nextRoom);
    setResult(null);
  }

  function runCollision() {
    if (!room || room.participants.length < 2 || isRunning) {
      return;
    }

    setResult(null);
    setIsRunning(true);
    setActiveStep(loadingSteps[0]);

    loadingSteps.forEach((step, index) => {
      window.setTimeout(() => {
        setActiveStep(step);
      }, index * 520);
    });

    window.setTimeout(async () => {
      try {
        const response = await fetch("/api/collision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: selectedMode,
            participants: [room.participants[0], room.participants[1]],
          }),
        });

        if (!response.ok) {
          throw new Error("Collision request failed");
        }

        const data = (await response.json()) as { result?: CollisionResult };
        const nextResult =
          data.result ??
          generateCollisionResult({
            mode: selectedMode,
            participants: [room.participants[0], room.participants[1]],
          });

        setResult(nextResult);
      } catch {
        setResult({
          matchScore: 20,
          verdictTitle: "Collision failed safely",
          verdictSummary:
            "The mock evaluator could not read the profiles, so it returned a safe fallback instead of crashing.",
          agentDebate: [
            {
              agent: "Judge Agent",
              message: "The app recovered from an invalid local profile shape.",
            },
            {
              agent: "Risk Agent",
              message: "Reset the room or reload demo profiles before trying again.",
            },
            {
              agent: "User A Agent",
              message: "User A needs a complete local profile.",
            },
            {
              agent: "User B Agent",
              message: "User B needs a complete local profile.",
            },
          ],
          compatibilityBreakdown: [],
          risks: ["Invalid or incomplete local demo data."],
          recommendedOutcome: "Reset the room and load a demo pair.",
          roleSplitOrRules: "No role split available.",
          firstMessage: "Let's reload our demo profiles and try again.",
          nextSteps: ["Reset the room", "Load a demo pair", "Run Collision again"],
          modeSpecific: { title: "Fallback", items: [] },
        });
      } finally {
        setIsRunning(false);
        setActiveStep("");
      }
    }, loadingSteps.length * 520 + 250);
  }

  const participants = room?.participants ?? [];
  const canRun = participants.length === 2 && !isRunning;

  if (storageError) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07070a] px-4 text-zinc-100">
        <div className="max-w-lg rounded-lg border border-rose-300/20 bg-rose-300/[0.06] p-6">
          <h1 className="text-2xl font-semibold text-white">Storage unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-rose-100/80">{storageError}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07070a] text-zinc-100">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.16),transparent_32%),linear-gradient(135deg,rgba(20,184,166,0.08),transparent_35%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-300 text-sm font-black text-zinc-950 shadow-lg shadow-cyan-300/20">
                MM
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">MatchMode AI</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadParticipants(builderDesignerPair)}
              disabled={!room}
              className="h-10 rounded-md border border-cyan-300/20 bg-cyan-300/[0.08] px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Load Demo Pair
            </button>
            <button
              type="button"
              onClick={() => loadParticipants(roommatePair)}
              disabled={!room}
              className="h-10 rounded-md border border-fuchsia-300/20 bg-fuchsia-300/[0.08] px-4 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-300/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Load Roommate Demo
            </button>
            <button
              type="button"
              onClick={handleResetRoom}
              disabled={!room}
              className="h-10 rounded-md border border-rose-300/20 bg-rose-300/[0.08] px-4 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </header>

        <section className="grid gap-6 py-8 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5 sm:p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-300">
                    Collision arena
                  </p>
                  <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                    Match room
                  </h1>
                </div>
                <ModeSelector
                  selectedMode={selectedMode}
                  onModeChange={(mode) => {
                    setSelectedMode(mode);
                    setResult(null);
                  }}
                />
              </div>
            </div>

            <section className="grid gap-5 lg:grid-cols-2">
              <ParticipantCard
                label="User A"
                participant={participants[0]}
                joinUrl={joinUrls.A}
              />
              <ParticipantCard
                label="User B"
                participant={participants[1]}
                joinUrl={joinUrls.B}
              />
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-white">Step 4 · Run Collision</p>
                </div>
                <button
                  type="button"
                  disabled={!canRun}
                  onClick={runCollision}
                  className="h-12 rounded-md bg-cyan-300 px-6 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                >
                  {isRunning ? "Running..." : "Run Collision"}
                </button>
              </div>

              {isRunning ? (
                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {loadingSteps.map((step) => (
                    <div
                      key={step}
                      className={`rounded-md border px-3 py-3 text-sm transition ${
                        activeStep === step
                          ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                          : "border-white/10 bg-black/20 text-zinc-500"
                      }`}
                    >
                      <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                      {step}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            {result ? <CollisionResults result={result} /> : null}
          </div>

          <aside className="rounded-lg border border-dashed border-white/15 bg-black/25 p-5 xl:sticky xl:top-5 xl:h-[calc(100vh-2.5rem)]">
            <div className="flex h-full flex-col">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500">
                Live state
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Room status
              </h2>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  ["Mode", selectedMode],
                  ["Room", room?.roomId ?? "Loading"],
                  ["Users", `${participants.length}/2`],
                  ["Engine", result ? "Ready" : isRunning ? "Running" : "Idle"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-md border border-white/10 bg-white/[0.03] p-3"
                  >
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="mt-2 truncate text-sm font-medium text-zinc-200">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
