// Recommendation.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { FaHome, FaFilm, FaTv, FaBookmark, FaStar, FaSearch, FaLightbulb } from 'react-icons/fa';
import './App.css';

const FALLBACK_POSTER = '/no-image.png';

const API_BASE =
    (import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.replace(/\/+$/, '')) ||
    (window.__API_BASE__ && String(window.__API_BASE__).replace(/\/+$/, '')) ||
    'http://127.0.0.1:5178';

const Recommendation = () => {
    const navigate = useNavigate();

    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [viewMode, setViewMode] = useState('genre');
    const [genreFilter, setGenreFilter] = useState('All');
    const [ratingOrder, setRatingOrder] = useState('desc');

    const videoRef = useRef(null);
    useEffect(() => {
        videoRef.current?.play?.().catch(() => {});
    }, []);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                setLoading(true);
                setError('');

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setRecs([]);
                    setLoading(false);
                    return;
                }

                const { data: wlData, error: wlErr } = await supabase
                    .from('watchlist')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (wlErr) throw wlErr;

                const formatted = (wlData || [])
                    .filter((it) => {
                        const mt = (it.media_type || (it.name ? 'tv' : 'movie'))?.toString().toLowerCase();
                        const id = Number(it.media_id ?? it.id);
                        return (mt === 'movie' || mt === 'tv') && Number.isFinite(id);
                    })
                    .map((it) => ({
                        media_type: (it.media_type || (it.name ? 'tv' : 'movie')).toString().toLowerCase(),
                        media_id: Number(it.media_id ?? it.id),
                    }));

                if (formatted.length === 0) {
                    setRecs([]);
                    setLoading(false);
                    return;
                }

                const res = await fetch(`${API_BASE}/recommend`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ watchlist: formatted, limit: 40 })
                });

                const raw = await res.text();
                if (!res.ok) {
                    throw new Error(raw || 'HTTP error');
                }

                const payload = raw ? JSON.parse(raw) : {};
                const results = Array.isArray(payload?.results) ? payload.results : [];

                const cleaned = results.map((r) => ({
                    ...r,
                    media_type: (r.media_type || (r.name ? 'tv' : 'movie'))?.toString().toLowerCase(),
                    media_id: Number(r.media_id ?? r.id ?? r.tmdb_id ?? r.recommendation_id),
                }));

                setRecs(cleaned.filter((r) => r.media_type && Number.isFinite(r.media_id)));
            } catch (e) {
                console.error('Recommendation error:', e);
                setError('Failed to load recommendations. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    const posterUrl = (path) =>
        path ? `https://image.tmdb.org/t/p/w500${path}` : FALLBACK_POSTER;

    const ratingOf = (item) =>
        typeof item?.vote_average === 'number' ? item.vote_average : null;

    const parseGenres = (item) => {
        const raw = item?.genres;
        if (!raw) return [];
        if (typeof raw === 'string') {
            return raw.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (Array.isArray(raw)) {
            return raw.map(x => (typeof x === 'string' ? x : (x?.name || String(x))))
                .map(s => String(s).trim())
                .filter(Boolean);
        }
        return [];
    };

    const { uniqueGenres, groupedByPrimary } = useMemo(() => {
        const groups = {};
        const set = new Set();
        for (const it of recs) {
            const genres = parseGenres(it);
            const primary = genres[0] || 'Uncategorized';
            set.add(primary);
            if (!groups[primary]) groups[primary] = [];
            groups[primary].push(it);
        }
        const list = Array.from(set).sort((a, b) => a.localeCompare(b));
        return { uniqueGenres: list, groupedByPrimary: groups };
    }, [recs]);

    const ratingSorted = useMemo(() => {
        const arr = [...recs];
        arr.sort((a, b) => {
            const ra = ratingOf(a) ?? -Infinity;
            const rb = ratingOf(b) ?? -Infinity;
            return ratingOrder === 'desc' ? rb - ra : ra - rb;
        });
        return arr;
    }, [recs, ratingOrder]);

    const { moviesOnly, showsOnly } = useMemo(() => {
        const movies = [];
        const shows = [];
        for (const it of recs) {
            const type = it.media_type || (it.name ? 'tv' : 'movie');
            if (type === 'movie') movies.push(it);
            else shows.push(it);
        }
        return { moviesOnly: movies, showsOnly: shows };
    }, [recs]);

    const renderRowSection = (title, items) => (
        <section className="movies-section">
            <div className="movies-section-header">
                <div className="section-title">
                    <h3>{title}</h3>
                </div>
            </div>
            <div className="movies-scroll-container">
                <div className="movies-scroll-row">
                    {(items || []).map((item, idx) => {
                        const title = item.title || item.name || 'Untitled';
                        const poster = posterUrl(item.poster_path || item.poster_url);
                        const rating =
                            typeof item.vote_average === 'number'
                                ? item.vote_average.toFixed(1)
                                : typeof item.similarity === 'number'
                                    ? item.similarity.toFixed(2)
                                    : '—';
                        const mediaId = item.media_id ?? item.id;
                        const mediaType = item.media_type || (item.name ? 'tv' : 'movie');
                        const toDetail = mediaType && Number.isFinite(mediaId)
                            ? `/detail/${mediaType}/${mediaId}`
                            : null;

                        return (
                            <div
                                key={`${mediaType}-${mediaId}-${idx}`}
                                className="movies-card"
                                onClick={() => toDetail && navigate(toDetail)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => (e.key === 'Enter' && toDetail ? navigate(toDetail) : null)}
                            >
                                <div className="movies-card-image" style={{ position: 'relative' }}>
                                    <img
                                        src={poster}
                                        alt={title}
                                        onError={(e) => { e.currentTarget.src = FALLBACK_POSTER; }}
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
                poster="/movies.jpg"
            >
                <source src="/recommendation.mp4" type="video/mp4" />
            </video>
            <div className="auth-overlay" />
            <div className="dashboard-container auth-content">
                <aside className="sidebar">
                    <div className="logo">
                        <span className="logo-text">CineVision</span>
                    </div>
                    <ul className="menu">
                        <li onClick={() => navigate('/dashboard')}>
                            <FaHome className="menu-icon" /> <span className="menu-text">Home</span>
                        </li>
                        <li onClick={() => navigate('/movies')}>
                            <FaFilm className="menu-icon" /> <span className="menu-text">Movies</span>
                        </li>
                        <li onClick={() => navigate('/shows')}>
                            <FaTv className="menu-icon" /> <span className="menu-text">Shows</span>
                        </li>
                        <li onClick={() => navigate('/search')}>
                            <FaSearch className="menu-icon" /> <span className="menu-text">Search</span>
                        </li>
                        <li className="active" onClick={() => navigate('/recommendation')}>
                            <FaLightbulb className="menu-icon" /> <span className="menu-text">Recommendation</span>
                        </li>
                        <li onClick={() => navigate('/watchlist')}>
                            <FaBookmark className="menu-icon" /> <span className="menu-text">Watchlist</span>
                        </li>
                    </ul>
                </aside>

                <main className="movies-main">
                    <div className="movies-content">
                        <header className="movies-header">
                            <h1>Recommendations</h1>
                            <p>Personalized picks based on your watchlist</p>
                        </header>

                        {loading && (
                            <div className="loading-state">
                                <div className="spinner" aria-label="Loading" />
                            </div>
                        )}

                        {error && !loading && (
                            <div className="error-message" role="alert">
                                <h2>Oops</h2>
                                <p>{error}</p>
                            </div>
                        )}

                        {!loading && !error && recs.length === 0 && (
                            <section className="movies-section">
                                <div className="movies-section-header">
                                    <h3>Suggested Titles</h3>
                                </div>
                                <div className="cvsearch__empty">
                                    No recommendations yet. Add a few favorites to your <strong>Watchlist</strong> and check back!
                                </div>
                            </section>
                        )}

                        {!loading && !error && recs.length > 0 && (
                            <section className="movies-section">
                                <div className="movies-section-header">
                                    <div className="section-title">
                                        <h3>View Options</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <label className="genre-pill" style={{ cursor: 'pointer' }}>
                                            <select
                                                value={viewMode}
                                                onChange={(e) => setViewMode(e.target.value)}
                                                aria-label="View mode"
                                                style={{ background: 'transparent', border: 'none', color: 'inherit' }}
                                            >
                                                <option value="genre">By Genre</option>
                                                <option value="rating">By Rating</option>
                                                <option value="type">By Type (Movie/TV)</option>
                                            </select>
                                        </label>

                                        {viewMode === 'genre' && (
                                            <label className="genre-pill" style={{ cursor: 'pointer' }}>
                                                <select
                                                    value={genreFilter}
                                                    onChange={(e) => setGenreFilter(e.target.value)}
                                                    aria-label="Genre filter"
                                                    style={{ background: 'transparent', border: 'none', color: 'inherit' }}
                                                >
                                                    <option value="All">All Genres</option>
                                                    {uniqueGenres.map((g) => (
                                                        <option key={g} value={g}>
                                                            {g}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        )}

                                        {viewMode === 'rating' && (
                                            <label className="genre-pill" style={{ cursor: 'pointer' }}>
                                                <select
                                                    value={ratingOrder}
                                                    onChange={(e) => setRatingOrder(e.target.value)}
                                                    aria-label="Rating order"
                                                    style={{ background: 'transparent', border: 'none', color: 'inherit' }}
                                                >
                                                    <option value="desc">Highest First</option>
                                                    <option value="asc">Lowest First</option>
                                                </select>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {!loading && !error && recs.length > 0 && viewMode === 'genre' && (
                            <>
                                {(genreFilter === 'All' ? uniqueGenres : [genreFilter]).map((genre) =>
                                    groupedByPrimary[genre] && groupedByPrimary[genre].length > 0
                                        ? renderRowSection(genre, groupedByPrimary[genre])
                                        : null
                                )}
                            </>
                        )}

                        {!loading && !error && recs.length > 0 && viewMode === 'rating' && (
                            <>
                                {renderRowSection(
                                    ratingOrder === 'desc' ? 'Top Rated' : 'Low Rated',
                                    ratingSorted
                                )}
                            </>
                        )}

                        {!loading && !error && recs.length > 0 && viewMode === 'type' && (
                            <>
                                {renderRowSection('Movies', moviesOnly)}
                                {renderRowSection('Shows', showsOnly)}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Recommendation;