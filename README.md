This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Matchmaking Backend API

The project now includes a full backend matchmaking engine under `src/server/matchmaking` and API routes under `src/app/api/matchmaking`.

### 1) Run matchmaking pipeline

`POST /api/matchmaking/recommendations`

Body:

```json
{
  "userId": "user-1",
  "limit": 10
}
```

Returns ranked recommendations with:
- compatibility score
- per-dimension breakdown
- human-readable reasons
- `whySignals` trust/explainability trace
- confidence level

### 2) Read latest recommendations

`GET /api/matchmaking/recommendations?userId=user-1&limit=10`

### 3) Ingest behavioral signals

`POST /api/matchmaking/signals`

Body:

```json
{
  "actorUserId": "user-1",
  "targetUserId": "p-1",
  "idempotencyKey": "evt-user-1-p-1-like-2026-04-14T19:00:00Z",
  "type": "like",
  "metadata": {
    "source": "discover"
  }
}
```

Supported signal types:
- `profile_view`
- `like`
- `pass`
- `message_sent`
- `message_received`
- `spark_answered`
- `date_planned`
- `report`

## SMS (Twilio) Integration

Twilio SMS is now supported through a dedicated API route:

- `POST /api/sms/send`

### Required environment variables

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567
# optional alternative sender setup:
# TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Send SMS directly

```json
{
  "to": "+15551234567",
  "body": "Your Vinculo date plan is set for Friday at 7:30 PM."
}
```

### Trigger SMS from matchmaking signal

When posting a `date_planned` signal to `/api/matchmaking/signals`, include:

```json
{
  "actorUserId": "user-1",
  "targetUserId": "p-1",
  "idempotencyKey": "evt-date-plan-001",
  "type": "date_planned",
  "metadata": {
    "smsTo": "+15551234567",
    "smsBody": "Date plan confirmed: Friday 7:30 PM at Blue Bottle."
  }
}
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## AI Pre-Date Briefing (V1)

The app supports a lightweight **AI Pre-Date Briefing** for mutual matches.

Environment configuration:

```bash
AI_PRE_DATE_BRIEFING_ENABLED=true
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Behavior:
- If `OPENAI_API_KEY` is missing, the app falls back to a safe rule-based briefing.
- If the feature flag is disabled, the briefing is hidden without affecting other flows.
- No secrets should be committed; use `.env.local` for real keys.
