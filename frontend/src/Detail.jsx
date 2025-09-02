// src/Detail.jsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import axios from 'axios';
import {
    FaStar, FaBook, FaArrowLeft, FaPlay,
    FaCalendarAlt, FaClock, FaGlobe, FaEye,
    FaHeart, FaShare, FaBookmark, FaTimes,
    FaVolumeUp, FaVolumeMute, FaChevronLeft, FaChevronRight,
    FaLayerGroup, FaSync
} from 'react-icons/fa';
import './App.css';

const FALLBACK_POSTER = 'https://via.placeholder.com/300x450?text=No+Image';
const FALLBACK_STILL  = 'https://via.placeholder.com/320x180?text=No+Still';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const tmdbImg = (path, size = 'w500') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : FALLBACK_POSTER;

const tmdbStill = (path, size = 'w300') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : FALLBACK_STILL;

const getPosterBg = (it) => {
    if (!it) return FALLBACK_POSTER;
    if (it.poster_path) return tmdbImg(it.poster_path, 'w780');
    return FALLBACK_POSTER;
};

const RatingCircle = React.memo(({ rating }) => (
    <div className="rating-circle" style={{ '--rating': (rating || 0) * 10 }}>
        <svg className="rating-svg" viewBox="0 0 36 36">
            <path className="rating-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="rating-progress" strokeDasharray={`${(rating || 0) * 10}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        </svg>
        <div className="rating-text">
            <span className="rating-value">{Number(rating || 0).toFixed(1)}</span>
            <span className="rating-max">/10</span>
        </div>
    </div>
));

const StatItem = ({ icon: Icon, label, value }) => (
    <div className="stat-item">
        <Icon className="stat-icon" />
        <div>
            <span className="stat-label">{label}</span>
            <span className="stat-value">{value}</span>
        </div>
    </div>
);

const GenrePill = ({ genre }) => <span className="genre-pill">{genre}</span>;

const CastCard = React.memo(({ actor }) => (
    <div className="cast-card">
        <img src={tmdbImg(actor.profile_path, 'w185')} alt={actor.name} loading="lazy" />
        <div className="cast-info">
            <h4>{actor.name}</h4>
            <p>{actor.character}</p>
        </div>
    </div>
));

const SimilarCard = React.memo(({ item, onClick }) => (
    <div className="similar-card" onClick={onClick}>
        <img src={tmdbImg(item.poster_path, 'w300')} alt={item.title || item.name} loading="lazy" />
        <div className="similar-overlay">
            <h4>{item.title || item.name}</h4>
            <p>{(item.vote_average || 0).toFixed(1)} ⭐</p>
        </div>
    </div>
));

