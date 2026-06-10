export const MATCH_MODES = [
  "Hackathon Partner",
  "Roommate",
  "Cofounder",
  "Project Collaborator",
  "Mentor / Mentee",
  "Job Referral",
  "Study Partner",
  "Club / Team Member",
] as const;

export type MatchMode = (typeof MATCH_MODES)[number];

export type Participant = {
  id: string;
  name: string;
  linkedinUrl: string;
  headline: string;
  summary: string;
  skills: string;
  goals: string;
  imageUrl?: string;
  joinedAt: string;
};

export type Room = {
  roomId: string;
  createdAt: string;
  participants: Participant[];
};

type RoomsById = Record<string, Room>;

const currentRoomKey = "matchmode_roomId";
const roomsKey = "matchmode_rooms";

export function isLocalStorageAvailable() {
  try {
    const testKey = "matchmode_storage_test";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function createRoomId() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function readRooms(): RoomsById {
  const storedRooms = window.localStorage.getItem(roomsKey);

  if (!storedRooms) {
    return {};
  }

  try {
    const parsed = JSON.parse(storedRooms);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRooms(rooms: RoomsById) {
  window.localStorage.setItem(roomsKey, JSON.stringify(rooms));
  window.dispatchEvent(new Event("matchmode-storage"));
}

export function getRoom(roomId: string): Room {
  const rooms = readRooms();
  const existingRoom = rooms[roomId];

  if (existingRoom) {
    return {
      ...existingRoom,
      participants: Array.isArray(existingRoom.participants)
        ? existingRoom.participants.slice(0, 2)
        : [],
    };
  }

  const room: Room = {
    roomId,
    createdAt: new Date().toISOString(),
    participants: [],
  };

  writeRooms({ ...rooms, [roomId]: room });
  return room;
}

export function createRoom(): Room {
  const rooms = readRooms();
  let roomId = createRoomId();

  while (rooms[roomId]) {
    roomId = createRoomId();
  }

  const room: Room = {
    roomId,
    createdAt: new Date().toISOString(),
    participants: [],
  };

  writeRooms({ ...rooms, [roomId]: room });
  window.localStorage.setItem(currentRoomKey, roomId);
  window.dispatchEvent(new Event("matchmode-storage"));

  return room;
}

export function getCurrentRoom(): Room {
  const currentRoomId = window.localStorage.getItem(currentRoomKey);

  if (currentRoomId) {
    return getRoom(currentRoomId);
  }

  return createRoom();
}

export function resetRoom(): Room {
  return createRoom();
}

export function clearRoom(roomId: string): Room {
  const rooms = readRooms();
  const room = getRoom(roomId);
  const nextRoom = { ...room, participants: [] };

  writeRooms({ ...rooms, [roomId]: nextRoom });
  return nextRoom;
}

export function addParticipant(
  roomId: string,
  participant: Omit<Participant, "id" | "joinedAt"> & Partial<Participant>,
) {
  const rooms = readRooms();
  const room = getRoom(roomId);

  if (room.participants.length >= 2) {
    return { room, added: false, reason: "Room is full" };
  }

  const nextParticipant: Participant = {
    id:
      participant.id ??
      `participant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: participant.name.trim() || "Unnamed participant",
    linkedinUrl: participant.linkedinUrl.trim(),
    headline: participant.headline.trim(),
    summary: participant.summary.trim(),
    skills: participant.skills.trim(),
    goals: participant.goals.trim(),
    imageUrl: participant.imageUrl?.trim(),
    joinedAt: participant.joinedAt ?? new Date().toISOString(),
  };

  const nextRoom = {
    ...room,
    participants: [...room.participants, nextParticipant].slice(0, 2),
  };

  writeRooms({ ...rooms, [roomId]: nextRoom });
  return { room: nextRoom, added: true };
}

export function updateParticipant(roomId: string, participant: Participant) {
  const rooms = readRooms();
  const room = getRoom(roomId);
  const nextRoom = {
    ...room,
    participants: room.participants.map((existingParticipant) =>
      existingParticipant.id === participant.id ? participant : existingParticipant,
    ),
  };

  writeRooms({ ...rooms, [roomId]: nextRoom });
  return nextRoom;
}

export function replaceParticipants(roomId: string, participants: Participant[]) {
  const rooms = readRooms();
  const room = getRoom(roomId);
  const nextRoom = {
    ...room,
    participants: participants.slice(0, 2),
  };

  writeRooms({ ...rooms, [roomId]: nextRoom });
  return nextRoom;
}

export function setParticipantSlot(
  roomId: string,
  slotIndex: 0 | 1,
  participant: Omit<Participant, "id" | "joinedAt"> & Partial<Participant>,
) {
  const rooms = readRooms();
  const room = getRoom(roomId);
  const nextParticipant: Participant = {
    id:
      participant.id ??
      room.participants[slotIndex]?.id ??
      `participant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: participant.name.trim() || "LinkedIn User",
    linkedinUrl: participant.linkedinUrl.trim(),
    headline: participant.headline.trim(),
    summary: participant.summary.trim(),
    skills: participant.skills.trim(),
    goals: participant.goals.trim(),
    imageUrl: participant.imageUrl?.trim(),
    joinedAt: participant.joinedAt ?? new Date().toISOString(),
  };
  const nextParticipants = [...room.participants];
  nextParticipants[slotIndex] = nextParticipant;

  const nextRoom = {
    ...room,
    participants: nextParticipants.slice(0, 2),
  };

  writeRooms({ ...rooms, [roomId]: nextRoom });
  return nextRoom;
}

export function createParticipant(
  participant: Omit<Participant, "id" | "joinedAt">,
): Participant {
  return {
    ...participant,
    id: `participant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    joinedAt: new Date().toISOString(),
  };
}
