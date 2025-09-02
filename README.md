# 🎬 CineVision

CineVision is a full-stack **Movie & TV Show Tracker** with integrated **AI-powered recommendations**.  
It helps users **discover, organize, and track** their watchlists while providing smart suggestions powered by **Machine Learning**.

---

## 🚀 Features

### 🔑 Core Functionality

- **Authentication & User Accounts** via Supabase.
- **Watchlist Management** — Add, remove, and track your favorite movies and TV shows.
- **Personalized Dashboard** with Popular Movies, Popular Shows, Your Watchlist, and AI Recommendations.

### 🤖 AI Recommendation System

- Built with **Python + Flask** backend.
- Uses **TF-IDF vectorization** and **cosine similarity** for content-based filtering.
- Learns from each user’s **watchlist** and suggests **highly relevant titles**.
- Dynamically fetches genres, ratings, cast, and posters from **TMDB API**.
- Artifacts (`catalog`, `tfidf_matrix`, `vectorizer`) are generated automatically at runtime.

### 🎨 Modern Frontend

- Built with **React (Vite)** and fully responsive.
- **Glassmorphism UI** with smooth animations.
- Sections:  
  - **Dashboard** → Popular Movies, Popular Shows, Watchlist, AI Recommendations  
  - **Detail View** → Ratings, genres, overview, streaming provider icons, and trailer support  
  - **Search** → Interactive search with filters  
  - **Recommendation Page** → Grouped by genre, rating, or type  

### 🛠️ Backend

- **Flask API** hosted separately (`/recommend`, `/healthz`, `/rebuild`).  
- Fully container-ready, deployable on **Render, Railway, or Docker**.  
- TMDB API integrated for up-to-date metadata.  


## ⚙️ Tech Stack

**Frontend**

- React (Vite)  
- Supabase (Auth + Database)  
- TMDB API for metadata  

**Backend**

- Python (Flask)  
- Scikit-Learn (TF-IDF Vectorizer, Cosine Similarity)  
- Pandas / NumPy for data processing  

**Deployment**

- **Render** (Backend Flask API)  
- **Render** (Frontend static build)  

---

## 📊 AI Recommendation Workflow

1. User adds movies/shows to Watchlist.  
2. Flask backend receives `{ media_type, media_id }`.  
3. Recommender builds a **vectorized profile** of user interests:
   - Genres  
   - Overview/description  
   - Keywords & cast  
   - Ratings (weighted)  
4. Cosine similarity finds top matches across the TMDB dataset.  
5. Frontend displays **ranked recommendations** with posters, ratings, and genres.

---

## 🌍 Live Demo

🔗 **Frontend**: [https://cinevision-frontend.onrender.com](#)  
🔗 **Backend API**: [https://cinevision.onrender.com](https://cinevision.onrender.com)  

---

## 📝 Attribution

This product uses the **TMDB API** but is **not endorsed or certified** by TMDB.  
Logos and trademarks are the property of their respective owners.

---

## 👨‍💻 Author

**Nikan Eidi**  

- Full-stack developer with strong focus on **AI & ML applications in web products**.  
- Portfolio: (https://nikanportfolio.onrender.com)
