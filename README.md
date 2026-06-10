# MatchMode AI

Two profiles. One mode. An AI verdict on how well you match — as hackathon partners, cofounders, roommates, and more.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file:

```
OPENAI_API_KEY=your_openai_key
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/linkedin/callback
```

## How It Works

1. Host creates a room at `/` → lands on `/room/[roomId]`
2. Two participants join via the shared link at `/join/[roomId]` (LinkedIn OAuth or manual form)
3. Host selects a match mode and hits **Run Collision**
4. Four AI agents (User A, User B, Risk, Judge) evaluate the match and return a structured verdict
