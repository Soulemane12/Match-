"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getRoom,
  isLocalStorageAvailable,
  setParticipantSlot,
  type Participant,
  type Room,
} from "../../../lib/storage";

type ProfileForm = Omit<Participant, "id" | "joinedAt">;

function decodeLinkedInProfile(value?: string): ProfileForm | null {
  if (!value) return null;
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

const oauthErrorMessages: Record<string, string> = {
  linkedin_config: "LinkedIn is not configured on this server.",
  linkedin_state: "Sign-in expired. Please try again.",
  linkedin_token: "LinkedIn token exchange failed.",
  linkedin_profile: "Could not fetch your LinkedIn profile.",
  linkedin_unknown: "LinkedIn sign-in failed.",
  user_cancelled_login: "Sign-in was cancelled.",
  user_cancelled_authorize: "LinkedIn authorization was cancelled.",
};

export function JoinRoom({
  roomId,
  slot,
  oauthError,
  linkedInProfile,
}: {
  roomId: string;
  slot: "A" | "B";
  oauthError?: string;
  linkedInProfile?: string;
}) {
  const [storageError, setStorageError] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [message, setMessage] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isLocalStorageAvailable()) {
        setStorageError("localStorage is unavailable. Enable browser storage to join this room.");
        return;
      }

      const currentRoom = getRoom(roomId);
      setRoom(currentRoom);

      const profile = decodeLinkedInProfile(linkedInProfile);
      if (profile) {
        const nextRoom = setParticipantSlot(roomId, slot === "B" ? 1 : 0, profile);
        setRoom(nextRoom);
        setJoined(true);
        return;
      }

      if (oauthError) {
        setMessage(oauthErrorMessages[oauthError] ?? "LinkedIn sign-in failed.");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [linkedInProfile, oauthError, roomId, slot]);

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

  if (joined) {
    return (
      <main className="min-h-screen bg-[#07070a] px-4 py-6 text-zinc-100 sm:px-6">
        <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-xl place-items-center">
          <div className="w-full rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] p-6 text-center shadow-2xl shadow-emerald-950/20">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200">
              Joined
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white">
              Profile saved. You can close this tab.
            </h1>
            <Link
              href="/"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isFull = (room?.participants.length ?? 0) >= 2;

  return (
    <main className="min-h-screen bg-[#07070a] px-4 py-6 text-zinc-100 sm:px-6">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_36%),radial-gradient(circle_at_bottom,rgba(217,70,239,0.12),transparent_32%)]" />
      <div className="relative z-10 mx-auto w-full max-w-md">

        <header className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            MatchMode AI
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Join Room</h1>
          <p className="mt-1 font-mono text-sm text-zinc-500">{roomId}</p>
        </header>

        <section className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {(["User A", "User B"] as const).map((slotLabel, index) => (
              <div key={slotLabel} className="rounded-md border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                  {slotLabel}
                </p>
                <p className="mt-3 text-sm text-zinc-300">
                  {room?.participants[index]?.name ?? "Waiting..."}
                </p>
              </div>
            ))}
          </div>
        </section>

        {isFull ? (
          <div className="mt-4 rounded-lg border border-rose-300/20 bg-rose-300/[0.06] p-5 text-center">
            <p className="text-sm font-semibold text-rose-100">Room is full</p>
            <p className="mt-1 text-sm text-rose-100/60">Both slots are taken.</p>
          </div>
        ) : (
          <a
            href={`/api/linkedin/start?roomId=${encodeURIComponent(roomId)}&slot=${slot}`}
            className="mt-4 flex h-14 w-full items-center justify-center rounded-lg bg-cyan-300 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
          >
            Connect with LinkedIn
          </a>
        )}

        {message ? (
          <div className="mt-4 rounded-lg border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-100/80">
            {message}
          </div>
        ) : null}

      </div>
    </main>
  );
}
