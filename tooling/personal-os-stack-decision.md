# Personal OS / Practice-Management Tool — Stack Decision

Source: "Personal OS Build Cheat Sheet" (Miles Deutscher / AI Edge) — a build
guide for a personal AI dashboard (task/CRM/journal/habits/finance/memory,
captured via a Telegram voice bot). Not built yet — this doc records the
stack comparison and decision so the build can start from here later.

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
  Next.js support, cron included (needed for scheduled tasks like a daily
  snapshot or morning briefing).
- **Capture: Telegram bot** — free, fastest to stand up. **Caveat: use it for
  personal task/idea capture only — not for client-confidential material**
  (PIFs, formulas, correspondence). This tool is practice-management, not a
  client data system.
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

## Expected cost

$0/month infrastructure (all free tiers) + an estimated **$15–30/month** in
LLM/embedding API usage, in line with the guide's own ~$30/month estimate for
the default stack at active use.

## Status

Comparison only — **not yet built**. See the original guide (Parts 2–9) for
the build sequence (design → foundation → capture pipeline → cards → memory
→ deployment) if/when this becomes a live build.
