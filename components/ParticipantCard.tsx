import type { Participant } from "../lib/storage";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}


export function ParticipantCard({
  label,
  participant,
  joinUrl,
}: {
  label: "User A" | "User B";
  participant?: Participant;
  joinUrl?: string;
}) {
  const qrUrl = joinUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=168x168&margin=10&data=${encodeURIComponent(
        joinUrl,
      )}`
    : "";

  if (!participant) {
    return (
      <article className="min-h-[340px] rounded-lg border border-dashed border-white/15 bg-white/[0.035] p-5">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
          {label}
        </p>
        <div className="mt-8 grid min-h-56 place-items-center rounded-md border border-white/10 bg-black/20 px-5 text-center">
          <div>
            {qrUrl ? (
              <div className="mx-auto rounded-lg border border-white/10 bg-white p-3">
                <img
                  src={qrUrl}
                  alt={`QR code for ${label} LinkedIn login`}
                  width={168}
                  height={168}
                />
              </div>
            ) : (
              <div className="mx-auto h-14 w-14 rounded-lg border border-white/10 bg-white/[0.04]" />
            )}
            <p className="mt-4 text-sm font-medium text-zinc-300">
              {label} login
            </p>
            {joinUrl ? (
              <a
                href={joinUrl}
                className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-cyan-300/20 px-3 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/10"
              >
                Open Login
              </a>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  const skills = splitList(participant.skills);
  const goals = splitList(participant.goals);

  return (
    <article className="min-h-[340px] rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-cyan-950/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-300">
            {label}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            {participant.name}
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            {participant.headline || "No headline provided"}
          </p>
        </div>
        {participant.imageUrl ? (
          <div
            role="img"
            aria-label={`${participant.name} profile`}
            className="h-14 w-14 rounded-lg border border-white/10 bg-cover bg-center"
            style={{ backgroundImage: `url("${participant.imageUrl}")` }}
          />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-lg bg-cyan-300 text-sm font-black text-zinc-950">
            {initials(participant.name)}
          </div>
        )}
      </div>

      <a
        href={participant.linkedinUrl || "#"}
        target="_blank"
        rel="noreferrer"
        className="mt-4 block truncate rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs text-cyan-200"
      >
        {participant.linkedinUrl || "No LinkedIn URL"}
      </a>

      <p className="mt-4 line-clamp-4 text-sm leading-6 text-zinc-400">
        {participant.summary || "No summary provided."}
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Skills
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(skills.length ? skills : ["No skills added"]).map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Goals
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(goals.length ? goals : ["No goals added"]).map((goal) => (
              <span
                key={goal}
                className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/[0.06] px-3 py-1 text-xs text-fuchsia-100"
              >
                {goal}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
