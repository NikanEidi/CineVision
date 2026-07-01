# 🎬 CineVision

<div align="center">

![CineVision Banner](https://img.shields.io/badge/CineVision-Movie%20%26%20TV%20Tracker-5F099E?style=for-the-badge&logo=filmstack&logoColor=white)

**A full-stack Movie & TV Show Tracker with AI-powered recommendations and a stunning Liquid Glass UI.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask)](https://flask.palletsprojects.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![TMDB](https://img.shields.io/badge/TMDB-API-01D277?style=flat-square&logo=themoviedatabase)](https://www.themoviedb.org/)

</div>

---

## ✨ Features

### 🔐 Authentication & User Management
- Secure sign-up/sign-in with **Supabase Auth**
- **Sign in as Guest** (anonymous auth) — try the app with no account
- Password reset flow with email verification
- Persistent user sessions

### 📚 Watchlist Management
- Add, remove, and organize movies & TV shows
- Track watched status for movies
- **Episode-level progress tracking** for TV series
- View by genre, rating, or media type

### 🤖 AI-Powered Recommendations
- **Content-based filtering** using TF-IDF vectorization
- Cosine similarity matching across 10,000+ titles
- Learns from your watchlist preferences
- Real-time updates when you add new content

### 🎨 Modern UI/UX Design
- **Liquid Glass (Glassmorphism)** design system
- Smooth animations and micro-interactions
- Fully responsive (mobile → desktop)
- Dark theme with purple/cyan accents
- Coverflow search with drag, scroll, and keyboard navigation

---

## 🖼️ Screenshots

| Dashboard | Detail Page | Search |
|-----------|-------------|--------|
| Bento grid layout with popular movies, shows, watchlist, and AI recommendations | Dynamic backgrounds, ratings, cast, trailers, and streaming providers | Coverflow navigation with real-time filtering |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **React Router** | Client-side routing |
| **Framer Motion** | Animations |
| **Supabase JS** | Auth & database client |
| **Axios** | HTTP requests |

### Backend
| Technology | Purpose |
|------------|---------|
| **Python 3.11+** | Runtime |
| **Flask** | REST API framework |
| **Scikit-learn** | TF-IDF & cosine similarity |
| **Pandas/NumPy** | Data processing |
| **TMDB API** | Movie/TV metadata |

### Design System
| Feature | Implementation |
|---------|----------------|
| **Glassmorphism** | `backdrop-filter: blur()` with rgba backgrounds |
| **Color Palette** | Primary: `#5F099E`, Accent: `#00E5FF` |
| **Typography** | Orbitron, Outfit, Oxanium, Inter |
| **Responsive** | Mobile-first with 7 breakpoints |

---

## 📁 Project Structure

```
CineVision/
├── frontend/
│   ├── public/              # Static assets (videos, images, SVGs)
│   ├── src/
│   │   ├── styles/          # Modular CSS system
│   │   │   ├── design-system.css   # Variables, utilities, animations
│   │   │   ├── components.css      # Reusable component styles
│   │   │   ├── layouts.css         # Page layout structures
│   │   │   ├── search.css          # Search page specific
│   │   │   ├── responsive.css      # All breakpoints
│   │   │   └── index.css           # Main entry point
│   │   ├── App.jsx          # Router & main app
│   │   ├── DashBoard.jsx    # Home page
│   │   ├── Movies.jsx       # Movies browse
│   │   ├── Shows.jsx        # TV shows browse
│   │   ├── Search.jsx       # Coverflow search
│   │   ├── Detail.jsx       # Movie/show detail
│   │   ├── Watchlist.jsx    # User watchlist
│   │   ├── Recommendation.jsx # AI recommendations
│   │   ├── Login.jsx        # Sign in
│   │   ├── Signup.jsx       # Register
│   │   └── supabaseClient.js # Supabase config
│   ├── .env.example         # Environment template
│   └── package.json
│
├── backend/
│   ├── app.py               # Flask API
│   ├── recommender.py       # ML recommendation engine
│   ├── requirements.txt     # Python dependencies
│   └── artifacts/           # Generated ML models (gitignored)
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.11+
- **Supabase** account (free tier works)
- **TMDB API** key (free at themoviedb.org)

### 1. Clone the Repository
```bash
git clone https://github.com/NikanEidi/CineVision.git
cd CineVision
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_API_BASE=http://127.0.0.1:5178
```

Start the dev server:
```bash
npm run dev
```

> To use the **Sign in as Guest** button, enable **Anonymous sign-ins** in your Supabase project under Authentication → Providers.

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file:
```env
TMDB_API_KEY=your_tmdb_api_key
```

Start the Flask server:
```bash
python app.py
```

### 4. Open the App
Navigate to `http://localhost:5173` 🎉

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/healthz` | Health check |
| `POST` | `/recommend` | Get AI recommendations |
| `POST` | `/rebuild` | Rebuild ML artifacts |

### `/recommend` Request
```json
{
  "watchlist": [
    { "media_type": "movie", "media_id": 550 },
    { "media_type": "tv", "media_id": 1399 }
  ],
  "limit": 20
}
```

---

## 🎨 Design System

The CSS follows a modular architecture:

```css
/* Import order in index.css */
@import './design-system.css';  /* Tokens & utilities */
@import './components.css';     /* Reusable components */
@import './layouts.css';        /* Page structures */
@import './search.css';         /* Search-specific */
@import './responsive.css';     /* Breakpoints (LAST) */
```

### Key CSS Variables
```css
:root {
  /* Glass Effects */
  --glass-bg-medium: rgba(255, 255, 255, 0.06);
  --blur-md: blur(16px);
  
  /* Colors */
  --color-primary: #5F099E;
  --color-accent-cyan: #00E5FF;
  
  /* Typography */
  --font-display: 'Orbitron', sans-serif;
  --font-heading: 'Outfit', sans-serif;
}
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile SM | < 480px | Single column, hidden nav text |
| Mobile | 480-599px | Compact cards |
| Mobile LG | 600-767px | Stacked actions |
| Tablet | 768-1023px | Bottom nav bar |
| Tablet LG | 1024-1199px | Side nav returns |
| Desktop | 1200-1599px | Full layout |
| Desktop XL | 1600px+ | Maximum content width |

---

## 📝 Attribution

This product uses the **TMDB API** but is **not endorsed or certified by TMDB**.  
Movie and TV data provided by [The Movie Database](https://www.themoviedb.org/).

---

## 👨‍💻 Author

**Nikan Eidi**

Full-stack developer specializing in AI/ML-powered web applications.

- 🌐 [Portfolio](https://nikanportfolio.onrender.com)
- 💼 [GitHub](https://github.com/NikanEidi)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ and lots of ☕

**[⬆ Back to Top](#-cinevision)**

</div>
