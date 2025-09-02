// DashBoard.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabaseClient';
import './App.css';
import {FaHome, FaFilm, FaTv, FaBookmark, FaSearch, FaStar, FaLightbulb} from 'react-icons/fa';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const FALLBACK_POSTER = '/no-image.png';

const API_BASE =
    (import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.replace(/\/+$/, '')) ||
    (window.__API_BASE__ && String(window.__API_BASE__).replace(/\/+$/, '')) ||
    'http://127.0.0.1:5178';

const tmdbPoster = (path, size = 'w500') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : FALLBACK_POSTER;

export default function DashBoard() {
    const navigate = useNavigate();
    const videoRef = useRef(null);

    const [popularMovies, setPopularMovies] = useState([]);
    const [popularShows, setPopularShows] = useState([]);
    const [watchlist, setWatchlist] = useState([]);
    const [aiRecommendations, setAiRecommendations] = useState([]);

    useEffect(() => {
        if (videoRef.current) videoRef.current.play().catch(() => {});
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const [moviesRes, showsRes, watchlistRes] = await Promise.all([
                    axios.get('https://api.themoviedb.org/3/movie/popular', { params: { api_key: API_KEY } }),
                    axios.get('https://api.themoviedb.org/3/tv/popular', { params: { api_key: API_KEY } }),
                    supabase.from('watchlist').select('*').eq('user_id', user.id)
                ]);

                setPopularMovies(moviesRes.data?.results?.slice(0, 20) ?? []);
                setPopularShows(showsRes.data?.results?.slice(0, 20) ?? []);
                setWatchlist(watchlistRes.data || []);
                fetchAIRecommendations(watchlistRes.data || []);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (watchlist.length > 0) fetchAIRecommendations(watchlist);
    }, [watchlist]);

    const fetchAIRecommendations = useCallback(async (watchlistData) => {
        const formatted = (watchlistData || [])
            .filter((item) => item.media_type && (item.media_id ?? item.id))
            .map((item) => ({
                media_type: String(item.media_type).toLowerCase(),
                media_id: Number(item.media_id ?? item.id)
            }));

        if (formatted.length === 0) return;

        try {
            const res = await fetch(`${API_BASE}/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    watchlist: formatted,
                    limit: 20
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Failed to fetch recommendations: ${errText}`);
            }

            const data = await res.json();
            setAiRecommendations(data.results || []);
        } catch (err) {
            console.error('AI recommendation error:', err);
        }
    }, []);

    const renderRowSection = (title, items, typeHint, hasViewMore = true) => (
        <section className="movies-section">
            <div className="movies-section-header">
                <div className="section-title">
                    <h3>{title}</h3>
                </div>
                {hasViewMore && (
                    <button
                        className="view-all"
                        onClick={() => {
                            if (typeHint === 'movie') navigate('/movies');
                            else if (typeHint === 'tv') navigate('/shows');
                            else if (typeHint === 'recommendation') navigate('/recommendation');
                            else if (typeHint === 'mixed') navigate('/watchlist');
                        }}
                    >
                        View More
                    </button>
                )}
            </div>

            <div className="movies-scroll-container">
                <div className="movies-scroll-row">
                    {(items || []).map((it, idx) => {
                        const isMovie = typeHint === 'movie' || !!it.title || (!it.name && it.media_type !== 'tv');
                        const title = it.title || it.name || 'Untitled';
                        const id = (it.media_id ?? it.id)?.toString();
                        const poster = it.poster_path ? tmdbPoster(it.poster_path) : it.poster_url || FALLBACK_POSTER;
                        const rating =
                            typeof it.vote_average === 'number'
                                ? it.vote_average.toFixed(1)
                                : typeof it.score === 'number'
                                    ? it.score.toFixed(2)
                                    : '—';
                        const mediaType = it.media_type || (isMovie ? 'movie' : 'tv');

                        return (
                            <div
                                key={`${mediaType}-${id}-${idx}`}
                                className="movies-card"
                                onClick={() => id && navigate(`/detail/${mediaType}/${id}`)}
                            >
                                <div className="movies-card-image" style={{ position: 'relative' }}>
                                    <img
                                        src={poster}
                                        alt={title}
                                        onError={(e) => {
                                            e.currentTarget.src = FALLBACK_POSTER;
                                        }}
                                        loading="lazy"
                                    />
                                    <span className="movies-rating" style={{ position: 'absolute', top: 10, left: 10 }}>
                    <FaStar /> {rating}
                  </span>
                                </div>
                                <div className="movies-card-info">
                                    <h4>{title}</h4>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );

    return (
        <div className="auth-bg">
            <video
                ref={videoRef}
                className="auth-video"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster="/dashboard.jpg"
            >
                <source src="/DashBoard.mp4" type="video/mp4" />
            </video>
            <div className="auth-overlay" />

            <div className="dashboard-container auth-content">
                <aside className="sidebar">
                    <div className="logo">
                        <span className="logo-text">CineVision</span>
                    </div>
                    <ul className="menu">
                        <li className="active"><FaHome /> Home</li>
                        <li onClick={() => navigate('/movies')}><FaFilm /> Movies</li>
                        <li onClick={() => navigate('/shows')}><FaTv /> Shows</li>
                        <li onClick={() => navigate('/search')}><FaSearch /> Search</li>
                        <li onClick={() => navigate('/recommendation')}><FaLightbulb /> Recommend</li>
                        <li onClick={() => navigate('/watchlist')}><FaBookmark /> Watchlist</li>
                    </ul>
                </aside>

                <main className="movies-main">
                    <div className="movies-content">
                        <header className="movies-header">
                            <h1>Welcome back</h1>
                            <p>Jump into trending movies, shows, and your picks</p>
                        </header>

                        {renderRowSection('Popular Movies', popularMovies, 'movie')}
                        {renderRowSection('Popular Shows', popularShows, 'tv')}
                        {renderRowSection('Recommendations', aiRecommendations, 'recommendation', true)}
                        {renderRowSection('Your Watchlist', watchlist, 'mixed')}
                    </div>
                </main>
            </div>
        </div>
    );
}
