"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CollisionResults } from "./CollisionResults";
import { CopyButton } from "./CopyButton";
import { ModeSelector } from "./ModeSelector";
import { ParticipantCard } from "./ParticipantCard";
import {
  getRoom,
  isLocalStorageAvailable,
  resetRoom,
  type MatchMode,
  type Room,
} from "../lib/storage";
import type { CollisionResult } from "../lib/mockCollision";

const loadingSteps = [
  "Reading profiles",
  "Creating profile agents",
  "Simulating interaction",
  "Checking risks",
  "Judge evaluating",
  "Generating verdict",
];

export function RoomDashboard({ roomId }: { roomId: string }) {
  const [storageError, setStorageError] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [origin, setOrigin] = useState("");
  const [selectedMode, setSelectedMode] = useState<MatchMode>("Hackathon Partner");
  const [result, setResult] = useState<CollisionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState("");
  const [collisionError, setCollisionError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isLocalStorageAvailable()) {
        setStorageError("localStorage is unavailable. Enable browser storage to use this room.");
        return;
      }
      setOrigin(window.location.origin);
      setRoom(getRoom(roomId));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [roomId]);

  useEffect(() => {
    const syncRoom = () => {
      try {
        if (isLocalStorageAvailable()) {
          setRoom(getRoom(roomId));
        }
      } catch {
        setStorageError("localStorage is unavailable.");
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
  }, [roomId]);

  const joinUrl = useMemo(() => {
    if (!origin) return "";
    return `${origin}/join/${roomId}`;
  }, [origin, roomId]);

  const joinUrlA = joinUrl ? `${joinUrl}?slot=A` : "";
  const joinUrlB = joinUrl ? `${joinUrl}?slot=B` : "";

  function handleNewRoom() {
    const nextRoom = resetRoom();
    window.location.href = `/room/${nextRoom.roomId}`;
  }

  function runCollision() {
    if (!room || room.participants.length < 2 || isRunning) return;

    setResult(null);
    setCollisionError("");
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
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Collision request failed");
        }

        const data = (await response.json()) as { result?: CollisionResult };
        if (!data.result) throw new Error("No result returned");
        setResult(data.result);
      } catch (err) {
        setCollisionError(
          err instanceof Error ? err.message : "Collision failed. Check your API key and try again.",
        );
      } finally {
        setIsRunning(false);
        setActiveStep("");
      }
    }, loadingSteps.length * 520 + 250);
  }

  const participants = room?.participants ?? [];
  const canRun =
    participants.length === 2 &&
    participants[0] != null &&
    participants[1] != null &&
    !isRunning;

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

        <header className="flex items-center justify-between border-b border-white/10 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-300 text-sm font-black text-zinc-950 shadow-lg shadow-cyan-300/20">
              MM
            </div>
            <p className="text-2xl font-semibold text-white">MatchMode AI</p>
          </Link>
          <button
            type="button"
            onClick={handleNewRoom}
            className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
          >
            New Room
          </button>
        </header>

        <section className="grid gap-6 py-8 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6">

            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5 sm:p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-300">
                    Collision arena
                  </p>
                  <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                    Match room
                  </h1>
                  <p className="mt-2 font-mono text-sm text-zinc-500">{roomId}</p>
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

            {joinUrlA ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500">
                  Step 1 · Invite participants
                </p>
                <p className="mt-3 text-sm text-zinc-400">
                  Send each person their own link — they go to separate slots.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-3 rounded-md border border-white/10 bg-black/30 px-4 py-3">
                    <p className="w-16 shrink-0 text-xs font-semibold text-cyan-300">User A</p>
                    <p className="flex-1 truncate font-mono text-xs text-cyan-200">{joinUrlA}</p>
                    <CopyButton value={joinUrlA} label="Copy" />
                  </div>
                  <div className="flex items-center gap-3 rounded-md border border-white/10 bg-black/30 px-4 py-3">
                    <p className="w-16 shrink-0 text-xs font-semibold text-fuchsia-300">User B</p>
                    <p className="flex-1 truncate font-mono text-xs text-fuchsia-200">{joinUrlB}</p>
                    <CopyButton value={joinUrlB} label="Copy" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                <div className="h-24 animate-pulse rounded-md bg-white/[0.04]" />
              </div>
            )}

            <section>
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.22em] text-zinc-500">
                Step 2 · Participants
              </p>
              <div className="grid gap-5 lg:grid-cols-2">
                <ParticipantCard label="User A" participant={participants[0]} joinUrl={joinUrlA} />
                <ParticipantCard label="User B" participant={participants[1]} joinUrl={joinUrlB} />
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-white">Step 3 · Run Collision</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {!canRun && !isRunning
                      ? participants.filter(Boolean).length < 2
                        ? `Waiting for ${2 - participants.filter(Boolean).length} more participant${participants.filter(Boolean).length === 1 ? "" : "s"}`
                        : "Waiting for participants..."
                      : "Both participants ready"}
                  </p>
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

              {collisionError ? (
                <div className="mt-5 rounded-md border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-100/80">
                  {collisionError}
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
              <h2 className="mt-3 text-2xl font-semibold text-white">Room status</h2>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {(
                  [
                    ["Mode", selectedMode],
                    ["Room", roomId],
                    ["Users", `${participants.length}/2`],
                    ["Engine", result ? "Ready" : isRunning ? "Running" : "Idle"],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="mt-2 truncate text-sm font-medium text-zinc-200">{value}</p>
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
