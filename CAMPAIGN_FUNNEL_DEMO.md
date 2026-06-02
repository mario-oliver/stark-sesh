# Meta Campaign Funnel Orchestrator — Demo Guide

## What this proves

> Meta campaign input → LangChain brief → CMS landing variants → (Meta ad metrics + Vercel web metrics) → optimizer recommendation

The optimizer uses **both** ad-layer efficiency (CTR, signup rate, cost per signup) and web-layer engagement (bounce, scroll depth, CTA clicks) to recommend the next experiment.

## Prerequisites

1. **API** (`api-film-sesh`) running on port 3001 (or your `NEXT_PUBLIC_API_URL`)
2. **Frontend** (`film-sesh`) on port 3000
3. Environment variables:

```bash
# api-film-sesh/.env
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
ALLOWED_ORIGINS=http://localhost:3000
DOMAIN=http://localhost:3000

# film-sesh/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3036
NEXT_PUBLIC_CAMPAIGN_GATE_PASSWORD=your-shared-password
```

## Access control

| Route | Clerk sign-in | Faux password |
|-------|---------------|---------------|
| `/campaign/{slug}?variant=…` | No (public Meta landing) | No |
| `/campaigns`, `/campaign-funnel/*` | Yes | Yes (`NEXT_PUBLIC_CAMPAIGN_GATE_PASSWORD`) |

[Vercel Web Analytics](https://vercel.com/docs/analytics) is enabled via `@vercel/analytics` in the root layout (automatic page views and Web Vitals on deploy). Campaign CTA/scroll events use Vercel's `track()` helper.

## Run locally

```bash
# Terminal 1
cd api-film-sesh && npm run dev

# Terminal 2
cd film-sesh && npm run dev
```

Open **http://localhost:3000/campaign-funnel**

## Demo script (5 minutes)

1. **Input (left panel)** — Review pre-filled HoopReads Instagram campaign. Click **Run experiment and campaign agents**.

2. **Agent workflow (right panel)** — Watch two steps complete with structured JSON:
   - Meta Campaign Brief Agent
   - Content Experimentation Agent (2–3 variants)

3. **CMS preview (center)** — Switch tabs (Variant A/B/C). Hero uses Steve Kerr background; brand color `#1B69A1`. Click **Save & launch** to persist and get live ad URLs.

4. **Campaigns list** — Open `/campaigns` to view saved experiments. **View** opens read-only funnel; **Iterate** opens optimize mode.

5. **Performance iteration** — On `/campaign-funnel/{slug}?mode=optimize`, paste Meta + web analytics into the textareas, run the iteration agent, then **Save & launch new variants**.

6. **Public preview** — Share launched URLs (no password), e.g. `/campaign/{slug}?variant=variant-a`. Open in incognito to verify landings work without the admin gate.

## Interview line

> "I built a Meta Campaign Funnel Orchestrator where LangChain agents hand off structured JSON through a fixed CMS template. The iteration flow uses pasted Meta performance plus Vercel web analytics so the next variants reflect the full path from click to signup."

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/campaign-funnel/defaults` | Default campaign input |
| POST | `/v1/campaign-funnel/brief` | Brief agent |
| POST | `/v1/campaign-funnel/variants` | Content experimentation agent |
| GET | `/v1/campaign-funnel/performance/:pageId` | Demo performance snapshot |
| POST | `/v1/campaign-funnel/optimize` | Optimizer agent |
| POST | `/v1/campaign-funnel/run` | Brief + variants only |
| GET | `/v1/campaigns` | List saved campaigns |
| POST | `/v1/campaigns` | Save draft or launch |
| POST | `/v1/campaigns/:slug/iterate` | Performance iteration agent |

## Fallback behavior

If OpenAI/LangChain fails or times out (30s), agents return canned HoopReads fixtures so the demo always completes.
