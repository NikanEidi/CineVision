// src/Search.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaTimes, FaArrowLeft, FaChevronLeft, FaChevronRight, FaStar, FaHeart,
    FaHome, FaFilm, FaTv, FaBookmark, FaLightbulb,
} from 'react-icons/fa';
import './styles/index.css';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const FALLBACK_POSTER =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM4ODgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuMzVlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
const FALLBACK_BACKDROP =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4MCIgaGVpZ2h0PSI3MjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzIyMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNTU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gQmFja2Ryb3A8L3RleHQ+PC9zdmc+';

const tmdbImg = (p, size = 'w342') =>
    p ? `https://image.tmdb.org/t/p/${size}${p}` : FALLBACK_POSTER;

const tmdbBackdrop = (p, size = 'w1280') =>
    p ? `https://image.tmdb.org/t/p/${size}${p}` : FALLBACK_BACKDROP;

// Prefer the poster for the blurred page background; fall back to a backdrop.
function pickBgImage(activeItem, details) {
    const poster = activeItem?.poster_path;
    const backdrop = details?.backdrop_path || activeItem?.backdrop_path;
    return poster ? tmdbImg(poster, 'w780') : tmdbBackdrop(backdrop, 'w1280');
}

// Simple debounce to limit API calls while typing
function useDebounce(value, delay = 400) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

// The coverflow CSS only defines arc positions -4..4 (9 cards); never render outside that range.
const ARC_SPAN = 4;

