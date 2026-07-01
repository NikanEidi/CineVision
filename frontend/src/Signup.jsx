import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import './styles/index.css';
import { FaUser, FaEnvelope, FaLock, FaLockOpen, FaEye, FaEyeSlash, FaGoogle, FaApple } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

function SignUp() {
    const [isBlinking, setIsBlinking] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // Score 0-100, mapped to a label/color by getPasswordStrengthInfo below.
    const [passwordStrength, setPasswordStrength] = useState(0);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const videoRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 150);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const pw = formData.password || '';
        let strength = 0;

        if (pw.length > 0) strength += 20;
        if (pw.length >= 8) strength += 20;
        if (/[A-Z]/.test(pw)) strength += 20;
        if (/[0-9]/.test(pw)) strength += 20;
        if (/[^A-Za-z0-9]/.test(pw)) strength += 20;

        setPasswordStrength(strength);
    }, [formData.password]);

    // Best-effort autoplay; some browsers block it without user interaction.
    useEffect(() => {
        videoRef.current?.play?.().catch(() => { });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const getPasswordStrengthInfo = () => {
        if (passwordStrength === 0) return { label: '', color: '#9ca3af' };
        if (passwordStrength <= 40) return { label: 'Weak', color: '#ef4444' };
        if (passwordStrength <= 60) return { label: 'Fair', color: '#f59e0b' };
        if (passwordStrength <= 80) return { label: 'Strong', color: '#10b981' };
        return { label: 'Very strong', color: '#22c55e' };
    };
    const strengthInfo = getPasswordStrengthInfo();

    // Only flag a mismatch once the confirm field has input.
    const passwordsMatch = formData.password && formData.confirmPassword
        ? formData.password === formData.confirmPassword
        : true;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!passwordsMatch) {
            setError("Passwords don't match.");
            return;
        }
        if (passwordStrength < 60) {
            setError("Password is too weak. Please make it stronger.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: { username: formData.username },
                    // Set a URL here to enable an email confirmation redirect.
                    emailRedirectTo: null
                }
            });

            if (signUpError) throw signUpError;

            // No email verification step yet; go straight to the dashboard.
            navigate('/dashBoard');
        } catch (err) {
            console.error('Signup error:', err);
            setError(err?.message || 'Signup failed. Please try again.');
        } finally {
            setIsSubmitting(false);
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

            {/* Page content above video */}
            <div className="signup-container auth-content">
                <div className="signup-content">
                    {/* Left hero panel */}
                    <div className="left-panel">
                        <div className="brand-container">
                            <div className="headline">
                                Your <span className="highlight-movies">movies</span>.<br />
                                Your <span className="highlight-mind">mind</span>.<br />
                                One <span className="highlight-vision">vision</span>.
                            </div>

                            <div className="eye-container">
                                <img
                                    src={isBlinking ? '/eye-closed.svg' : '/eye-open.svg'}
                                    alt="CineVision Eye Logo"
                                    className="logo-eye"
                                />
                                <div className="eye-reflection"></div>
                            </div>

                            <div className="experience-line">
                                Join <span className="highlight-vision">CineVision</span> today.
                            </div>

                            <div className="tagline">Where movies meet imagination.</div>
                        </div>

                        <div className="corner-design">
                            <div className="corner-line corner-top"></div>
                            <div className="corner-line corner-right"></div>
                        </div>
                    </div>

                    {/* Right form panel */}
                    <div className="right-panel">
                        <div
                            className="form-container"
                            style={{ '--strength-color': strengthInfo.color }}
                        >
                            <div className="form-header">
                                <h1 className="brand-title">CineVision</h1>
                                <h2 className="signup-title">Create Account</h2>
                                <p className="signup-subtitle">Start your cinematic journey with us</p>
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <form className="signup-form" onSubmit={handleSubmit}>
                                {/* Username */}
                                <div className="input-group">
                                    <input
                                        type="text"
                                        name="username"
                                        placeholder="Full Name"
                                        className="input-field"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                    />
                                    <div className="input-icon"><FaUser /></div>
                                </div>

                                {/* Email */}
                                <div className="input-group">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email address"
                                        className="input-field"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    <div className="input-icon"><FaEnvelope /></div>
                                </div>

                                {/* Password */}
                                <div className="input-group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Password"
                                        className="input-field"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        aria-describedby="password-strength-text"
                                        style={{
                                            boxShadow: formData.password
                                                ? `0 0 0 2px ${strengthInfo.color}22 inset`
                                                : 'none'
                                        }}
                                    />
                                    <div className="input-icon"><FaLock /></div>
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>

                                {/* Strength meter + dynamic label */}
                                <div className="password-strength">
                                    <div
                                        className="strength-meter"
                                        style={{
                                            width: `${passwordStrength}%`,
                                            backgroundColor: strengthInfo.color
                                        }}
                                    />
                                    <div className="strength-labels">
                                        <span id="password-strength-text" aria-live="polite">
                                            { }
                                        </span>
                                        <span className="strength-percent">

                                        </span>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="input-group">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder="Confirm Password"
                                        className="input-field"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        style={{
                                            boxShadow: formData.confirmPassword
                                                ? (passwordsMatch
                                                    ? '0 0 0 2px #10b98122 inset'
                                                    : '0 0 0 2px #ef444422 inset'
                                                )
                                                : 'none'
                                        }}
                                    />
                                    <div className="input-icon"><FaLockOpen /></div>
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>

                                <button
                                    className={`signup-button ${isSubmitting ? 'loading' : ''}`}
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <div className="spinner"></div> : 'Create Account'}
                                </button>

                                <div className="divider">
                                    <span>or sign up with</span>
                                </div>

                                <div className="social-login">
                                    <button type="button" className="social-button google">
                                        <span className="social-icon"><FaGoogle /></span> Google
                                    </button>
                                    <button type="button" className="social-button apple">
                                        <span className="social-icon"><FaApple /></span> Apple
                                    </button>
                                </div>

                                <p className="login-link">
                                    Already have an account? <Link to="/login">Sign in</Link>
                                </p>

                                <p className="login-link" style={{ marginTop: 8 }}>
                                    Forgot your password? <Link to="/forgot">Reset it</Link>
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignUp;