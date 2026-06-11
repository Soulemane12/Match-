import { NextRequest, NextResponse } from "next/server";
import { getServerRoom } from "../../../../lib/kv";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;
  const room = await getServerRoom(roomId);
  return NextResponse.json({ room });
}