const Detail = () => {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const backdropRef = useRef(null);
    const castRef = useRef(null);
    const similarRef = useRef(null);

    const [item, setItem] = useState(null);
    const [youtubeKey, setYouTubeKey] = useState(null);
    const [trailerUrl, setTrailerUrl] = useState(null);
    const [trailerThumbnail, setTrailerThumbnail] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    const [user, setUser] = useState(null);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [watched, setWatched] = useState(false);

    const [providers, setProviders] = useState([]);
    const [cast, setCast] = useState([]);
    const [similarItems, setSimilarItems] = useState([]);

    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [watchedEpisodes, setWatchedEpisodes] = useState(new Set());

    const [loading, setLoading] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [showScrollHint, setShowScrollHint] = useState(true);

    const buildTrailerUrl = useCallback((key, muted) => {
        if (!key) return null;
        const params = new URLSearchParams({
            autoplay: '1',
            mute: muted ? '1' : '0',
            rel: '0',
            modestbranding: '1',
            playsinline: '1',
            controls: '1',
            enablejsapi: '1'
        });
        return `https://www.youtube.com/embed/${key}?${params.toString()}`;
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setShowScrollHint(false), 3000);
        setItem(null);
        setIsInWatchlist(false);
        setWatched(false);
        setYouTubeKey(null);
        setTrailerUrl(null);
        setTrailerThumbnail(null);
        setProviders([]);
        setCast([]);
        setSimilarItems([]);
        setIsModalOpen(false);
        setIsLiked(false);
        setImageLoaded(false);
        setSeasons([]);
        setSelectedSeason(null);
        setEpisodes([]);
        setWatchedEpisodes(new Set());

        const fetchAll = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            try {
                const [detailRes, videoRes, providerRes, creditsRes, similarRes] = await Promise.all([
                    axios.get(`https://api.themoviedb.org/3/${type}/${id}`, { params: { api_key: API_KEY } }),
                    axios.get(`https://api.themoviedb.org/3/${type}/${id}/videos`, { params: { api_key: API_KEY } }),
                    axios.get(`https://api.themoviedb.org/3/${type}/${id}/watch/providers`, { params: { api_key: API_KEY } }),
                    axios.get(`https://api.themoviedb.org/3/${type}/${id}/credits`, { params: { api_key: API_KEY } }),
                    axios.get(`https://api.themoviedb.org/3/${type}/${id}/similar`, { params: { api_key: API_KEY } })
                ]);

                const data = detailRes.data;
                setItem(data);
                setCast(creditsRes.data.cast?.slice(0, 18) || []);
                setSimilarItems(similarRes.data.results?.slice(0, 18) || []);

                const trailer = videoRes.data.results.find(
                    v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
                );
                if (trailer) {
                    setYouTubeKey(trailer.key);
                    setTrailerThumbnail(`https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`);
                } else {
                    setYouTubeKey(null);
                    setTrailerThumbnail(null);
                }

                const CAproviders = providerRes.data.results?.CA?.flatrate || [];
                setProviders(CAproviders);

                if (user) {
                    const { data: existing } = await supabase
                        .from('watchlist')
                        .select('id, watched')
                        .eq('user_id', user.id)
                        .eq('media_id', id)
                        .eq('media_type', type)
                        .maybeSingle();

                    if (existing) {
                        setIsInWatchlist(true);
                        setWatched(existing.watched || false);
                    }
                }

                if (type === 'tv') {
                    const allSeasons = (data.seasons || []).filter(s => s.season_number >= 0);
                    setSeasons(allSeasons);
                    const latest = [...allSeasons].reverse().find(s => (s.episode_count || 0) > 0) || allSeasons[0];
                    const initialSeason = latest ? latest.season_number : 1;
                    setSelectedSeason(initialSeason);
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
        return () => clearTimeout(timer);
    }, [type, id]);

    useEffect(() => {
        setTrailerUrl(buildTrailerUrl(youtubeKey, isMuted));
    }, [youtubeKey, isMuted, buildTrailerUrl]);

    useEffect(() => {
        const fetchSeason = async () => {
            if (type !== 'tv' || !selectedSeason) return;

            try {
                const { data: seasonRes } = await axios.get(
                    `https://api.themoviedb.org/3/tv/${id}/season/${selectedSeason}`,
                    { params: { api_key: API_KEY } }
                );
                const eps = seasonRes.episodes || [];
                setEpisodes(eps);

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: rows, error } = await supabase
                    .from('episode_progress')
                    .select('season_number, episode_number, watched')
                    .eq('user_id', user.id)
                    .eq('media_type', 'tv')
                    .eq('media_id', String(id))
                    .eq('season_number', selectedSeason);

                if (!error && rows) {
                    const setKeys = new Set(
                        rows.filter(r => r.watched).map(r => `${r.season_number}-${r.episode_number}`)
                    );
                    setWatchedEpisodes(setKeys);
                } else {
                    setWatchedEpisodes(new Set());
                }
            } catch (e) {
                console.error('Season fetch error:', e);
            }
        };

        fetchSeason();
    }, [type, id, selectedSeason]);

    useEffect(() => {
        if (item?.backdrop_path && backdropRef.current) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let r = 0, g = 0, b = 0;
                for (let i = 0; i < data.length; i += 4) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                }
                const count = data.length / 4;
                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);
                document.documentElement.style.setProperty('--dynamic-color', `rgb(${r}, ${g}, ${b})`);
                document.documentElement.style.setProperty('--dynamic-color-dim', `rgba(${r}, ${g}, ${b}, 0.3)`);
            };
            img.src = tmdbImg(item.backdrop_path, 'w780');
        }
    }, [item]);

    const handleAddToWatchlist = async () => {
        if (!user || !item) return;
        const payload = {
            user_id: user.id,
            media_id: id,
            media_type: type,
            title: item.title || item.name,
            poster_path: item.poster_path,
            vote_average: item.vote_average,
            genres: item.genres?.map(g => g.name).join(', ') || null,
            overview: item.overview,
            release_date: item.release_date || item.first_air_date,
            watched: false
        };
        const { error } = await supabase.from('watchlist').insert([payload]);
        if (!error) {
            setIsInWatchlist(true);
            setWatched(false);
        }
    };

    const handleRemoveFromWatchlist = async () => {
        if (!user) return;
        const { error } = await supabase
            .from('watchlist')
            .delete()
            .eq('user_id', user.id)
            .eq('media_id', id)
            .eq('media_type', type);
        if (!error) {
            setIsInWatchlist(false);
            setWatched(false);
        }
    };

    const handleMarkAsWatched = async () => {
        if (!user) return;
        const { error } = await supabase
            .from('watchlist')
            .update({ watched: true })
            .eq('user_id', user.id)
            .eq('media_id', id)
            .eq('media_type', type);
        if (!error) setWatched(true);
    };

    const keyFor = (s, e) => `${s}-${e}`;

    const toggleEpisodeWatched = useCallback(async (episode) => {
        if (!user) return;
        const sNo = selectedSeason;
        const eNo = episode.episode_number;
        const key = keyFor(sNo, eNo);
        const alreadyWatched = watchedEpisodes.has(key);

        if (alreadyWatched) {
            const { error } = await supabase
                .from('episode_progress')
                .delete()
                .eq('user_id', user.id)
                .eq('media_type', 'tv')
                .eq('media_id', String(id))
                .eq('season_number', sNo)
                .eq('episode_number', eNo);
            if (!error) {
                const next = new Set(watchedEpisodes);
                next.delete(key);
                setWatchedEpisodes(next);
            }
        } else {
            const { error } = await supabase
                .from('episode_progress')
                .upsert({
                    user_id: user.id,
                    media_type: 'tv',
                    media_id: String(id),
                    season_number: sNo,
                    episode_number: eNo,
                    watched: true,
                    watched_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,media_type,media_id,season_number,episode_number'
                });
            if (!error) {
                const next = new Set(watchedEpisodes);
                next.add(key);
                setWatchedEpisodes(next);
            }
        }
    }, [user, id, selectedSeason, watchedEpisodes]);

    const markSeasonAsWatched = useCallback(async () => {
        if (!user || episodes.length === 0) return;
        const rows = episodes.map(ep => ({
            user_id: user.id,
            media_type: 'tv',
            media_id: String(id),
            season_number: selectedSeason,
            episode_number: ep.episode_number,
            watched: true,
            watched_at: new Date().toISOString()
        }));
        const { error } = await supabase
            .from('episode_progress')
            .upsert(rows, { onConflict: 'user_id,media_type,media_id,season_number,episode_number' });
        if (!error) {
            setWatchedEpisodes(new Set(episodes.map(ep => keyFor(selectedSeason, ep.episode_number))));
        }
    }, [user, id, selectedSeason, episodes]);

    const clearSeasonProgress = useCallback(async () => {
        if (!user) return;
        const { error } = await supabase
            .from('episode_progress')
            .delete()
            .eq('user_id', user.id)
            .eq('media_type', 'tv')
            .eq('media_id', String(id))
            .eq('season_number', selectedSeason);
        if (!error) setWatchedEpisodes(new Set());
    }, [user, id, selectedSeason]);

    const toggleSeasonWatched = useCallback(async () => {
        const allWatched = episodes.length > 0 && episodes.every(ep =>
            watchedEpisodes.has(keyFor(selectedSeason, ep.episode_number))
        );
        if (allWatched) {
            await clearSeasonProgress();
        } else {
            await markSeasonAsWatched();
        }
    }, [episodes, watchedEpisodes, selectedSeason, clearSeasonProgress, markSeasonAsWatched]);

    const openTrailer = (e) => {
        e?.preventDefault();
        setIsModalOpen(true);
    };

    const closeTrailer = (e) => {
        e?.preventDefault();
        setIsModalOpen(false);
    };

    const toggleMute = (e) => {
        e?.preventDefault();
        setIsMuted((prev) => !prev);
    };

    const releaseDate = useMemo(() => {
        const date = item?.release_date || item?.first_air_date;
        return date
            ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'N/A';
    }, [item]);

    const formatRuntime = (minutes) => {
        if (!minutes) return type === 'tv' ? 'Per ep.' : 'N/A';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const scrollHorizontally = (ref, dir) => {
        if (ref.current) ref.current.scrollBy({ left: dir * 360, behavior: 'smooth' });
    };

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setIsModalOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    if (loading) {
        return (
            <div className="detail-page loading-state">
                <div className="cosmic-loader">
                    <div className="loader-ring"></div>
                    <div className="loader-ring"></div>
                    <div className="loader-ring"></div>
                    <div className="loader-text">Loading cosmic data...</div>
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="detail-page">
                <div className="error-message">Content not found</div>
            </div>
        );
    }

    return (
        <>
            {isModalOpen && (
                <div className="modal" onClick={closeTrailer}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Official Trailer</h3>
                            <div className="modal-controls">
                                <button className="btn-icon" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'} aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'} type="button">
                                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                                </button>
                                <button className="close-btn" onClick={closeTrailer} aria-label="Close trailer" type="button">
                                    <FaTimes />
                                </button>
                            </div>
                        </div>
                        <div className="video-container">
                            {trailerUrl ? (
                                <iframe
                                    src={trailerUrl}
                                    title="Trailer"
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                            ) : (
                                <div className="video-fallback">Trailer not available</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="detail-page" style={{ position: 'relative' }}>
                <div className="dynamic-background" style={{ pointerEvents: 'none' }}>
                    <div
                        className="backdrop-fill"
                        style={{
                            backgroundImage: `
                linear-gradient(135deg, rgba(0,0,0,.55), rgba(10,10,20,.50)),
                url(${tmdbImg(item.backdrop_path || item.poster_path, 'original')})
              `,
                            pointerEvents: 'none'
                        }}
                        ref={backdropRef}
                    />
                    <div className="backdrop-overlay" style={{ pointerEvents: 'none' }} />
                </div>

                <button
                    className="return-btn"
                    onClick={() => navigate('/dashboard')}
                    aria-label="Back to Dashboard"
                    title="Back to Dashboard"
                    type="button"
                    style={{ position: 'relative', zIndex: 2 }}
                >
                    <FaArrowLeft />
                    <span>Dashboard</span>
                </button>

                {showScrollHint && (
                    <div className="scroll-hint" style={{ position: 'relative', zIndex: 2 }}>
                        <div className="scroll-arrow"></div>
                        <span>Scroll to explore</span>
                    </div>
                )}

                <div className="hero-section" style={{ position: 'relative', zIndex: 2 }}>
                    <div className="hero-content">
                        <div className="poster-section">
                            <div className="poster-container">
                                <img
                                    className={`detail-poster ${imageLoaded ? 'loaded' : ''}`}
                                    src={tmdbImg(item.poster_path, 'w500')}
                                    alt={item.title || item.name}
                                    onLoad={() => setImageLoaded(true)}
                                    onError={(e) => {
                                        e.currentTarget.src = FALLBACK_POSTER;
                                        setImageLoaded(true);
                                    }}
                                />
                                <div className="poster-reflection"></div>
                            </div>
                        </div>

                        <div className="info-section">
                            <div className="title-section">
                                <h1 className="detail-title">{item.title || item.name}</h1>
                                {item.tagline && <p className="tagline">"{item.tagline}"</p>}
                            </div>

                            <div className="meta-info">
                                <div className="rating-container">
                                    <RatingCircle rating={item.vote_average}/>
                                    <div className="rating-stats">
                                        <div className="stat">
                                            <FaStar className="star-icon"/>
                                            <span>{item.vote_count?.toLocaleString()} votes</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="genres-container">
                                    {item.genres?.slice(0, 3).map((genre, idx) => (
                                        <GenrePill key={idx} genre={genre.name}/>
                                    ))}
                                </div>
                            </div>

                            <p className="overview">{item.overview}</p>

                            <div className="detail-stats">
                                <StatItem icon={FaCalendarAlt} label="Release Date" value={releaseDate}/>
                                <StatItem
                                    icon={FaClock}
                                    label={type === 'tv' ? 'Episode Runtime' : 'Runtime'}
                                    value={
                                        type === 'tv'
                                            ? `${(item.episode_run_time?.[0] || 0) || 'N/A'}m`
                                            : `${formatRuntime(item.runtime)}`
                                    }
                                />
                                <StatItem icon={FaGlobe} label="Language" value={(item.original_language || 'N/A').toUpperCase()}/>
                            </div>

                            <div className="action-buttons">
                                <div className="primary-actions">
                                    {trailerUrl && (
                                        <button className="btn btn-primary trailer-btn" onClick={openTrailer} type="button">
                                            <FaPlay/>
                                            <span>Watch Trailer</span>
                                        </button>
                                    )}

                                    {isInWatchlist ? (
                                        <div className="watchlist-actions">
                                            <button className="btn btn-danger" onClick={handleRemoveFromWatchlist} type="button">
                                                <FaBookmark/>
                                                Remove from Watchlist
                                            </button>
                                            {type === 'movie' && !watched && (
                                                <button className="btn btn-success" onClick={handleMarkAsWatched} type="button">
                                                    <FaEye/>
                                                    Mark as Watched
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button className="btn btn-secondary" onClick={handleAddToWatchlist} type="button">
                                            <FaBook/>
                                            Add to Watchlist
                                        </button>
                                    )}
                                </div>

                                <div className="secondary-actions">
                                    <button
                                        className={`btn-icon ${isLiked ? 'liked' : ''}`}
                                        onClick={(e) => { e.preventDefault(); setIsLiked(!isLiked); }}
                                        title="Add to favorites"
                                        aria-label="Add to favorites"
                                        type="button"
                                    >
                                        <FaHeart/>
                                    </button>
                                    <button
                                        className="btn-icon"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: item.title || item.name,
                                                    text: item.overview,
                                                    url: window.location.href,
                                                }).catch(() => {});
                                            } else {
                                                navigator.clipboard.writeText(window.location.href);
                                            }
                                        }}
                                        title="Share"
                                        aria-label="Share"
                                        type="button"
                                    >
                                        <FaShare/>
                                    </button>
                                    <button
                                        className="btn-icon"
                                        onClick={(e) => { e.preventDefault(); navigate(-1); }}
                                        title="Go back"
                                        aria-label="Go back"
                                        type="button"
                                    >
                                        <FaArrowLeft/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {trailerThumbnail && (
                            <div className="trailer-section">
                                <div className="trailer-preview" onClick={openTrailer}>
                                    <img src={trailerThumbnail} alt="Trailer thumbnail"/>
                                    <div className="play-overlay">
                                        <FaPlay className="play-icon"/>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {type === 'tv' && seasons.length > 0 && (
                    <div className="content-sections" style={{ position: 'relative', zIndex: 2 }}>
                        <section className="providers-section" style={{ marginBottom: '2rem' }}>
                            <div className="section-header">
                                <h2 className="section-title"><FaLayerGroup style={{ marginRight: 8 }} /> Seasons & Episodes</h2>
                                <div className="scroll-controls" style={{ gap: '.6rem' }}>
                                    <select
                                        className="genre-pill"
                                        value={selectedSeason || ''}
                                        onChange={(e) => setSelectedSeason(Number(e.target.value))}
                                        aria-label="Select season"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {seasons
                                            .slice()
                                            .sort((a, b) => a.season_number - b.season_number)
                                            .map((s) => (
                                                <option key={s.id || s.season_number} value={s.season_number}>
                                                    {s.name || `Season ${s.season_number}`}
                                                </option>
                                            ))}
                                    </select>

                                    <button
                                        className="btn btn-primary"
                                        onClick={(e) => { e.preventDefault(); toggleSeasonWatched(); }}
                                        title="Toggle season watched status"
                                        type="button"
                                    >
                                        <FaSync/>
                                        Mark as Watched
                                    </button>
                                </div>
                            </div>

                            <div className="providers-grid">
                                {episodes.map((ep) => {
                                    const key = keyFor(selectedSeason, ep.episode_number);
                                    const isSeen = watchedEpisodes.has(key);
                                    return (
                                        <div
                                            key={ep.id || `${selectedSeason}-${ep.episode_number}`}
                                            className="provider-card"
                                        >
                                            <img
                                                src={tmdbStill(ep.still_path, 'w300')}
                                                alt={ep.name || `Episode ${ep.episode_number}`}
                                                onError={(e) => { e.currentTarget.src = FALLBACK_STILL; }}
                                            />

                                            <div className="episode-info">
                                                <strong>
                                                    S{selectedSeason} · E{ep.episode_number} — {ep.name || 'Untitled'}
                                                </strong>
                                                <div className="episode-meta">
                                                    {ep.runtime ? `${ep.runtime}m` : '—'} • {ep.air_date || ''}
                                                </div>
                                                {ep.overview && (
                                                    <div className="episode-overview">
                                                        {ep.overview}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                className={`btn-icon ${isSeen ? 'liked' : ''}`}
                                                onClick={(e) => { e.preventDefault(); toggleEpisodeWatched(ep); }}
                                                title={isSeen ? 'Unmark watched' : 'Mark as watched'}
                                                aria-label={isSeen ? 'Unmark watched' : 'Mark as watched'}
                                                type="button"
                                            >
                                                <FaEye/>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                )}

                {providers.length > 0 && (
                    <div className="content-sections" style={{ position: 'relative', zIndex: 2 }}>
                        <section className="providers-section">
                            <h2 className="section-title">Available On</h2>
                            <div className="providers-grid">
                                {providers.map(provider => (
                                    <a
                                        key={provider.provider_id}
                                        href={`https://www.google.com/search?q=${encodeURIComponent(
                                            `${item.title || item.name} ${provider.provider_name}`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="provider-card"
                                        title={`Watch on ${provider.provider_name}`}
                                    >
                                        <img src={tmdbImg(provider.logo_path, 'original')} alt={provider.provider_name}/>
                                        <span>{provider.provider_name}</span>
                                    </a>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {cast.length > 0 && (
                    <div className="content-sections" style={{ position: 'relative', zIndex: 2 }}>
                        <section className="cast-section">
                            <div className="section-header">
                                <h2 className="section-title">Cast</h2>
                                <div className="scroll-controls">
                                    <button
                                        className="scroll-btn"
                                        onClick={(e) => { e.preventDefault(); scrollHorizontally(castRef, -1); }}
                                        aria-label="Scroll left"
                                        title="Scroll left"
                                        type="button"
                                    >
                                        <FaChevronLeft/>
                                    </button>
                                    <button
                                        className="scroll-btn"
                                        onClick={(e) => { e.preventDefault(); scrollHorizontally(castRef, 1); }}
                                        aria-label="Scroll right"
                                        title="Scroll right"
                                        type="button"
                                    >
                                        <FaChevronRight/>
                                    </button>
                                </div>
                            </div>

                            <div
                                className="cast-row"
                                ref={castRef}
                                style={{
                                    display: 'flex',
                                    gap: '16px',
                                    overflowX: 'auto',
                                    scrollBehavior: 'smooth',
                                    paddingBottom: '6px'
                                }}
                            >
                                {cast.map((actor, index) => (
                                    <CastCard key={index} actor={actor}/>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {similarItems.length > 0 && (
                    <div className="content-sections" style={{ position: 'relative', zIndex: 2 }}>
                        <section className="similar-section">
                            <div className="section-header">
                                <h2 className="section-title">More Like This</h2>
                                <div className="scroll-controls">
                                    <button
                                        className="scroll-btn"
                                        onClick={(e) => { e.preventDefault(); scrollHorizontally(similarRef, -1); }}
                                        aria-label="Scroll left"
                                        title="Scroll left"
                                        type="button"
                                    >
                                        <FaChevronLeft/>
                                    </button>
                                    <button
                                        className="scroll-btn"
                                        onClick={(e) => { e.preventDefault(); scrollHorizontally(similarRef, 1); }}
                                        aria-label="Scroll right"
                                        title="Scroll right"
                                        type="button"
                                    >
                                        <FaChevronRight/>
                                    </button>
                                </div>
                            </div>

                            <div
                                className="similar-row"
                                ref={similarRef}
                                style={{
                                    display: 'flex',
                                    gap: '16px',
                                    overflowX: 'auto',
                                    scrollBehavior: 'smooth',
                                    paddingBottom: '6px'
                                }}
                            >
                                {similarItems.map((similar, index) => (
                                    <SimilarCard
                                        key={index}
                                        item={similar}
                                        onClick={() => navigate(`/detail/${type}/${similar.id}`)}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </>
    );
};

export default Detail;
