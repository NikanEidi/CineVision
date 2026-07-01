<div align="center">

<img src="https://api.iconify.design/lucide:clapperboard.svg?color=%238b5cf6&width=76" width="76" alt="CineVision" />

# CineVision

**A full-stack Movie &amp; TV tracker with AI-powered recommendations and a Liquid-Glass UI.**

<p>
  <img src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7-20232A?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Flask-3-20232A?style=for-the-badge&logo=flask&logoColor=white" alt="Flask 3" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-20232A?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
  <img src="https://img.shields.io/badge/scikit--learn-ML-20232A?style=for-the-badge&logo=scikitlearn&logoColor=F7931E" alt="scikit-learn" />
  <img src="https://img.shields.io/badge/TMDB-API-20232A?style=for-the-badge&logo=themoviedatabase&logoColor=01D277" alt="TMDB" />
</p>

<p>
  <a href="#overview">Overview</a> ·
  <a href="#features">Features</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#recommendation-engine">Recommendation Engine</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#api-reference">API</a>
</p>

</div>

---

<h2 id="overview"><img src="https://api.iconify.design/lucide:eye.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;Overview</h2>

CineVision lets you browse movies and TV shows from **TMDB**, curate a personal watchlist backed by **Supabase**, and receive **content-based recommendations** from a **Flask + scikit-learn** service. The interface is a cohesive *Liquid-Glass* design system: one shared navigation component, a reusable media-card frame, a cinematic video landing screen, and a coverflow search whose blurred backdrop tracks the focused result.

<table>
<tr>
<td><b>Frontend</b></td>
<td>React 19 SPA (Vite) with a token-driven glass design system, framer-motion animations, and full responsiveness.</td>
</tr>
<tr>
<td><b>Backend</b></td>
<td>Flask API that builds a TF-IDF model over a TMDB-seeded catalog and ranks recommendations by cosine similarity.</td>
</tr>
<tr>
<td><b>Data</b></td>
<td>Supabase for auth &amp; watchlist storage; TMDB for movie/TV metadata and imagery.</td>
</tr>
</table>

---

<h2 id="features"><img src="https://api.iconify.design/lucide:sparkles.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;Features</h2>

<table>
<tr>
<td valign="top" width="50%">

**<img src="https://api.iconify.design/lucide:shield-check.svg?color=%2300E5FF&width=16" width="16" /> Authentication**
- Secure sign-up / sign-in via Supabase Auth
- Guest (anonymous) sign-in — try it with no account
- Password reset flow with email verification
- Persistent sessions

**<img src="https://api.iconify.design/lucide:bookmark.svg?color=%2300E5FF&width=16" width="16" /> Watchlist**
- Add, remove, and organize movies &amp; shows
- Watched status and episode-level progress
- Group by genre, rating, or media type

</td>
<td valign="top" width="50%">

**<img src="https://api.iconify.design/lucide:brain-circuit.svg?color=%2300E5FF&width=16" width="16" /> AI Recommendations**
- TF-IDF (1–2 grams) + cosine similarity
- Signal from title, overview, genres, keywords, cast &amp; creators
- Watchlist seeds weighted by rating
- Artifacts cached to disk, rebuildable on demand

**<img src="https://api.iconify.design/lucide:palette.svg?color=%2300E5FF&width=16" width="16" /> Design &amp; UX**
- Unified `Sidebar` — identical nav on every page, mobile bottom bar
- Shared media-card frame across all listings
- Coverflow search backdrop that tracks the focused result
- Fully responsive, dark, glassmorphic

</td>
</tr>
</table>

---

<h2 id="architecture"><img src="https://api.iconify.design/lucide:network.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;Architecture</h2>

```mermaid
graph LR
    subgraph client["Client · React 19 + Vite"]
        UI["Pages · Coverflow Search"]
        NAV["Shared Sidebar"]
    end
    subgraph services["Cloud Services"]
        SUPA["Supabase<br/>Auth + Watchlist DB"]
        TMDB["TMDB API<br/>Movies · TV · Images"]
    end
    subgraph api["Flask API · Python"]
        REC["Recommender<br/>TF-IDF + Cosine"]
        ART["Artifacts Cache<br/>parquet · npz · pkl"]
    end

    UI -->|"search · details"| TMDB
    UI -->|"auth · watchlist"| SUPA
    UI -->|"POST /recommend"| REC
    REC -->|"seed catalog (cold start)"| TMDB
    REC <-->|"load · save"| ART
```

The React app talks to **TMDB** for metadata, **Supabase** for auth and watchlist persistence, and the **Flask** service for recommendations. On a cold start the recommender seeds its catalog from TMDB and caches the fitted model so subsequent requests are fast.

