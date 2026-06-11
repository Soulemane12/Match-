import { kv } from "@vercel/kv";
import type { Participant } from "./storage";

export type ServerRoom = {
  roomId: string;
  participants: (Participant | null)[];
};

const key = (roomId: string) => `matchmode:room:${roomId}`;

export async function getServerRoom(roomId: string): Promise<ServerRoom | null> {
  try {
    return await kv.get<ServerRoom>(key(roomId));
  } catch {
    return null;
  }
}

export async function upsertParticipantSlot(
  roomId: string,
  slotIndex: 0 | 1,
  participant: Participant,
): Promise<void> {
  try {
    const existing = (await kv.get<ServerRoom>(key(roomId))) ?? {
      roomId,
      participants: [null, null] as (Participant | null)[],
    };
    const next = [...existing.participants] as (Participant | null)[];
    next[slotIndex] = participant;
    await kv.set(key(roomId), { roomId, participants: next }, { ex: 60 * 60 * 24 });
  } catch {
    // KV not configured — silent fail, client-side path still works
  }
}
