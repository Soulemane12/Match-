"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  getRoom,
  isLocalStorageAvailable,
  setParticipantSlot,
  type Participant,
  type Room,
} from "../../../lib/storage";

type ProfileForm = Omit<Participant, "id" | "joinedAt">;

const emptyForm: ProfileForm = {
  name: "",
  linkedinUrl: "",
  headline: "",
  summary: "",
  skills: "",
  goals: "",
  imageUrl: "",
};


function decodeLinkedInProfile(value?: string): ProfileForm | null {
  if (!value) {
    return null;
  }

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
  linkedin_config: "LinkedIn is not configured.",
  linkedin_state: "LinkedIn sign-in expired. Try again.",
  linkedin_token: "LinkedIn token exchange failed.",
  linkedin_profile: "LinkedIn profile fetch failed.",
  linkedin_unknown: "LinkedIn sign-in failed.",
  user_cancelled_login: "LinkedIn sign-in was cancelled.",
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
  const [showImportForm, setShowImportForm] = useState(false);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isLocalStorageAvailable()) {
        setStorageError(
          "localStorage is unavailable. Enable browser storage to join this local demo room.",
        );
        return;
      }

      const currentRoom = getRoom(roomId);
      setRoom(currentRoom);

      const profile = decodeLinkedInProfile(linkedInProfile);
      if (profile) {
        const nextRoom = setParticipantSlot(
          roomId,
          slot === "B" ? 1 : 0,
          profile,
        );
        setRoom(nextRoom);
        setJoined(true);
      }

      if (oauthError) {
        setMessage(oauthErrorMessages[oauthError] ?? "LinkedIn sign-in failed.");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [linkedInProfile, oauthError, roomId, slot]);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!room) {
      setMessage("Room is still loading. Try again in a moment.");
      return;
    }

    if (!form.name.trim()) {
      setMessage("Name is required.");
      return;
    }

    setRoom(setParticipantSlot(room.roomId, slot === "B" ? 1 : 0, form));
    setJoined(true);
    setMessage("");
  }

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
              Success
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white">
              You joined. Return to the main screen.
            </h1>
            <Link
              href="/"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
            >
              Back to main screen
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07070a] px-4 py-6 text-zinc-100 sm:px-6">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_36%),radial-gradient(circle_at_bottom,rgba(217,70,239,0.12),transparent_32%)]" />
      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <header className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            MatchMode AI
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-white">
            Join MatchMode Room
          </h1>
          <p className="mt-3 font-mono text-xl tracking-[0.2em] text-cyan-100">
            {slot === "B" ? "User B" : "User A"}
          </p>
        </header>

        <section className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {["User A", "User B"].map((slotLabel, index) => (
              <div
                key={slotLabel}
                className="rounded-md border border-white/10 bg-black/20 p-4"
              >
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                  {slotLabel}
                </p>
                <p className="mt-3 text-sm text-zinc-300">
                  {room?.participants[index]?.name ?? "Empty"}
                </p>
              </div>
            ))}
          </div>

          <a
            href={`/api/linkedin/start?roomId=${encodeURIComponent(roomId)}&slot=${slot}`}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-md bg-cyan-300 px-6 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
          >
            Connect LinkedIn
          </a>
        </section>

        <button
          type="button"
          onClick={() => setShowImportForm((current) => !current)}
          className="mt-4 h-11 w-full rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
        >
          {showImportForm ? "Hide Profile Form" : "Enter Profile Manually"}
        </button>

        {showImportForm ? (
          <form
            onSubmit={handleSubmit}
            className="mt-4 rounded-lg border border-cyan-300/15 bg-white/[0.05] p-5 shadow-2xl shadow-cyan-950/20"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  LinkedIn import
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Add profile details
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <TextInput
                label="Name"
                value={form.name}
                onChange={(value) => updateField("name", value)}
                placeholder="Your name"
              />
              <TextInput
                label="LinkedIn URL"
                value={form.linkedinUrl}
                onChange={(value) => updateField("linkedinUrl", value)}
                placeholder="https://linkedin.com/in/..."
              />
              <TextInput
                label="Headline / role"
                value={form.headline}
                onChange={(value) => updateField("headline", value)}
                placeholder="Full-stack builder, product designer..."
              />
              <TextArea
                label="Profile summary"
                value={form.summary}
                onChange={(value) => updateField("summary", value)}
                placeholder="Short profile summary"
              />
              <TextArea
                label="Skills"
                value={form.skills}
                onChange={(value) => updateField("skills", value)}
                placeholder="Next.js, Figma, user research..."
              />
              <TextArea
                label="Goals"
                value={form.goals}
                onChange={(value) => updateField("goals", value)}
                placeholder="Ship an MVP, find a roommate..."
              />
              <TextInput
                label="Profile image URL optional"
                value={form.imageUrl ?? ""}
                onChange={(value) => updateField("imageUrl", value)}
                placeholder="https://..."
              />
            </div>

            {message ? (
              <p className="mt-4 rounded-md border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-5 h-12 w-full rounded-md bg-cyan-300 px-6 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
            >
              Save profile
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-md border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
        placeholder={placeholder}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-300">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 w-full rounded-md border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
        placeholder={placeholder}
      />
    </label>
  );
}
