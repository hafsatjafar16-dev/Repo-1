# Personal OS / Practice-Management Tool — Stack Decision

Source: "Personal OS Build Cheat Sheet" (Miles Deutscher / AI Edge) — a build
guide for a personal AI dashboard (task/CRM/journal/habits/finance/memory,
captured via a Telegram voice bot). This doc records the stack comparison
and decision; the build itself lives in `../personal-os/`.

## Scope cut: trimmed to what the consulting practice actually needs

The guide's default is a general personal-life dashboard. For "a secondary
regulatory consultant to lean on, help with clients and tasks," most of that
is unused surface area rather than a requirement. Cut:

- **Nutrition, Habit Tracker, Calendar, Finance Pulse (personal net worth)**
  — personal-life cards from the guide's default persona, not consulting-
  practice tooling. Removed from the build entirely (components, API routes,
  pages, and the `exceljs`/`ical.js`/`google-auth-library` dependencies they
  needed).

Kept:

- **Capture pipeline** (web form + optional Telegram) → AI classification →
  tasks/journal/notes/goals.
- **CRM** — doubles as the client tracker (Kanban/Smart/Category views).
- **Brain** — memory search + ask, useful for "what did we decide about
  client X's claim substantiation last month."
- **Journal** — quick daily capture.

This didn't change the infrastructure needed (Supabase, Anthropic, OpenAI
are all still required — see `../personal-os/SETUP.md`) since those power
the kept features too. It mainly removes unused code, a few dependencies,
and the Google Calendar/Sheets setup steps that would otherwise have been
dead weight.

## Decision: use the guide's default stack, with one specific reason

- **Database: Supabase (Postgres + pgvector), EU region (Frankfurt)** — free
  tier covers solo use; bundled vector search covers the memory/search layer
  without extra services. EU region matters here specifically because this
  tool will hold client/task data for a regulatory consulting practice —
  Firebase and most alternatives don't give as clean an EU-residency story.
- **LLM: Claude (primary) + OpenAI (fallback)** — usage-based, no flat fee.
  Already have Claude access via this environment, so no new subscription.
  Claude's structured-output strength suits classification/routing tasks.
- **Hosting: Vercel, free tier** — ~$0/month (PDF's own figure), first-class
  Next.js support. No cron needed anymore since Finance Pulse (the only
  feature that used one) was cut.
- **Capture: web form, with Telegram bot as an optional add-on** — Telegram
  is free and fast to stand up, but it's just an input channel; skip it if
  you'd rather not manage one more account. **Caveat regardless of channel:
  use it for your own task/idea capture only — not for client-confidential
  material** (PIFs, formulas, correspondence). This tool is
  practice-management, not a client data system.
- **Embeddings: OpenAI `text-embedding-3-small`** — ~$0.02/M tokens (PDF),
  negligible at solo-use volume.

## Rejected alternatives and why

| Component | Alternative | Why not |
|---|---|---|
| Database | Turso | No native vector support, needs a second service bolted on |
| Database | PlanetScale | No free tier, MySQL — overkill for solo use |
| Hosting | Railway | ~$5/month minimum (PDF) for no benefit over Vercel free tier here |
| Hosting | Fly.io | Only needed for long-running processes (e.g. local LLM) — not applicable |
| Memory/vector | Pinecone / Weaviate | Extra managed service and cost; Supabase pgvector already covers it |
| LLM | Local Llama | No API cost but needs dedicated hardware — not worth it for occasional use |

## Expected cost (trimmed scope)

$0/month infrastructure (all free tiers). LLM/embedding API usage at
realistic solo-consulting volume (client-driven captures, occasional CRM
smart search and Brain queries — not habitual multi-times-daily personal
logging) is estimated at **~$5–15/month**, lower than the guide's own
~$30/month figure since that included Nutrition/Finance Pulse's extra Claude
calls, which are gone. A $20 balance with a spend cap on each of
Anthropic/OpenAI is comfortable headroom.

## Status

Built — see `../personal-os/`. Not yet deployed; `SETUP.md` there has the
account-creation and credential-wiring steps.
