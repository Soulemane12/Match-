"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRoom, isLocalStorageAvailable } from "../lib/storage";

export default function Home() {
  const router = useRouter();
  const [joinId, setJoinId] = useState("");
  const [error, setError] = useState("");

  function handleCreateRoom() {
    if (!isLocalStorageAvailable()) {
      setError("localStorage is unavailable. Enable browser storage to create a room.");
      return;
    }
    const room = createRoom();
    router.push(`/room/${room.roomId}`);
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const id = joinId.trim().toUpperCase();
    if (!id) return;
    router.push(`/join/${id}`);
  }

  return (
    <main className="min-h-screen bg-[#07070a] text-zinc-100">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.16),transparent_32%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-16">
        <div className="grid h-16 w-16 place-items-center rounded-xl bg-cyan-300 text-xl font-black text-zinc-950 shadow-2xl shadow-cyan-300/25">
          MM
        </div>
        <h1 className="mt-6 text-5xl font-semibold text-white">MatchMode AI</h1>
        <p className="mt-4 max-w-xs text-center text-sm leading-7 text-zinc-400">
          Two profiles. One mode. An AI verdict on how well you match — as hackathon partners, cofounders, roommates, and more.
        </p>

        <div className="mt-10 w-full space-y-3">
          {error ? (
            <p className="rounded-md border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-100/80">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleCreateRoom}
            className="h-14 w-full rounded-lg bg-cyan-300 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
          >
            Create Room
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-zinc-600">or join existing</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Room ID"
              className="h-12 flex-1 rounded-md border border-white/10 bg-zinc-950 px-4 font-mono text-sm uppercase text-white outline-none placeholder:normal-case placeholder:text-zinc-700 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
            />
            <button
              type="submit"
              className="h-12 rounded-md border border-cyan-300/20 bg-cyan-300/[0.08] px-5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15"
            >
              Join
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
