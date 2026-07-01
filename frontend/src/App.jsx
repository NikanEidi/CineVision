import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Animations from './Animations.jsx';
import SignUp from './Signup.jsx';
import Login from './Login.jsx';
import DashBoard from './DashBoard.jsx';
import Detail from './Detail.jsx';
import Movies from './Movies.jsx';
import Shows from './Shows.jsx';
import Watchlist from './Watchlist.jsx';
import Search from './Search.jsx';
import Recommendation from './Recommendation.jsx';
import ForgotPassword from './ForgotPassword.jsx';
import UpdatePassword from './UpdatePassword.jsx';

import Footer from './Footer';

// Backend base URL — same resolution the data pages use.
const API_BASE =
    (import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.replace(/\/+$/, '')) ||
    (typeof window !== 'undefined' && window.__API_BASE__ && String(window.__API_BASE__).replace(/\/+$/, '')) ||
    'http://127.0.0.1:5178';

function App() {
    // Wake the free-tier backend the moment the app loads so it's warm by the
    // time the user opens recommendations, instead of paying the cold start on
    // their first request. Fire-and-forget; failures are harmless.
    useEffect(() => {
        fetch(`${API_BASE}/healthz`).catch(() => {});
    }, []);

    return (
        <Router>
            <Routes>
                {/* Animation Intro - Default landing route */}
                <Route path="/" element={<Animations />} />

                {/* Auth */}
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />

                {/* Password recovery flow */}
                <Route path="/forgot" element={<ForgotPassword />} />
                <Route path="/update-password" element={<UpdatePassword />} />

                {/* Case-insensitive route aliases */}
                <Route path="/Forgot" element={<ForgotPassword />} />
                <Route path="/Update-Password" element={<UpdatePassword />} />

                {/* User Dashboard (after login) */}
                <Route path="/dashboard" element={<DashBoard />} />
                <Route path="/DashBoard" element={<DashBoard />} />

                {/* All Movies Page */}
                <Route path="/movies" element={<Movies />} />
                <Route path="/Movies" element={<Movies />} />

                {/* All Shows Page */}
                <Route path="/shows" element={<Shows />} />
                <Route path="/Shows" element={<Shows />} />

                {/* Search Page */}
                <Route path="/search" element={<Search />} />
                <Route path="/Search" element={<Search />} />

                {/* Watchlist */}
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/Watchlist" element={<Watchlist />} />

                {/* AI Recommendations */}
                <Route path="/recommendation" element={<Recommendation />} />
                <Route path="/Recommendation" element={<Recommendation />} />

                {/* Detail Page */}
                <Route path="/detail/:type/:id" element={<Detail />} />

                {/* Optional: catch-all to home (keeps unknown routes tidy) */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Global footer across pages */}
            <Footer />
        </Router>
    );
}

export default App;
