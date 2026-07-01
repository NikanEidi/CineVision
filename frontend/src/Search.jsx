// src/Search.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaTimes, FaArrowLeft, FaStar, FaHeart,
    FaHome, FaFilm, FaTv, FaBookmark, FaLightbulb,
} from 'react-icons/fa';
import './styles/index.css';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const FALLBACK_POSTER =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM4ODgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuMzVlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

const tmdbImg = (p, size = 'w500') =>
    p ? `https://image.tmdb.org/t/p/${size}${p}` : FALLBACK_POSTER;

// Simple debounce to limit API calls while typing
function useDebounce(value, delay = 400) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function Search() {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const initialQ = params.get('q') || '';

    const [q, setQ] = useState(initialQ);
    const debouncedQ = useDebounce(q, 450);

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [favorites, setFavorites] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch search results
    const fetchSearch = useCallback(
        async (query, pageNum = 1, merge = false) => {
            if (!API_KEY) {
                setError('TMDB API Key not found.');
                return;
            }
            if (!query?.trim()) {
                // Clear everything if query is empty
                setResults([]);
                setError('');
                setPage(1);
                setTotalPages(1);
                return;
            }
            setLoading(true);
            setError('');
            try {
                const { data } = await axios.get('https://api.themoviedb.org/3/search/multi', {
                    params: {
                        api_key: API_KEY,
                        query,
                        include_adult: false,
                        language: 'en-US',
                        page: pageNum,
                    },
                });
                const filtered = (data?.results || [])
                    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
                    .map((r) => ({
                        id: r.id,
                        media_type: r.media_type,
                        title: r.title || r.name || 'Untitled',
                        poster_path: r.poster_path,
                        vote_average: r.vote_average || 0,
                        date: r.release_date || r.first_air_date || '',
                    }));
                setTotalPages(data?.total_pages || 1);
                setPage(pageNum);
                setResults((prev) => (merge ? [...prev, ...filtered] : filtered));
            } catch {
                setError('Failed to fetch results.');
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Sync URL and search
    useEffect(() => {
        setParams(debouncedQ?.trim() ? { q: debouncedQ.trim() } : {});
        fetchSearch(debouncedQ, 1, false);
    }, [debouncedQ, fetchSearch, setParams]);

    // Escape clears the search
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setQ('');
                setResults([]);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const toDetail = (item) => {
        const type = item.media_type === 'movie' ? 'movie' : 'tv';
        navigate(`/detail/${type}/${item.id}`);
    };
    const toggleFavorite = (item) => {
        const key = `${item.media_type}-${item.id}`;
        setFavorites((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
    };

    return (
        <motion.div className="cvsearch" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Header with Back → Dashboard, Navigation Buttons, and Search */}
            <header className="cvsearch__header">
                <motion.button
                    className="cvsearch__back"
                    onClick={() => navigate('/dashboard')}
                    aria-label="Back to Dashboard"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.92 }}
                >
                    <FaArrowLeft /> Dashboard
                </motion.button>

                {/* Navigation Buttons Group */}
                <nav className="cvsearch__nav-group" aria-label="Main navigation">
                    <button
                        className="cvsearch__nav-btn"
                        onClick={() => navigate('/dashboard')}
                        aria-label="Go to Home"
                    >
                        <FaHome /> <span>Home</span>
                    </button>
                    <button
                        className="cvsearch__nav-btn"
                        onClick={() => navigate('/movies')}
                        aria-label="Browse Movies"
                    >
                        <FaFilm /> <span>Movies</span>
                    </button>
                    <button
                        className="cvsearch__nav-btn"
                        onClick={() => navigate('/shows')}
                        aria-label="Browse TV Shows"
                    >
                        <FaTv /> <span>Shows</span>
                    </button>
                    <button
                        className="cvsearch__nav-btn"
                        onClick={() => navigate('/recommendation')}
                        aria-label="Get Recommendations"
                    >
                        <FaLightbulb /> <span>Recommend</span>
                    </button>
                    <button
                        className="cvsearch__nav-btn"
                        onClick={() => navigate('/watchlist')}
                        aria-label="View Watchlist"
                    >
                        <FaBookmark /> <span>Watchlist</span>
                    </button>
                </nav>

                <form
                    className="cvsearch__form"
                    onSubmit={(e) => { e.preventDefault(); fetchSearch(q.trim(), 1, false); }}
                    autoComplete="off"
                    spellCheck={false}
                >
                    <FaSearch className="cvsearch__icon" />
                    <input
                        id="cvsearch-input"
                        className="cvsearch__input"
                        placeholder="Search movies & TV…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    {q && (
                        <motion.button
                            type="button"
                            className="cvsearch__clear"
                            onClick={() => { setQ(''); setResults([]); }}
                            aria-label="Clear"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <FaTimes />
                        </motion.button>
                    )}
                </form>
            </header>

            {/* Empty / error states */}
            <AnimatePresence>
                {!loading && !results.length && !error && (
                    <motion.div
                        className="cvsearch__empty"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.5, type: 'spring' }}
                    >
                        <p>
                            Type to search TMDB. Try: <code>Inception</code>, <code>Breaking Bad</code>, <code>Spider-Man</code>
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
            {error && (
                <motion.div className="cvsearch__error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {error}
                </motion.div>
            )}

            {/* Scrollable results grid (same card pattern used across the app) */}
            {results.length > 0 && (
                <section className="movies-section cvsearch__results">
                    <div className="movies-scroll-container">
                        <div className="movies-scroll-row">
                            {results.map((item) => {
                                const key = `${item.media_type}-${item.id}`;
                                const isFavorite = favorites.includes(key);
                                return (
                                    <div
                                        key={key}
                                        className="movies-card"
                                        onClick={() => toDetail(item)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => (e.key === 'Enter' ? toDetail(item) : null)}
                                    >
                                        <div className="movies-card-image">
                                            <img
                                                src={tmdbImg(item.poster_path)}
                                                alt={item.title}
                                                loading="lazy"
                                            />
                                            <span className="movies-rating">
                                                <FaStar /> {item.vote_average ? item.vote_average.toFixed(1) : '—'}
                                            </span>
                                            <button
                                                className={`cvsearch__favorite ${isFavorite ? 'is-favorite' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}
                                                aria-label="Toggle favorite"
                                            >
                                                <FaHeart />
                                            </button>
                                        </div>
                                        <div className="movies-card-info">
                                            <h4>{item.title}</h4>
                                            <span className="cvsearch__chip">
                                                {(item.date || '').slice(0, 4) || '—'} · {item.media_type === 'movie' ? 'Movie' : 'TV'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {page < totalPages && (
                        <button
                            className="cvsearch__loadmore"
                            onClick={() => fetchSearch(debouncedQ, page + 1, true)}
                            disabled={loading}
                        >
                            {loading ? 'Loading…' : 'Load more'}
                        </button>
                    )}
                </section>
            )}
        </motion.div>
    );
}
