// Shows.jsx
// Short, humanized comments; keeps classes/structure intact.
// Adds "Recommendation" to the sidebar.

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    FaHome, FaFilm, FaTv, FaBookmark, FaStar,
    FaFire, FaPlay, FaTrophy, FaClock, FaBolt, FaSearch, FaLightbulb // +FaLightbulb
} from 'react-icons/fa';
import './App.css';

// Fallback poster if TMDB image is missing
const FALLBACK_POSTER = '/no-image.png'; // keep this file in /public

const Shows = () => {
    const navigate = useNavigate();
    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

    // TV buckets for rows
    const [popular, setPopular]       = useState([]);
    const [airingToday, setAiringToday] = useState([]);
    const [topRated, setTopRated]     = useState([]);
    const [onTheAir, setOnTheAir]     = useState([]);
    const [trending, setTrending]     = useState([]);
    const [error, setError]           = useState('');

    // Try to autoplay background
    const videoRef = useRef(null);
    useEffect(() => {
        videoRef.current?.play?.().catch(() => {});
    }, []);

    // Fetch all sections together
    useEffect(() => {
        const fetchShows = async () => {
            try {
                if (!API_KEY) {
                    setError('Missing TMDB API key (VITE_TMDB_API_KEY).');
                    return;
                }

                const [
                    popularRes,
                    airingTodayRes,
                    topRatedRes,
                    onTheAirRes,
                    trendingRes
                ] = await Promise.all([
                    axios.get('https://api.themoviedb.org/3/tv/popular',      { params: { api_key: API_KEY } }),
                    axios.get('https://api.themoviedb.org/3/tv/airing_today', { params: { api_key: API_KEY } }),
                    axios.get('https://api.themoviedb.org/3/tv/top_rated',    { params: { api_key: API_KEY } }),
                    axios.get('https://api.themoviedb.org/3/tv/on_the_air',   { params: { api_key: API_KEY } }),
                    axios.get('https://api.themoviedb.org/3/trending/tv/week',{ params: { api_key: API_KEY } }),
                ]);

                setPopular(popularRes.data.results || []);
                setAiringToday(airingTodayRes.data.results || []);
                setTopRated(topRatedRes.data.results || []);
                setOnTheAir(onTheAirRes.data.results || []);
                setTrending(trendingRes.data.results || []);
            } catch (err) {
                console.error('Error fetching shows:', err);
                setError('Failed to load shows. Please try again.');
            }
        };

        fetchShows();
    }, [API_KEY]);

    // Icon map for headers
    const getSectionIcon = (sectionKey) => {
        const iconMap = {
            popular:     <FaFire className="section-icon" />,
            airingToday: <FaPlay className="section-icon" />,
            topRated:    <FaTrophy className="section-icon" />,
            onTheAir:    <FaClock className="section-icon" />,
            trending:    <FaBolt className="section-icon" />
        };
        return iconMap[sectionKey] || null;
    };

    // Reusable row renderer (uses Movies page classes)
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
                    {(items || []).map((show) => (
                        <div
                            key={show.id}
                            className="movies-card"
                            onClick={() => navigate(`/detail/tv/${show.id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => (e.key === 'Enter' ? navigate(`/detail/tv/${show.id}`) : null)}
                        >
                            <div className="movies-card-image">
                                <img
                                    src={show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : FALLBACK_POSTER}
                                    alt={show.name || 'Untitled'}
                                    onError={(e) => { e.currentTarget.src = FALLBACK_POSTER; }}
                                    loading="lazy"
                                />
                            </div>
                            <div className="movies-card-info">
                                <h4>{show.name || 'Untitled'}</h4>
                                <span className="movies-rating">
                  <FaStar /> {typeof show.vote_average === 'number' ? show.vote_average.toFixed(1) : '—'}
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
                poster="/shows.jpg"
            >
                <source src="/Shows.mp4" type="video/mp4" />
            </video>

            {/* Overlay for readability */}
            <div className="auth-overlay" />

            {/* Foreground content */}
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
                        <li onClick={() => navigate('/movies')}>
                            <FaFilm className="menu-icon" /> <span className="menu-text">Movies</span>
                        </li>
                        <li className="active">
                            <FaTv className="menu-icon" /> <span className="menu-text">Shows</span>
                        </li>
                        <li onClick={() => navigate('/search')}>
                            <FaSearch className="menu-icon" /> <span className="menu-text">Search</span>
                        </li>

                        {/* New: Recommendation link */}
                        <li onClick={() => navigate('/recommendation')}>
                            <FaLightbulb className="menu-icon" /> <span className="menu-text">Recommend</span>
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
                            <h1>Discover TV Shows</h1>
                            <p>Stream the best series right now</p>
                        </header>

                        {error && (
                            <div className="error-message" role="alert">
                                {error}
                            </div>
                        )}

                        {renderSection("Popular Shows", popular, "popular")}
                        {renderSection("Airing Today", airingToday, "airingToday")}
                        {renderSection("Top Rated", topRated, "topRated")}
                        {renderSection("On The Air", onTheAir, "onTheAir")}
                        {renderSection("Trending This Week", trending, "trending")}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Shows;
