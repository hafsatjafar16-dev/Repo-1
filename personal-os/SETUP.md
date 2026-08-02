# Setup — accounts, credentials, deployment

**Status: done.** Live at https://personal-os-lac-pi.vercel.app (Vercel
Hobby, Supabase Frankfurt, Anthropic + OpenAI). Steps below are kept as a
record of what was done and as a reference for future redeploys or setting
this up again elsewhere — not something you need to redo.

All the code is written and builds locally. What's left needs your own
accounts and credentials — none of this can be done on your behalf, since it
involves your identity/billing. Follow these steps in order.

Scope note: this build is trimmed to what Hechwan actually needs — capture,
tasks/CRM, journal, and searchable memory (Brain). The original guide's
personal-life cards (Nutrition, Habit Tracker, Calendar, Finance Pulse) were
removed as scope creep; see `../tooling/personal-os-stack-decision.md` for
that call.

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

Both are still required even with the trimmed scope: Anthropic handles
capture classification, CRM smart search, and the Brain `/ask` endpoint;
OpenAI provides the embeddings behind Brain's search (and Whisper
transcription, only if you set up Telegram voice capture in step 4).

1. Get an Anthropic API key at [console.anthropic.com](https://console.anthropic.com)
   → `ANTHROPIC_API_KEY`.
2. Get an OpenAI API key at [platform.openai.com](https://platform.openai.com)
   → `OPENAI_API_KEY`.

Set a spend cap on both (Anthropic: Settings → Limits; OpenAI: Billing →
Limits) — at this app's expected volume, ~$20 loaded with a ~$25 cap on each
is comfortable headroom.

## 3. Auth gate

Generate these locally and keep them secret:

```bash
openssl rand -hex 32   # -> AUTH_SECRET
openssl rand -hex 16   # -> API_SECRET
```

Pick a memorable string for `DASHBOARD_PASSWORD` — this is the password you'll
type to open the dashboard.

## 4. Telegram capture bot (optional)

Skip this entirely if you're fine capturing via the web capture box on the
dashboard instead of voice notes — nothing else depends on it.

1. In Telegram, message **@BotFather** → `/newbot` → pick a name and a
   username ending in `_bot`. Save the token → `TELEGRAM_BOT_TOKEN`.
2. Generate a webhook secret: `openssl rand -hex 16` → `TELEGRAM_WEBHOOK_SECRET`.
3. Message **@userinfobot** to get your numeric Telegram user ID →
   `TELEGRAM_USER_ID` (the bot only listens to you).
4. After deployment (step 6), register the webhook:
   ```bash
   curl -F "url=https://your-app.vercel.app/api/telegram/webhook" \
     -F "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
     "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook"
   ```

## 5. Local development

```bash
cp .env.example .env.local
# fill in the values from steps 1-4 (leave Telegram vars blank if skipped)
npm install
npm run dev
```

Open http://localhost:3000, log in with `DASHBOARD_PASSWORD`.

## 6. Deploy to Vercel

**Plan: Hobby vs Pro.** Vercel's Hobby tier is technically for personal,
non-commercial use — Hechwan is a commercial practice, so strictly Pro
($20/month) is the compliant choice. In practice, enforcement targets
obviously commercial/high-traffic/customer-facing projects, and Hechwan OS is
low-traffic internal tooling (just you, not client-facing), so the risk was
judged low enough to start on **Hobby** and upgrade if it ever becomes a live
concern. Switching plans later is a couple of clicks in the dashboard, no
redeploy needed — so this isn't a locked-in decision.

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
vercel env add USER_TIMEZONE production
vercel env add USER_ID production
```

Redeploy after adding env vars: `vercel --prod`.

## 7. Personalize

- `lib/operatorConfig.ts` already has your name and role (Hechwan founder) filled
  in — `location` is still a placeholder ("Your city"), since that's not
  something to guess. Fill that in, and update `currentFocus` as it changes.
- The **CRM tab is your client tracker** — "clients" are `entities` with
  `kind: "client"`, created inline from the CRM page.
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
