import { NextRequest, NextResponse } from "next/server";
import { upsertParticipantSlot } from "../../../../lib/kv";

type LinkedInUserInfo = {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
};

const tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";
const userInfoUrl = "https://api.linkedin.com/v2/userinfo";

function getRedirectUri(request: NextRequest) {
  return (
    process.env.LINKEDIN_REDIRECT_URI ??
    new URL("/api/linkedin/callback", request.url).toString()
  );
}

function redirectToJoin(
  request: NextRequest,
  roomId: string,
  slot: string,
  params: URLSearchParams,
) {
  const url = new URL(`/join/${roomId}`, request.url);
  url.searchParams.set("slot", slot);
  params.forEach((value, key) => url.searchParams.set(key, value));
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const storedState = request.cookies.get("matchmode_linkedin_state")?.value;
  const [expectedState, roomId, slot = "A"] = storedState?.split(":") ?? [];

  if (!roomId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const clearStateAndRedirect = (params: URLSearchParams) => {
    const response = redirectToJoin(request, roomId, slot, params);
    response.cookies.delete("matchmode_linkedin_state");
    return response;
  };

  if (error) {
    return clearStateAndRedirect(new URLSearchParams({ error }));
  }

  if (!clientId || !clientSecret) {
    return clearStateAndRedirect(
      new URLSearchParams({ error: "linkedin_config" }),
    );
  }

  if (!code || !returnedState || returnedState !== expectedState) {
    return clearStateAndRedirect(new URLSearchParams({ error: "linkedin_state" }));
  }

  try {
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(request),
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenBody,
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      return clearStateAndRedirect(
        new URLSearchParams({ error: "linkedin_token" }),
      );
    }

    const token = (await tokenResponse.json()) as { access_token?: string };

    if (!token.access_token) {
      return clearStateAndRedirect(
        new URLSearchParams({ error: "linkedin_token" }),
      );
    }

    const profileResponse = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
      cache: "no-store",
    });

    if (!profileResponse.ok) {
      return clearStateAndRedirect(
        new URLSearchParams({ error: "linkedin_profile" }),
      );
    }

    const profile = (await profileResponse.json()) as LinkedInUserInfo;
    const displayName =
      profile.name ??
      [profile.given_name, profile.family_name].filter(Boolean).join(" ") ??
      "";

    const participant = {
      id: profile.sub ?? `participant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: displayName,
      linkedinUrl: profile.sub
        ? `https://www.linkedin.com/in/${profile.sub}`
        : "https://www.linkedin.com/",
      headline: "",
      summary: "",
      skills: "",
      goals: "",
      imageUrl: profile.picture ?? "",
      joinedAt: new Date().toISOString(),
    };

    await upsertParticipantSlot(roomId, slot === "B" ? 1 : 0, participant);

    const encodedProfile = Buffer.from(
      JSON.stringify(participant),
      "utf8",
    ).toString("base64url");

    return clearStateAndRedirect(
      new URLSearchParams({ linkedinProfile: encodedProfile }),
    );
  } catch {
    return clearStateAndRedirect(new URLSearchParams({ error: "linkedin_unknown" }));
  }
}
