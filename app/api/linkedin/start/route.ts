import { NextRequest, NextResponse } from "next/server";

const linkedInAuthUrl = "https://www.linkedin.com/oauth/v2/authorization";

function getRedirectUri(request: NextRequest) {
  return (
    process.env.LINKEDIN_REDIRECT_URI ??
    new URL("/api/linkedin/callback", request.url).toString()
  );
}

export function GET(request: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const roomId = request.nextUrl.searchParams.get("roomId");
  const slot = request.nextUrl.searchParams.get("slot") === "B" ? "B" : "A";

  if (!roomId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!clientId) {
    return NextResponse.redirect(
      new URL(`/join/${roomId}?error=linkedin_config`, request.url),
    );
  }

  const state = crypto.randomUUID();
  const authorizeUrl = new URL(linkedInAuthUrl);

  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", getRedirectUri(request));
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", "openid profile email r_liteprofile");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("matchmode_linkedin_state", `${state}:${roomId}:${slot}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  return response;
}
