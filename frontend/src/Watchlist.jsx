// Watchlist.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { FaHome, FaFilm, FaTv, FaBookmark, FaStar, FaSearch, FaLightbulb } from 'react-icons/fa'; // added FaLightbulb for Recommendation
import './App.css';

const FALLBACK_POSTER = '/no-image.png'; // keep in /public

const Watchlist = () => {
    const navigate = useNavigate();

    // Data state
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');

    // UI state
    // viewMode: 'genre' | 'rating' | 'type'
    const [viewMode, setViewMode]         = useState('genre');
    const [genreFilter, setGenreFilter]   = useState('All');   // filter for genre view
    const [ratingOrder, setRatingOrder]   = useState('desc');  // 'desc' | 'asc'

    // Try autoplay on mobile
    const videoRef = useRef(null);
    useEffect(() => {
        videoRef.current?.play?.().catch(() => {});
    }, []);

    // Load watchlist once
    useEffect(() => {
        const fetchWatchlist = async () => {
            try {
                setLoading(true);
                setError('');

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setWatchlist([]);
                    setLoading(false);
                    return;
                }

                const { data, error: wlError } = await supabase
                    .from('watchlist')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (wlError) throw wlError;
                setWatchlist(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error('Error fetching watchlist:', e);
                setError('Failed to load your watchlist. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchWatchlist();
    }, []);

    // Helpers
    const posterUrl = (path) =>
        path ? `https://image.tmdb.org/t/p/w500${path}` : FALLBACK_POSTER;

    const ratingOf = (item) =>
        typeof item?.vote_average === 'number' ? item.vote_average : null;

    const parseGenres = (item) => {
        // We saved `genres` as "Action, Drama, ..."
        const raw = item?.genres || '';
        if (!raw || typeof raw !== 'string') return [];
        return raw.split(',').map((s) => s.trim()).filter(Boolean);
    };

    // Unique genres + group items by their first genre
    const { uniqueGenres, groupedByPrimary } = useMemo(() => {
        const groups = {};
        const set = new Set();

        for (const it of watchlist) {
            const genres = parseGenres(it);
            const primary = genres[0] || 'Uncategorized';
            set.add(primary);
            if (!groups[primary]) groups[primary] = [];
            groups[primary].push(it);
        }
        const list = Array.from(set).sort((a, b) => a.localeCompare(b));
        return { uniqueGenres: list, groupedByPrimary: groups };
    }, [watchlist]);

    // Sorted list by rating (desc/asc)
    const ratingSorted = useMemo(() => {
        const arr = [...watchlist];
        arr.sort((a, b) => {
            const ra = ratingOf(a) ?? -Infinity;
            const rb = ratingOf(b) ?? -Infinity;
            return ratingOrder === 'desc' ? rb - ra : ra - rb;
        });
        return arr;
    }, [watchlist, ratingOrder]);

    // Split into movies vs shows
    const { moviesOnly, showsOnly } = useMemo(() => {
        const movies = [];
        const shows  = [];
        for (const it of watchlist) {
            const type = it.media_type || (it.name ? 'tv' : 'movie');
            if (type === 'movie') movies.push(it);
            else shows.push(it);
        }
        return { moviesOnly: movies, showsOnly: shows };
    }, [watchlist]);

    // Single scroll row section (re-uses Movies page styles)
    const renderRowSection = (title, items) => (
        <section className="movies-section">
            <div className="movies-section-header">
                <div className="section-title">
                    <h3>{title}</h3>
                </div>
            </div>

            <div className="movies-scroll-container">
                <div className="movies-scroll-row">
                    {(items || []).map((item) => {
                        const title     = item.title || item.name || 'Untitled';
                        const poster    = posterUrl(item.poster_path);
                        const rating    = typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : '—';
                        const mediaId   = item.media_id ?? item.id;
                        const mediaType = item.media_type || (item.name ? 'tv' : 'movie');

                        return (
                            <div
                                key={`${item.id}-${mediaType}-${mediaId}`}
                                className="movies-card"
                                onClick={() => navigate(`/detail/${mediaType}/${mediaId}`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' ? navigate(`/detail/${mediaType}/${mediaId}`) : null}
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
            {/* Background video */}
            <video
                ref={videoRef}
                className="auth-video"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster="/watchlist.jpg"
            >
                <source src="/WatchList.mp4" type="video/mp4" />
            </video>

            {/* Dark overlay for readability */}
            <div className="auth-overlay" />

            {/* Foreground content */}
            <div className="dashboard-container auth-content">
                {/* Sidebar */}
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

                        {/* New: Recommendation entry in sidebar */}
                        {/* Keeps same structure; routes to your recommendation page */}
                        <li onClick={() => navigate('/recommendation')}>
                            <FaLightbulb className="menu-icon" /> <span className="menu-text">Recommendation</span>
                        </li>

                        <li className="active">
                            <FaBookmark className="menu-icon" /> <span className="menu-text">Watchlist</span>
                        </li>
                    </ul>
                </aside>

                {/* Main Content */}
                <main className="movies-main">
                    <div className="movies-content">
                        <header className="movies-header">
                            <h1>Your Watchlist</h1>
                            <p>Movies and shows you've saved</p>
                        </header>

                        {/* Loading / Error / Empty states */}
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

                        {!loading && !error && watchlist.length === 0 && (
                            <section className="movies-section">
                                <div className="movies-section-header">
                                    <h3>Saved Titles</h3>
                                </div>
                                <div className="cvsearch__empty">
                                    Your watchlist is empty. Browse <strong>Movies</strong> or <strong>Shows</strong> and add some favorites!
                                </div>
                            </section>
                        )}

                        {/* Controls */}
                        {!loading && !error && watchlist.length > 0 && (
                            <section className="movies-section">
                                <div className="movies-section-header">
                                    <div className="section-title">
                                        <h3>View Options</h3>
                                    </div>

                                    {/* Simple select controls; no class renaming */}
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
                                                        <option key={g} value={g}>{g}</option>
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

                        {/* Genre frames */}
                        {!loading && !error && watchlist.length > 0 && viewMode === 'genre' && (
                            <>
                                {(genreFilter === 'All' ? uniqueGenres : [genreFilter]).map((genre) =>
                                    groupedByPrimary[genre] && groupedByPrimary[genre].length > 0
                                        ? renderRowSection(genre, groupedByPrimary[genre])
                                        : null
                                )}
                            </>
                        )}

                        {/* Rating frame */}
                        {!loading && !error && watchlist.length > 0 && viewMode === 'rating' && (
                            <>
                                {renderRowSection(
                                    ratingOrder === 'desc' ? 'Top Rated' : 'Low Rated',
                                    ratingSorted
                                )}
                            </>
                        )}

                        {/* Type frame */}
                        {!loading && !error && watchlist.length > 0 && viewMode === 'type' && (
                            <>
                                {renderRowSection('Movies', moviesOnly)}
                                {renderRowSection('Shows',  showsOnly)}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Watchlist;