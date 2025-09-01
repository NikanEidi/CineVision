// Login.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './App.css';

import {
    FaEnvelope,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaGoogle,
    FaApple
} from 'react-icons/fa';

function Login() {
    const [email, setEmail]                 = useState('');
    const [password, setPassword]           = useState('');
    const [showPassword, setShowPassword]   = useState(false);
    const [rememberMe, setRememberMe]       = useState(false);
    const [isLoading, setIsLoading]         = useState(false);
    const [error, setError]                 = useState('');
    const [isBlinking, setIsBlinking]       = useState(false);

    const videoRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 150);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Try to make autoplay reliable on mobile.
    useEffect(() => {
        videoRef.current?.play?.().catch(() => {});
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (loginError) throw loginError;

            if (rememberMe && data?.user) {
                // Not production-grade "remember me", but enough for a demo.
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            console.log(' Logged in:', data.user);
            navigate('/dashboard');
        } catch (err) {
            console.error(' Login failed:', err?.message || err);
            setError(err?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

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
                poster="/auth.jpg"
            >
                <source src="/SingIn_UP.mp4" type="video/mp4" />
            </video>
            <div className="auth-overlay" />

            {/* Page content */}
            <div className="login-container auth-content">
                <div className="login-content">

                    <div className="left-panel">
                        <div className="brand-container">
                            <div className="headline">
                                Your <span className="highlight-movies">movies</span>.<br />
                                Your <span className="highlight-mind">mind</span>.<br />
                                One <span className="highlight-vision">vision</span>.
                            </div>

                            <div className="experience-line">
                                Experience <span className="highlight-vision">CineVision</span>.
                            </div>

                            <div className="eye-container">
                                <img
                                    src={isBlinking ? '/eye-closed.svg' : '/eye-open.svg'}
                                    alt="CineVision Eye"
                                    className="logo-eye"
                                />
                            </div>

                            <div className="tagline">Engage your senses.</div>
                        </div>
                    </div>

                    <div className="right-panel">
                        <div className="form-container">
                            <div className="form-header">
                                <h1 className="brand-title">CineVision</h1>
                                <h2 className="login-title">Welcome back</h2>
                                <p className="login-subtitle">
                                    Sign in to continue your cinematic journey
                                </p>
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <form className="login-form" onSubmit={handleSubmit}>
                                <div className="input-group">
                                    <div className="input-icon"><FaEnvelope /></div>
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        className="input-field"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <div className="input-icon"><FaLock /></div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Password"
                                        className="input-field"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>

                                <div className="form-options">
                                    <label className="remember-me">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={() => setRememberMe(!rememberMe)}
                                        />
                                        <span className="checkmark"></span>
                                        Remember me
                                    </label>

                                    {/* Hook up the forgot password link to our dedicated page */}
                                    <Link to="/forgot" className="forgot-password">Forgot password?</Link>
                                </div>

                                <button
                                    className={`login-button ${isLoading ? 'loading' : ''}`}
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <div className="spinner"></div> : 'Sign In'}
                                </button>

                                <div className="divider">
                                    <span>or continue with</span>
                                </div>

                                <div className="social-login">
                                    <button type="button" className="social-button google">
                                        <FaGoogle className="social-icon" /> Google
                                    </button>
                                    <button type="button" className="social-button apple">
                                        <FaApple className="social-icon" /> Apple
                                    </button>
                                </div>

                                <p className="signup-link">
                                    Don’t have an account? <Link to="/signup">Sign up</Link>
                                </p>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Login;