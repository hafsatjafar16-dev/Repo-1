# Personal OS

A single-user practice-management dashboard: capture (Telegram voice bot +
web form) → AI classification → tasks/journal/notes/goals, a CRM that doubles
as a client tracker, a habit tracker, and a memory layer you can search or ask
questions against.

Built from the "Personal OS Build Cheat Sheet" guide, on the stack recorded in
`../tooling/personal-os-stack-decision.md`: Next.js + Supabase (EU region) +
Claude/OpenAI + Vercel + Telegram.

**Not deployed yet.** See `SETUP.md` for account creation, credentials, and
deployment steps — none of that could be done automatically since it needs
your own Supabase/Vercel/Telegram/Anthropic/OpenAI accounts.

## Local development

```bash
cp .env.example .env.local   # fill in credentials per SETUP.md
npm install
npm run dev
```

## Structure

- `app/` — pages (Home, CRM, Brain, Finance, Journal, Health) and API routes
- `components/dashboard/` — Panel, TopRail, Shell, and the card components
- `lib/` — Supabase client, auth, LLM clients, capture pipeline, classifier
- `supabase/migrations/0001_init.sql` — full schema + vector search function
- `proxy.ts` — single-password auth gate (Next.js 16 renamed `middleware.ts`)
