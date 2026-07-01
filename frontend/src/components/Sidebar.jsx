import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaFilm, FaTv, FaSearch, FaLightbulb, FaBookmark } from 'react-icons/fa';

const NAV_ITEMS = [
    { key: 'home', label: 'Home', path: '/dashboard', Icon: FaHome },
    { key: 'movies', label: 'Movies', path: '/movies', Icon: FaFilm },
    { key: 'shows', label: 'Shows', path: '/shows', Icon: FaTv },
    { key: 'search', label: 'Search', path: '/search', Icon: FaSearch },
    { key: 'recommendation', label: 'Recommend', path: '/recommendation', Icon: FaLightbulb },
    { key: 'watchlist', label: 'Watchlist', path: '/watchlist', Icon: FaBookmark },
];

/**
 * Shared navigation sidebar used across every authenticated page so the nav
 * bar looks and behaves identically everywhere. Pass `active` (one of the
 * NAV_ITEMS keys) to highlight the current page.
 */
export default function Sidebar({ active }) {
    const navigate = useNavigate();

    return (
        <aside className="sidebar">
            <div className="logo">
                <span className="logo-text">CineVision</span>
            </div>

            <ul className="menu">
                {NAV_ITEMS.map((item) => {
                    const isActive = active === item.key;
                    return (
                        <li
                            key={item.key}
                            className={isActive ? 'active' : undefined}
                            onClick={() => navigate(item.path)}
                            onKeyDown={(e) => (e.key === 'Enter' ? navigate(item.path) : null)}
                            role="button"
                            tabIndex={0}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <item.Icon className="menu-icon" />
                            <span className="menu-text">{item.label}</span>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}