export default function Search() {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const initialQ = params.get('q') || '';

    const [q, setQ] = useState(initialQ);
    const debouncedQ = useDebounce(q, 450);

    const [results, setResults] = useState([]);
    const [active, setActive] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [detailsCache, setDetailsCache] = useState({});
    const [favorites, setFavorites] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Full-page blurred background, faded/crossfaded via bgUrl + CSS transition.
    const [bgUrl, setBgUrl] = useState('');

    // Wheel/trackpad accumulator so small deltas feel natural
    const wheelAccRef = useRef(0);

    const fetchSearch = useCallback(
        async (query, pageNum = 1, merge = false) => {
            if (!API_KEY) {
                setError('TMDB API Key not found.');
                return;
            }
            if (!query?.trim()) {
                setResults([]);
                setError('');
                setPage(1);
                setTotalPages(1);
                setActive(0);
                setBgUrl('');
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
                        backdrop_path: r.backdrop_path,
                        vote_average: r.vote_average || 0,
                        date: r.release_date || r.first_air_date || '',
                    }));
                setTotalPages(data?.total_pages || 1);
                setPage(pageNum);
                setResults((prev) => (merge ? [...prev, ...filtered] : filtered));
                if (!merge) setActive(0);
            } catch {
                setError('Failed to fetch results.');
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const fetchDetails = useCallback(
        async (item) => {
            if (!item || detailsCache[`${item.media_type}-${item.id}`]) return;
            try {
                const endpoint = item.media_type === 'movie' ? 'movie' : 'tv';
                const { data } = await axios.get(
                    `https://api.themoviedb.org/3/${endpoint}/${item.id}`,
                    { params: { api_key: API_KEY, language: 'en-US' } }
                );
                setDetailsCache((prev) => ({
                    ...prev,
                    [`${item.media_type}-${item.id}`]: { backdrop_path: data.backdrop_path },
                }));
            } catch (err) {
                console.error('Failed to fetch details:', err);
            }
        },
        [detailsCache]
    );

    // Sync URL and search
    useEffect(() => {
        setParams(debouncedQ?.trim() ? { q: debouncedQ.trim() } : {});
        fetchSearch(debouncedQ, 1, false);
    }, [debouncedQ, fetchSearch, setParams]);

    // Crossfade the background whenever the focused card changes
    useEffect(() => {
        const item = results[active];
        if (item) {
            fetchDetails(item);
            const details = detailsCache[`${item.media_type}-${item.id}`];
            setBgUrl(pickBgImage(item, details) || '');
        } else {
            setBgUrl('');
        }
    }, [active, results, fetchDetails, detailsCache]);

    // Navigation helpers (wrap around)
    const goLeft = useCallback(() => {
        setActive((idx) => (results.length ? (idx - 1 + results.length) % results.length : 0));
    }, [results.length]);
    const goRight = useCallback(() => {
        setActive((idx) => (results.length ? (idx + 1) % results.length : 0));
    }, [results.length]);

    // Keyboard navigation
    useEffect(() => {
        const onKey = (e) => {
            if (!results.length) return;
            if (e.key === 'ArrowLeft') { e.preventDefault(); goLeft(); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); goRight(); }
            else if (e.key === 'Escape') {
                setQ('');
                setResults([]);
                setBgUrl('');
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [results.length, goLeft, goRight]);

    // Pointer drag (touch + mouse) — smooth left/right scroll through the arc
    const dragRef = useRef({ dragging: false, lastX: 0, acc: 0 });
    const onPointerDown = (e) => {
        const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
        dragRef.current = { dragging: true, lastX: x, acc: 0 };
    };
    const onPointerMove = (e) => {
        if (!dragRef.current.dragging) return;
        const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
        const dx = x - dragRef.current.lastX;
        dragRef.current.lastX = x;
        dragRef.current.acc += dx;
        const threshold = Math.max(30, Math.min(70, window.innerWidth / 25));
        while (dragRef.current.acc > threshold) { goLeft(); dragRef.current.acc -= threshold; }
        while (dragRef.current.acc < -threshold) { goRight(); dragRef.current.acc += threshold; }
    };
    const onPointerUp = () => {
        dragRef.current.dragging = false;
        dragRef.current.acc = 0;
    };

    // Mouse wheel / trackpad — horizontal or vertical scroll both navigate
    const onWheel = (e) => {
        if (!results.length) return;
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        wheelAccRef.current += delta;
        const threshold = 80;
        while (wheelAccRef.current > threshold) { goRight(); wheelAccRef.current -= threshold; }
        while (wheelAccRef.current < -threshold) { goLeft(); wheelAccRef.current += threshold; }
    };

    // Only the 5 arc slots (-2..2) have matching CSS — never render outside that range.
    const visibleItems = useMemo(() => {
        const N = results.length;
        if (!N) return [];
        const arr = [];
        for (let i = 0; i < N; i++) {
            let off = i - active;
            if (off > N / 2) off -= N;
            if (off < -N / 2) off += N;
            if (Math.abs(off) <= ARC_SPAN) arr.push({ item: results[i], index: i, off });
        }
        // Ascending offset so DOM/flex order matches the visual arc left-to-right;
        // z-index for stacking is handled per data-position in CSS.
        return arr.sort((a, b) => a.off - b.off);
    }, [results, active]);

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
            {/* Full-page blurred background, crossfades with the focused card */}
            <div
                className="cvsearch__bg"
                aria-hidden
                style={{
                    backgroundImage: bgUrl ? `url(${bgUrl})` : 'none',
                    opacity: bgUrl ? 0.9 : 0,
                }}
            />

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

                <nav className="cvsearch__nav-group" aria-label="Main navigation">
                    <button className="cvsearch__nav-btn" onClick={() => navigate('/dashboard')} aria-label="Go to Home">
                        <FaHome /> <span>Home</span>
                    </button>
                    <button className="cvsearch__nav-btn" onClick={() => navigate('/movies')} aria-label="Browse Movies">
                        <FaFilm /> <span>Movies</span>
                    </button>
                    <button className="cvsearch__nav-btn" onClick={() => navigate('/shows')} aria-label="Browse TV Shows">
                        <FaTv /> <span>Shows</span>
                    </button>
                    <button className="cvsearch__nav-btn" onClick={() => navigate('/recommendation')} aria-label="Get Recommendations">
                        <FaLightbulb /> <span>Recommend</span>
                    </button>
                    <button className="cvsearch__nav-btn" onClick={() => navigate('/watchlist')} aria-label="View Watchlist">
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
                            onClick={() => { setQ(''); setResults([]); setBgUrl(''); }}
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

            {/* Coverflow stage */}
            {results.length > 0 && (
                <section
                    className="cvsearch__stage"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onTouchStart={onPointerDown}
                    onTouchMove={onPointerMove}
                    onTouchEnd={onPointerUp}
                    onWheel={onWheel}
                >
                    <div className="cvsearch__track">
                        {visibleItems.map(({ item, index, off }) => {
                            const key = `${item.media_type}-${item.id}`;
                            const isFocus = off === 0;
                            const isFavorite = favorites.includes(key);
                            return (
                                <div
                                    key={key}
                                    className="cvsearch__posterWrap"
                                    data-position={String(off)}
                                    onClick={() => (isFocus ? toDetail(item) : setActive(index))}
                                >
                                    <div className="cvsearch__card">
                                        <img
                                            src={tmdbImg(item.poster_path, isFocus ? 'w500' : 'w342')}
                                            alt={item.title}
                                            className="cvsearch__poster"
                                            loading="lazy"
                                            draggable={false}
                                        />

                                        <div className="cvsearch__cardOverlay">
                                            <h3 className="cvsearch__cardTitle">{item.title}</h3>
                                            <div className="cvsearch__cardMeta">
                                                <span>{(item.date || '').slice(0, 4) || '—'}</span>
                                                <span>{item.media_type === 'movie' ? 'Movie' : 'TV'}</span>
                                                <span className="cvsearch__cardRating">
                                                    <FaStar /> {item.vote_average ? item.vote_average.toFixed(1) : '—'}
                                                </span>
                                            </div>
                                            {isFocus && (
                                                <button
                                                    className="cvsearch__cta"
                                                    onClick={(e) => { e.stopPropagation(); toDetail(item); }}
                                                >
                                                    View details
                                                </button>
                                            )}
                                        </div>

                                        {isFocus && (
                                            <button
                                                className={`cvsearch__favorite ${isFavorite ? 'is-favorite' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}
                                                aria-label="Toggle favorite"
                                            >
                                                <FaHeart />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {results.length > 1 && (
                        <>
                            <button className="cvsearch__nav cvsearch__nav--prev" onClick={goLeft} aria-label="Previous">
                                <FaChevronLeft />
                            </button>
                            <button className="cvsearch__nav cvsearch__nav--next" onClick={goRight} aria-label="Next">
                                <FaChevronRight />
                            </button>
                        </>
                    )}
                </section>
            )}

            {results.length > 0 && page < totalPages && (
                <button
                    className="cvsearch__loadmore"
                    onClick={() => fetchSearch(debouncedQ, page + 1, true)}
                    disabled={loading}
                >
                    {loading ? 'Loading…' : 'Load more'}
                </button>
            )}
        </motion.div>
    );
}
