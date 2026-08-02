# Personal OS

A single-user practice-management tool for a solo consulting practice:
capture (web form + optional Telegram voice bot) → AI classification →
tasks/journal/notes/goals, a CRM that doubles as a client tracker, and a
memory layer (Brain) you can search or ask questions against.

Trimmed from the original "Personal OS Build Cheat Sheet" guide to just what
a consulting practice needs — the guide's personal-life cards (Nutrition,
Habit Tracker, Calendar, Finance Pulse) were cut as scope creep. See
`../tooling/personal-os-stack-decision.md` for that call and the stack
decision: Next.js + Supabase (EU region) + Claude/OpenAI + Vercel + optional
Telegram.

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

- `app/` — pages (Home, CRM, Brain, Journal) and API routes
- `components/dashboard/` — Panel, TopRail, Shell, and the card components
- `lib/` — Supabase client, auth, LLM clients, capture pipeline, classifier
- `supabase/migrations/0001_init.sql` — full schema + vector search function
- `proxy.ts` — single-password auth gate (Next.js 16 renamed `middleware.ts`)
