import { JoinRoom } from "./JoinRoom";

export default async function JoinRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{
    error?: string;
    linkedinProfile?: string;
    slot?: string;
  }>;
}) {
  const { roomId } = await params;
  const { error, linkedinProfile, slot } = await searchParams;

  return (
    <JoinRoom
      roomId={roomId}
      slot={slot === "B" ? "B" : "A"}
      oauthError={error}
      linkedInProfile={linkedinProfile}
    />
  );
}
