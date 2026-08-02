# Hechwan OS

Hafsat Jaafar's practice-management tool for **Hechwan** (EU/EMEA cosmetics
regulatory consulting, run alongside her full-time role at ChemView):
capture (web form + optional Telegram voice bot) → AI classification →
tasks/journal/notes/goals, a CRM that doubles as a client tracker, and a
memory layer (Brain) you can search or ask questions against.

Trimmed from the original "Personal OS Build Cheat Sheet" guide to just what
Hechwan needs — the guide's personal-life cards (Nutrition, Habit Tracker,
Calendar, Finance Pulse) were cut as scope creep. See
`../tooling/personal-os-stack-decision.md` for that call and the stack
decision: Next.js + Supabase (EU region) + Claude/OpenAI + Vercel + optional
Telegram.

**Live**: https://personal-os-lac-pi.vercel.app — deployed on Vercel (Hobby),
Supabase (Frankfurt), Anthropic + OpenAI. See `SETUP.md` for how it was set
up, or to reproduce.

## Local development

```bash
cp .env.example .env.local   # fill in credentials per SETUP.md
npm install
npm run dev
```

## Structure

- `app/` — pages (Home, CRM, Brain, Journal, Review) and API routes
- `components/dashboard/` — Panel, TopRail, Shell, and the card components
- `lib/` — Supabase client, auth, LLM clients, capture pipeline, classifier
- `supabase/migrations/0001_init.sql` — full schema + vector search function
- `proxy.ts` — single-password auth gate (Next.js 16 renamed `middleware.ts`)
