# Setup — accounts, credentials, deployment

All the code is written and builds locally. What's left needs your own
accounts and credentials — none of this can be done on your behalf, since it
involves your identity/billing. Follow these steps in order.

## 1. Supabase (database)

1. Create a project at [supabase.com](https://supabase.com) — **pick the
   Frankfurt (EU Central) region** for data residency.
2. In the SQL editor, run `supabase/migrations/0001_init.sql` (creates all
   tables, the vector index, and the `match_memory_chunks` search function).
3. From Project Settings → API, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never
     exposed to the browser)

## 2. Anthropic + OpenAI (LLM providers)

1. Get an Anthropic API key at [console.anthropic.com](https://console.anthropic.com)
   → `ANTHROPIC_API_KEY`.
2. Get an OpenAI API key at [platform.openai.com](https://platform.openai.com)
   → `OPENAI_API_KEY` (used for Whisper transcription, embeddings, and as a
   classifier fallback).

## 3. Auth gate

Generate these locally and keep them secret:

```bash
openssl rand -hex 32   # -> AUTH_SECRET
openssl rand -hex 16   # -> API_SECRET
```

Pick a memorable string for `DASHBOARD_PASSWORD` — this is the password you'll
type to open the dashboard.

## 4. Telegram capture bot (optional but recommended)

1. In Telegram, message **@BotFather** → `/newbot` → pick a name and a
   username ending in `_bot`. Save the token → `TELEGRAM_BOT_TOKEN`.
2. Generate a webhook secret: `openssl rand -hex 16` → `TELEGRAM_WEBHOOK_SECRET`.
3. Message **@userinfobot** to get your numeric Telegram user ID →
   `TELEGRAM_USER_ID` (the bot only listens to you).
4. After deployment (step 7), register the webhook:
   ```bash
   curl -F "url=https://your-app.vercel.app/api/telegram/webhook" \
     -F "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
     "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook"
   ```

## 5. Optional cards

- **Calendar**: Google Calendar → Settings → your calendar → "Secret address
  in iCal format" → `GOOGLE_CALENDAR_ICAL_URL`. Skip this and the card just
  shows "not configured."
- **Finance Pulse**: only set this up if you actually want personal net-worth
  tracking — it's not needed for the consulting practice use case.
  1. Create a project at [console.cloud.google.com/projectcreate](https://console.cloud.google.com/projectcreate).
  2. Enable the Drive API and Sheets API.
  3. IAM → Service Accounts → create one, generate a JSON key.
  4. Share your finance Google Sheet with the service account email
     (`...@...iam.gserviceaccount.com`) as Viewer. **Do not use "publish to
     web"** — the service account keeps the sheet fully private.
  5. Set `GOOGLE_SHEETS_FINANCE_ID` (the ID between `/d/` and `/edit` in the
     sheet URL), `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and
     `GOOGLE_SERVICE_ACCOUNT_KEY` (the `private_key` field from the JSON).

## 6. Local development

```bash
cp .env.example .env.local
# fill in the values from steps 1-5
npm install
npm run dev
```

Open http://localhost:3000, log in with `DASHBOARD_PASSWORD`.

## 7. Deploy to Vercel

```bash
npm i -g vercel
vercel link
vercel --prod
```

Push every env var from `.env.example` to Vercel (repeat for each):

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_MODEL production
vercel env add OPENAI_API_KEY production
vercel env add OPENAI_CLASSIFIER_MODEL production
vercel env add AUTH_SECRET production
vercel env add DASHBOARD_PASSWORD production
vercel env add API_SECRET production
vercel env add TELEGRAM_BOT_TOKEN production
vercel env add TELEGRAM_WEBHOOK_SECRET production
vercel env add TELEGRAM_USER_ID production
vercel env add GOOGLE_CALENDAR_ICAL_URL production
vercel env add GOOGLE_SHEETS_FINANCE_ID production
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL production
vercel env add GOOGLE_SERVICE_ACCOUNT_KEY production
vercel env add CRON_SECRET production
vercel env add USER_TIMEZONE production
vercel env add USER_ID production
```

`CRON_SECRET`: generate with `openssl rand -hex 16` — Vercel automatically
sends it as `Authorization: Bearer $CRON_SECRET` when it calls the cron
endpoint (`vercel.json` already wires `/api/finance/snapshot` to run daily
at 5am UTC).

Redeploy after adding env vars: `vercel --prod`.

## 8. Personalize

- Edit `lib/operatorConfig.ts` with your real name/location/focus.
- The **CRM tab already doubles as your client tracker** — "clients" are
  `entities` with `kind: "client"`, created inline from the CRM page.
- Nutrition/Health/Finance cards are personal-life extras from the original
  guide — safe to ignore, or delete their card imports from `app/page.tsx`
  if you don't want them cluttering the home screen.
- **Do not put client-confidential material through the Telegram capture
  bot or web capture box** — this system is for your own task/practice
  management, not a client data system. Keep PIFs, formulas, and client
  correspondence in your proper regulated channels.

## Known limitations (be aware before relying on this)

- No automated tests were written — this is a personal tool, not
  production software for other users.
- The Smart CRM search and `/ask` endpoint send task/memory text to
  Anthropic's API — don't put anything in the capture pipeline you wouldn't
  want leaving your machine.
- Single-user only (`USER_ID` env var, no real auth beyond one shared
  password) — do not expose this to multiple users without adding proper
  per-user auth first.
