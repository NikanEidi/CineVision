// Movies.jsx


import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    FaHome, FaFilm, FaTv, FaBookmark, FaStar, FaFire, FaPlay, FaTrophy, FaClock, FaBolt, FaSearch, FaLightbulb
} from 'react-icons/fa'; // +FaLightbulb for Recommendation
import './App.css';

const FALLBACK_POSTER = '/no-image.png';

const Movies = () => {
    const navigate = useNavigate();
    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

    // Simple buckets for the rows
    const [popular, setPopular]       = useState([]);
    const [nowPlaying, setNowPlaying] = useState([]);
    const [topRated, setTopRated]     = useState([]);
    const [upcoming, setUpcoming]     = useState([]);
    const [trending, setTrending]     = useState([]);
    const [error, setError]           = useState('');
    const videoRef = useRef(null);

    // Try to autoplay background
    useEffect(() => {
        videoRef.current?.play?.().catch(() => {});
    }, []);

    // Fetch all sections together
    useEffect(() => {
        const fetchMovies = async () => {
            try {
                if (!API_KEY) {
                    setError('Missing TMDB API key (VITE_TMDB_API_KEY).');
                    return;
                }

                const [
                    popularRes,
                    nowPlayingRes,
                    topRatedRes,
                    upcomingRes,
                    trendingRes
                ] = await Promise.all([
                    axios.get('https://api.themoviedb.org/3/movie/popular',       { params: { api_key: API_KEY } }),
                    axios.get('https://api.themoviedb.org/3/movie/now_playing',   { params: { api_key: API_KEY } }),
                    axios.get('https://api.themoviedb.org/3/movie/top_rated',     { params: { api_key: API_KEY } }),
                    axios.get('https://api.themoviedb.org/3/movie/upcoming',      { params: { api_key: API_KEY } }),
                    axios.get('https://api.themoviedb.org/3/trending/movie/week', { params: { api_key: API_KEY } }),
                ]);

                setPopular(popularRes.data.results || []);
                setNowPlaying(nowPlayingRes.data.results || []);
                setTopRated(topRatedRes.data.results || []);
                setUpcoming(upcomingRes.data.results || []);
                setTrending(trendingRes.data.results || []);
            } catch (err) {
                console.error('Error fetching movies:', err);
                setError('Failed to load movies. Please try again.');
            }
        };

        fetchMovies();
    }, [API_KEY]);

    // Map section key -> icon (just for nice headings)
    const getSectionIcon = (sectionKey) => {
        const iconMap = {
            popular:    <FaFire   className="section-icon" />,
            nowPlaying: <FaPlay   className="section-icon" />,
            topRated:   <FaTrophy className="section-icon" />,
            upcoming:   <FaClock  className="section-icon" />,
            trending:   <FaBolt   className="section-icon" />
        };
        return iconMap[sectionKey] || null;
    };

    // Reusable row section (uses Movies page classes)
    const renderSection = (title, items, sectionKey) => (
        <section className="movies-section">
            <div className="movies-section-header">
                <div className="section-title">
                    {getSectionIcon(sectionKey)}
                    <h3>{title}</h3>
                </div>
            </div>

            <div className="movies-scroll-container">
                <div className="movies-scroll-row">
                    {(items || []).map((movie) => (
                        <div
                            key={movie.id}
                            className="movies-card"
                            onClick={() => navigate(`/detail/movie/${movie.id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => (e.key === 'Enter' ? navigate(`/detail/movie/${movie.id}`) : null)}
                        >
                            <div className="movies-card-image">
                                <img
                                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : FALLBACK_POSTER}
                                    alt={movie.title || 'Untitled'}
                                    onError={(e) => { e.currentTarget.src = FALLBACK_POSTER; }}
                                    loading="lazy"
                                />
                            </div>
                            <div className="movies-card-info">
                                <h4>{movie.title || 'Untitled'}</h4>
                                <span className="movies-rating">
                  <FaStar /> {typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : '—'}
                </span>
                            </div>
                        </div>
                    ))}
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
                poster="/movies.jpg"
            >
                <source src="/Movies.mp4" type="video/mp4" />
            </video>
            <div className="auth-overlay" />

            <div className="dashboard-container auth-content">
                {/* Sidebar (unchanged classes; just adds Recommendation) */}
                <aside className="sidebar">
                    <div className="logo">
                        <span className="logo-text">CineVision</span>
                    </div>
                    <ul className="menu">
                        <li onClick={() => navigate('/dashboard')}>
                            <FaHome className="menu-icon" /> <span className="menu-text">Home</span>
                        </li>
                        <li className="active">
                            <FaFilm className="menu-icon" /> <span className="menu-text">Movies</span>
                        </li>
                        <li onClick={() => navigate('/shows')}>
                            <FaTv className="menu-icon" /> <span className="menu-text">Shows</span>
                        </li>
                        <li onClick={() => navigate('/search')}>
                            <FaSearch className="menu-icon" /> <span className="menu-text">Search</span>
                        </li>

                        {/* New: Recommendation link */}
                        <li onClick={() => navigate('/recommendation')}>
                            <FaLightbulb className="menu-icon" /> <span className="menu-text">Recommendation</span>
                        </li>

                        <li onClick={() => navigate('/watchlist')}>
                            <FaBookmark className="menu-icon" /> <span className="menu-text">Watchlist</span>
                        </li>
                    </ul>
                </aside>

                {/* Main content */}
                <main className="movies-main">
                    <div className="movies-content">
                        <header className="movies-header">
                            <h1>Discover Movies</h1>
                            <p>Explore the latest and greatest in cinema</p>
                        </header>

                        {error && (
                            <div className="error-message" role="alert">
                                {error}
                            </div>
                        )}

                        {renderSection('Popular Movies', popular, 'popular')}
                        {renderSection('Now Playing', nowPlaying, 'nowPlaying')}
                        {renderSection('Top Rated', topRated, 'topRated')}
                        {renderSection('Upcoming', upcoming, 'upcoming')}
                        {renderSection('Trending This Week', trending, 'trending')}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Movies;