---

<h2 id="recommendation-engine"><img src="https://api.iconify.design/lucide:brain-circuit.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;Recommendation Engine</h2>

Content-based filtering over a catalog seeded from TMDB's most popular movies and shows. Each title is turned into a text document (title, overview, genres, keywords, cast, directors/creators), vectorized with TF-IDF, and compared with cosine similarity.

```mermaid
flowchart TD
    A["Watchlist seeds<br/>media_type + media_id"] --> B{"Match seeds to<br/>catalog rows"}
    B -->|"matched"| C["Weight each seed<br/>by rating (vote_average)"]
    C --> D["Sum weighted TF-IDF vectors<br/>into one query vector"]
    D --> E["Cosine similarity<br/>vs. full catalog matrix"]
    E --> F["Drop seeds<br/>+ optional media-type filter"]
    F --> G["Rank · take Top-K"]
    G --> H["Return results JSON"]
    B -->|"no match"| Z["Return empty list"]
```

A typical recommendation request end-to-end:

```mermaid
sequenceDiagram
    actor U as User
    participant R as React App
    participant S as Supabase
    participant F as Flask API
    participant T as TMDB
    U->>R: Open Recommendations
    R->>S: Fetch watchlist (user_id)
    S-->>R: Watchlist items
    R->>F: POST /recommend { watchlist, limit }
    Note over F,T: Cold start seeds catalog from TMDB, then caches artifacts
    F->>F: TF-IDF + cosine similarity
    F-->>R: Ranked results
    R-->>U: Recommendation rows
```

---

<h2 id="keeping-the-backend-awake"><img src="https://api.iconify.design/lucide:zap.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;Keeping the Backend Awake</h2>

The backend runs on Render's free tier, which **spins the service down after ~15 minutes of inactivity**. The first request after idle then pays a **cold start** — measured **~67s cold vs. ~0.15s warm**. Two lightweight mechanisms keep recommendations snappy:

- **Warm-up ping** — the frontend fires `GET /healthz` on app load ([`App.jsx`](frontend/src/App.jsx)), so the backend starts waking while the user browses and signs in, instead of blocking their first `POST /recommend`.
- **Keep-alive** — an external uptime monitor pings `/healthz` every ~10 minutes so the service never sleeps, keeping even a first-time visitor's request fast.

```mermaid
sequenceDiagram
    participant U as User
    participant A as Frontend (App.jsx)
    participant C as Uptime monitor
    participant B as Backend (Render free)

    Note over C,B: Keep-alive — ping every ~10 min prevents spin-down
    loop every ~10 minutes
        C->>B: GET /healthz
        B-->>C: 200 ok
    end

    U->>A: Open the app
    A->>B: GET /healthz (warm-up on load)
    Note over B: cold start begins early, overlaps with browsing
    B-->>A: 200 ok
    U->>A: Add to watchlist / open Recommendations
    A->>B: POST /recommend
    B-->>A: ~150 ms - already warm
```

**Set up the keep-alive** (free, ~2 minutes):

