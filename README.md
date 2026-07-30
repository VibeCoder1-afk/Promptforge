# PromptForge

A platform for designing, testing, versioning, and evaluating LLM prompts across multiple AI models — with analytics, cost tracking, and performance metrics.

Think of it as **GitHub + Postman + Vercel for prompts.**

![status](https://img.shields.io/badge/status-MVP-7C5CFF) ![node](https://img.shields.io/badge/node-%3E%3D18-4ADE80) ![license](https://img.shields.io/badge/license-MIT-8B92A5)

---

## Problem Statement

Teams that build with LLMs end up managing prompts the way developers managed code before version control existed: pasted in docs, overwritten in place, no history of what changed or why a change made outputs worse. There's no easy way to know:

- Which version of a prompt is actually live
- Whether GPT-4.1, Gemini, or Claude handles it best
- What a prompt costs to run at scale, or how its latency trends over time
- Whether the "improved" prompt is actually more consistent, or just felt better once

PromptForge gives prompts the same tooling code already has: versioning with diffs and rollback, a place to test variables (`{{like_this}}`), side-by-side model comparison, A/B testing, and dashboards for cost, latency, and quality — all in one workspace, with a public gallery for reusable templates.

---

## Elevator Pitch

A full-stack platform for creating, versioning, and evaluating LLM prompts across multiple AI models, with analytics, cost tracking, and performance metrics baked in from day one.

---

## Architecture Diagram

```mermaid
flowchart LR
    subgraph Client["Frontend — React + TypeScript + Tailwind"]
        UI[Prompt Editor / Workspace / Analytics / Gallery]
    end

    subgraph API["Backend — Node.js + Express"]
        Auth[Auth — JWT]
        Prompts[Prompts + Versions]
        Eval[Evaluate / Compare / A-B Test]
        Analytics[Analytics + Cost Tracker]
        Gallery[Public Gallery + Teams]
    end

    subgraph Providers["AI Providers"]
        OpenAI[OpenAI API]
        Gemini[Google Gemini API]
        Claude[Anthropic Claude API]
    end

    DB[(MongoDB)]

    UI -->|REST + JWT| API
    Prompts --> DB
    Eval --> DB
    Analytics --> DB
    Gallery --> DB
    Eval --> OpenAI
    Eval --> Gemini
    Eval --> Claude
```

**Request flow for a single evaluation:** the editor renders `{{variables}}` into the saved prompt version → the backend calls the chosen provider's API → the response, token usage, latency, and cost are stored as an `Evaluation` document → the dashboard aggregates those documents into stats.

---

## Database Schema

MongoDB, via Mongoose. Six core collections:

```mermaid
erDiagram
    User ||--o{ Prompt : owns
    User ||--o{ Collection : owns
    User }o--o{ Team : "member of"
    Team ||--o{ Prompt : "shared with"
    Prompt ||--|{ PromptVersion : "has versions"
    Prompt ||--o{ Evaluation : "has runs"
    PromptVersion ||--o{ Evaluation : "evaluated as"
    Collection ||--o{ Prompt : groups

    User {
        string name
        string email
        string passwordHash
        objectId team
    }
    Team {
        string name
        objectId owner
        string inviteCode
    }
    Collection {
        string name
        objectId owner
        string color
    }
    Prompt {
        string title
        string workspace
        objectId owner
        objectId collection
        objectId currentVersion
        bool isPublicTemplate
        array favoritedBy
    }
    PromptVersion {
        int versionNumber
        string content
        array variables
        bool jsonMode
        string notes
    }
    Evaluation {
        string provider
        string model
        string output
        int latencyMs
        int tokensInput
        int tokensOutput
        float costUsd
        int starRating
    }
```

---

## API Documentation

Base URL: `http://localhost:5000/api` (dev) — all routes except `/auth/register`, `/auth/login`, and `GET /gallery` require `Authorization: Bearer <token>`.

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Create an account — `{ name, email, password }` |
| POST | `/auth/login` | Log in — `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | Current user |

### Prompts & Versions
| Method | Route | Description |
|---|---|---|
| GET | `/prompts?workspace=&collection=&q=&favorites=` | List/filter/search prompts |
| POST | `/prompts` | Create prompt — `{ title, description, workspace, collection, content }` |
| GET | `/prompts/:id` | Get one prompt (with current version) |
| PATCH | `/prompts/:id` | Update title/description/workspace/collection/publish flag |
| DELETE | `/prompts/:id` | Delete a prompt and its versions |
| POST | `/prompts/:id/favorite` | Toggle favorite |
| POST | `/prompts/:id/duplicate` | Duplicate a prompt with full version history |
| GET | `/prompts/:promptId/versions` | List versions (newest first) |
| POST | `/prompts/:promptId/versions` | Save a new version — `{ content, notes, jsonMode, functionCallingEnabled }` |
| POST | `/prompts/:promptId/versions/:versionNumber/rollback` | Roll back (creates a new version copying the old content) |
| GET | `/prompts/:promptId/versions/diff?from=&to=` | Line-level diff between two versions |

### Evaluate (run against models)
| Method | Route | Description |
|---|---|---|
| POST | `/evaluate` | Run one version against one provider — `{ promptId, versionId, provider, model?, variableValues }` |
| POST | `/evaluate/compare` | Run one version across multiple providers — `{ promptId, versionId, providers: [{provider, model?}], variableValues }` |
| POST | `/evaluate/ab-test` | Run two versions on the same input — `{ promptId, versionAId, versionBId, provider, variableValues }` |
| POST | `/evaluate/:id/rate` | Rate a run — `{ starRating }` or `{ criteria: { accuracy, creativity, relevance, jsonValidity } }` |
| GET | `/evaluate?promptId=` | Run history |

### Analytics
| Method | Route | Description |
|---|---|---|
| GET | `/analytics/dashboard` | Total prompts, success rate, avg latency, tokens used, cost, avg rating |
| GET | `/analytics/latency` | Time series of latency per run |
| GET | `/analytics/cost` | Cost today / this month |
| GET | `/analytics/history` | Runs bucketed into today / yesterday / last week |

### Collections, Teams, Gallery, Export
| Method | Route | Description |
|---|---|---|
| GET/POST/DELETE | `/collections` | Manage folders (Sales, Programming, Healthcare, Finance, ...) |
| GET | `/teams/me` | Current user's team |
| POST | `/teams` | Create a team (generates an invite code) |
| POST | `/teams/join` | Join with `{ inviteCode }` |
| POST | `/teams/leave` | Leave current team |
| GET | `/gallery` | Browse public templates (no auth required) |
| POST | `/gallery/:id/fork` | Fork a public template into your workspace |
| GET | `/export/:id/json` \| `/markdown` \| `/pdf` | Export a prompt + its version history |

---

## Folder Structure

```
promptforge/
├── backend/
│   ├── src/
│   │   ├── config/db.js               # Mongo connection
│   │   ├── models/                    # User, Team, Collection, Prompt, PromptVersion, Evaluation
│   │   ├── middleware/auth.js         # JWT guard
│   │   ├── services/aiProviders.js    # OpenAI / Gemini / Claude adapter + cost calc + prompt scoring
│   │   ├── controllers/               # Business logic per resource
│   │   ├── routes/                    # Express routers, mounted in server.js
│   │   ├── utils/seed.js              # Demo user + sample prompt
│   │   └── server.js                  # App entry point
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/                     # Login, Register, Workspace, PromptEditor, Analytics, Gallery, TeamWorkspace, Favorites, Search
│   │   ├── components/                # Sidebar, Layout, VariablesPanel, VersionControlPanel, ModelComparePanel, ABTestPanel, EvaluationCard, ExportMenu, PromptCard
│   │   ├── context/AuthContext.tsx
│   │   ├── lib/api.ts                 # Axios client + shared types
│   │   └── App.tsx / main.tsx
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
├── docker-compose.yml                 # Local Mongo + backend
├── render.yaml                        # Render deploy blueprint (backend)
└── README.md
```

---

## Tech Stack

**Frontend:** React, TypeScript, Tailwind CSS, React Query, React Router, Recharts, lucide-react
**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, express-rate-limit, PDFKit
**AI:** OpenAI API, Google Gemini API, Anthropic Claude API — each provider is optional; if a key is missing, that provider runs in a clearly-labeled mock mode so the app is fully demoable before you add billing.

---

## Setup

### Prerequisites
- Node.js 18+
- A MongoDB instance — [MongoDB Atlas](https://www.mongodb.com/atlas) free tier, or local `mongod` / the included Docker Compose

### 1. Backend
```bash
cd backend
cp .env.example .env       # fill in MONGO_URI, JWT_SECRET, and any AI provider keys you have
npm install
npm run seed                # optional: creates demo@promptforge.dev / demo1234 with a sample prompt
npm run dev
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env        # set VITE_API_URL if the backend isn't on localhost:5000
npm install
npm run dev
```

Visit `http://localhost:5173`.

### Adding real AI provider keys
Add any of these to `backend/.env` — only the ones you set are called live, the rest fall back to mock output:
```
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Deployment (GitHub → Live)

1. **Push to GitHub**
   ```bash
   cd promptforge
   git init
   git add .
   git commit -m "Initial commit: PromptForge"
   git branch -M main
   git remote add origin https://github.com/<your-username>/promptforge.git
   git push -u origin main
   ```

2. **Database — MongoDB Atlas**
   Create a free cluster at mongodb.com/atlas, add a database user, allow access from anywhere (0.0.0.0/0) for simplicity, and copy the connection string into `MONGO_URI`.

3. **Backend — Render** (or Railway/Fly.io)
   - New Web Service → connect your GitHub repo → root directory `backend`
   - Build command `npm install`, start command `npm start`
   - Add env vars: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your Vercel URL once you have it), and any AI keys
   - A `render.yaml` blueprint is included at the repo root for one-click setup

4. **Frontend — Vercel**
   - New Project → import the repo → root directory `frontend`
   - Framework preset: Vite
   - Add env var `VITE_API_URL` = your Render backend URL + `/api`
   - Deploy

5. Update the backend's `CLIENT_URL` env var to your live Vercel URL (for CORS), and redeploy the backend.

---

## Screenshots

_Add screenshots here once deployed — the editor, model comparison view, and analytics dashboard are the most worth showing off._

```
docs/screenshots/editor.png
docs/screenshots/compare-models.png
docs/screenshots/analytics.png
```

---

## Future Improvements

- Redis-backed caching for repeated evaluations and rate limiting at scale
- Function-calling schema builder (define tool signatures visually, not just a toggle)
- Team-level roles and permissions (owner/editor/viewer) instead of flat membership
- Streaming responses in the editor instead of waiting for full completions
- Prompt Score upgraded from static heuristics to an LLM-as-judge pipeline
- Webhooks / API keys so PromptForge prompts can be called from external apps directly

---

## License

MIT
