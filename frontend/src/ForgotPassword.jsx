import React, { useState, useRef, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import './App.css';

function ForgotPassword() {
    // Keeping it dead simple: one field + one message
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const videoRef = useRef(null);

    useEffect(() => {
        videoRef.current?.play?.().catch(() => {});
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsSending(true);

        try {
            const redirectTo = `${window.location.origin}/update-password`;

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo
            });

            if (resetError) throw resetError;

            setMessage('If an account exists for this email, a reset link has been sent.');
        } catch (err) {
            console.error('Reset email error:', err);
            // Don't leak too much info; keep it friendly and generic
            setError('Could not send reset email. Please try again later.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="auth-bg">
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

            <div className="signup-container auth-content">
                <div className="signup-content">
                    <div className="right-panel" style={{ margin: '0 auto' }}>
                        <div className="form-container">
                            <div className="form-header">
                                <h2 className="signup-title">Reset Password</h2>
                                <p className="signup-subtitle">Enter your email and we’ll send you a reset link</p>
                            </div>

                            {error && <div className="error-message">{error}</div>}
                            {message && <div className="success-message">{message}</div>}

                            <form className="signup-form" onSubmit={handleSend}>
                                <div className="input-group">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email address"
                                        className="input-field"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    className={`signup-button ${isSending ? 'loading' : ''}`}
                                    type="submit"
                                    disabled={isSending}
                                >
                                    {isSending ? <div className="spinner"></div> : 'Send Reset Link'}
                                </button>

                                <p className="login-link" style={{ marginTop: 8 }}>
                                    <Link to="/login">Back to sign in</Link>
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;