1. Create a free account at [cron-job.org](https://cron-job.org) (or [UptimeRobot](https://uptimerobot.com)).
2. Add a cronjob → URL `https://cinevision.onrender.com/healthz`, method `GET`, schedule every **10 minutes** (`*/10 * * * *`).
3. Save &amp; enable.

> Render's free web service allows ~750 instance-hours/month — enough to keep one backend awake 24/7 (~720h). The frontend is a static site and doesn't count against that.

---

<h2 id="tech-stack"><img src="https://api.iconify.design/lucide:layers.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;Tech Stack</h2>

<div align="center">

<img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/Vite_7-20232A?style=flat-square&logo=vite&logoColor=FFD62E" />
<img src="https://img.shields.io/badge/JavaScript-20232A?style=flat-square&logo=javascript&logoColor=F7DF1E" />
<img src="https://img.shields.io/badge/React_Router-20232A?style=flat-square&logo=reactrouter&logoColor=CA4245" />
<img src="https://img.shields.io/badge/Framer_Motion-20232A?style=flat-square&logo=framer&logoColor=white" />
<img src="https://img.shields.io/badge/Axios-20232A?style=flat-square&logo=axios&logoColor=5A29E4" />
<br/>
<img src="https://img.shields.io/badge/Python-20232A?style=flat-square&logo=python&logoColor=FFD43B" />
<img src="https://img.shields.io/badge/Flask-20232A?style=flat-square&logo=flask&logoColor=white" />
<img src="https://img.shields.io/badge/scikit--learn-20232A?style=flat-square&logo=scikitlearn&logoColor=F7931E" />
<img src="https://img.shields.io/badge/pandas-20232A?style=flat-square&logo=pandas&logoColor=white" />
<img src="https://img.shields.io/badge/NumPy-20232A?style=flat-square&logo=numpy&logoColor=4DABCF" />
<img src="https://img.shields.io/badge/Supabase-20232A?style=flat-square&logo=supabase&logoColor=3ECF8E" />

</div>

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite 7, React Router, Framer Motion, Supabase JS, Axios |
| **Backend** | Python 3.11+, Flask 3, Flask-CORS, Gunicorn |
| **ML / Data** | scikit-learn (TF-IDF, `linear_kernel`), SciPy sparse, pandas, NumPy, PyArrow |
| **Services** | Supabase (Auth + Postgres), TMDB API |
| **Design** | Liquid-Glass tokens, Orbitron · Oxanium · Outfit · Inter |

---

<h2 id="project-structure"><img src="https://api.iconify.design/lucide:folder-tree.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;Project Structure</h2>

```
CineVision/
├── frontend/
│   ├── public/                     # Static assets (videos, images, SVGs)
│   ├── src/
│   │   ├── styles/                 # Modular CSS system
│   │   │   ├── design-system.css   # Tokens, resets, utilities, animations
│   │   │   ├── components.css      # Reusable component styles (sidebar, cards…)
│   │   │   ├── layouts.css         # Page layouts (auth, dashboard, detail, intro)
│   │   │   ├── search.css          # Coverflow search page
│   │   │   ├── responsive.css      # All breakpoints (imported last)
│   │   │   └── index.css           # CSS entry point (@imports the above)
│   │   ├── components/
│   │   │   └── Sidebar.jsx          # Shared navigation used by every page
│   │   ├── main.jsx                 # App entry — mounts React & loads global styles
│   │   ├── App.jsx                  # Router & route definitions
│   │   ├── Animations.jsx           # Cinematic landing / intro screen
│   │   ├── DashBoard.jsx            # Home page
│   │   ├── Movies.jsx               # Movies browse
│   │   ├── Shows.jsx                # TV shows browse
│   │   ├── Search.jsx               # Coverflow search
│   │   ├── Detail.jsx               # Movie/show detail
│   │   ├── Watchlist.jsx            # User watchlist
│   │   ├── Recommendation.jsx       # AI recommendations
│   │   ├── Login.jsx · Signup.jsx   # Auth screens
│   │   ├── ForgotPassword.jsx · UpdatePassword.jsx
│   │   ├── Footer.jsx               # Global footer
│   │   └── supabaseClient.js        # Supabase config
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── app.py                       # Flask API (healthz · recommend · rebuild)
│   ├── recommender.py               # TF-IDF + cosine recommendation engine
│   ├── requirements.txt             # Python dependencies
│   └── artifacts/                   # Cached model (gitignored)
│
├── .gitignore · LICENSE · README.md
```

---

<h2 id="app-routes"><img src="https://api.iconify.design/lucide:route.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;App Routes</h2>

The landing screen leads to auth; once signed in, the shared sidebar cross-links every core page, and each listing routes into the shared detail view.

```mermaid
graph TD
    INTRO["/ · Landing"] --> LOGIN["/login"]
    INTRO --> SIGNUP["/signup"]
    LOGIN --> DASH["/dashboard"]
    SIGNUP --> DASH

    DASH <--> MOV["/movies"]
    DASH <--> SHOW["/shows"]
    DASH <--> SEARCH["/search"]
    DASH <--> REC["/recommendation"]
    DASH <--> WATCH["/watchlist"]

    MOV --> DET["/detail/:type/:id"]
    SHOW --> DET
    SEARCH --> DET
    WATCH --> DET
    REC --> DET
```

---

<h2 id="getting-started"><img src="https://api.iconify.design/lucide:rocket.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;Getting Started</h2>

**Prerequisites** — Node.js 18+, Python 3.11+, a Supabase project, and a TMDB API key.

**1. Clone**

```bash
git clone https://github.com/NikanEidi/CineVision.git
cd CineVision
```

**2. Frontend**

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_API_BASE=http://127.0.0.1:5178
```

```bash
npm run dev
```

> To use **Sign in as Guest**, enable **Anonymous sign-ins** in Supabase under Authentication → Providers.

**3. Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
TMDB_API_KEY=your_tmdb_api_key
```

```bash
python app.py                   # dev — serves on http://0.0.0.0:5178
# production: gunicorn -w 2 -b 0.0.0.0:5178 app:app
```

**4. Open** — the frontend runs at `http://localhost:5173`.

---

<h2 id="api-reference"><img src="https://api.iconify.design/lucide:server.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;API Reference</h2>

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `GET` | `/healthz` | Health check; ensures the model is loaded/built |
| `POST` | `/recommend` | Ranked recommendations from a watchlist |
| `POST` | `/rebuild` | Clear artifacts and rebuild the catalog from TMDB |

**`POST /recommend`**

```jsonc
// Request
{
  "watchlist": [
    { "media_type": "movie", "media_id": 550 },
    { "media_type": "tv",    "media_id": 1399 }
  ],
  "limit": 20,
  "media_types": ["movie", "tv"]   // optional filter
}
```

```jsonc
// Response
{
  "results": [
    {
      "media_type": "movie",
      "id": 807,
      "title": "Se7en",
      "poster_path": "/6yoghtyTpznpBik8EngEmJskVUO.jpg",
      "vote_average": 8.4,
      "similarity": 0.42,
      "genres": "Crime, Mystery, Thriller"
    }
  ]
}
```

---

<h2 id="design-system"><img src="https://api.iconify.design/lucide:palette.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;Design System</h2>

CSS is layered and token-driven; import order is enforced by `index.css`:

```css
@import './design-system.css';  /* Tokens, resets, utilities, animations */
@import './components.css';     /* Reusable components (sidebar, cards…)   */
@import './layouts.css';        /* Page structures (auth, dashboard, intro)*/
@import './search.css';         /* Coverflow search                        */
@import './responsive.css';     /* Breakpoints — MUST be last              */
```

```css
:root {
  /* Color */
  --color-primary: #5F099E;
  --color-accent-cyan: #00E5FF;
  --bg-primary: #0A0A0F;

  /* Glass */
  --glass-bg-medium: rgba(255, 255, 255, 0.08);
  --blur-md: blur(16px);

  /* Typography */
  --font-display: 'Orbitron', 'Outfit', sans-serif;
  --font-heading: 'Oxanium', 'Outfit', sans-serif;
  --font-body: 'Inter', 'Outfit', system-ui, sans-serif;
}
```

---

<h2 id="responsive-breakpoints"><img src="https://api.iconify.design/lucide:smartphone.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;Responsive Breakpoints</h2>

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile SM | &lt; 480px | Single column, icon-only nav |
| Mobile | 480–599px | Compact cards |
| Mobile LG | 600–767px | Stacked actions |
| Tablet | 768–1023px | Sidebar collapses to bottom bar |
| Tablet LG | 1024–1199px | Sidebar returns |
| Desktop | 1200–1599px | Full layout |
| Desktop XL | 1600px+ | Max content width |

---

<h2 id="changelog"><img src="https://api.iconify.design/lucide:tag.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;Changelog</h2>

**v1.1**
- **Unified navigation** — one shared `Sidebar` component; every page renders an identical nav bar and a correct mobile bottom bar.
- **Restored landing screen** — re-added the missing intro styles (video hero, glass sound toggle, Sign In / Sign Up), fully responsive.
- **Search backdrop** — the coverflow's blurred background tracks the focused result with a smooth crossfade over a neutral dark base; tightened vertical spacing.
- **Cleaner pipeline** — global styles imported once from `main.jsx`; changelog-style comments removed; ESLint made JSX-aware.

---

<h2 id="attribution"><img src="https://api.iconify.design/lucide:badge-check.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;Attribution</h2>

This product uses the **TMDB API** but is **not endorsed or certified by TMDB**. Movie and TV data provided by [The Movie Database](https://www.themoviedb.org/).

---

<h2 id="author"><img src="https://api.iconify.design/lucide:user.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;Author</h2>

**Nikan Eidi** — full-stack developer specializing in AI/ML-powered web applications.

<p>
  <a href="https://nikanportfolio.onrender.com"><img src="https://img.shields.io/badge/Portfolio-20232A?style=for-the-badge&logo=googlechrome&logoColor=8B5CF6" /></a>
  <a href="https://github.com/NikanEidi"><img src="https://img.shields.io/badge/GitHub-20232A?style=for-the-badge&logo=github&logoColor=white" /></a>
</p>

---

<h2 id="license"><img src="https://api.iconify.design/lucide:scale.svg?color=%238b5cf6&width=24" width="24" /> &nbsp;License</h2>

Released under the **MIT License** — see [LICENSE](LICENSE) for details.

<div align="center">
<br/>
<a href="#cinevision"><img src="https://api.iconify.design/lucide:arrow-up.svg?color=%238b5cf6&width=18" width="18" /> Back to top</a>
</div>
