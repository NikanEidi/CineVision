import React, { useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaLockOpen, FaEye, FaEyeSlash } from 'react-icons/fa';
import './App.css';

function UpdatePassword() {
    // Two fields + a bit of UI niceties
    const [password, setPassword] = useState('');
    const [confirm, setConfirm]   = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError]       = useState('');
    const [message, setMessage]   = useState('');
    const navigate = useNavigate();
    const videoRef = useRef(null);

    useEffect(() => {
        videoRef.current?.play?.().catch(() => {});
    }, []);

    const passwordsMatch = password && confirm ? password === confirm : true;

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!passwordsMatch) {
            setError("Passwords don't match.");
            return;
        }
        if (password.length < 8) {
            // Keep one baseline constraint here for safety; your choice to align with signup rules
            setError('Password must be at least 8 characters.');
            return;
        }

        setIsSaving(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) throw updateError;

            setMessage('Your password has been updated.');
            // Give the user a short beat to read the message, then go to login
            setTimeout(() => navigate('/login'), 1000);
        } catch (err) {
            console.error('Update password error:', err);
            setError(err?.message || 'Could not update password. Please try again.');
        } finally {
            setIsSaving(false);
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
                                <h2 className="signup-title">Set a New Password</h2>
                                <p className="signup-subtitle">Pick something secure you’ll remember</p>
                            </div>

                            {error && <div className="error-message">{error}</div>}
                            {message && <div className="success-message">{message}</div>}

                            <form className="signup-form" onSubmit={handleUpdate}>
                                <div className="input-group">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        placeholder="New Password"
                                        className="input-field"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
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

                                <div className="input-group">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        name="confirm"
                                        placeholder="Confirm New Password"
                                        className="input-field"
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        required
                                        style={{
                                            boxShadow: confirm
                                                ? (passwordsMatch
                                                    ? '0 0 0 2px #10b98122 inset'
                                                    : '0 0 0 2px #ef444422 inset')
                                                : 'none'
                                        }}
                                    />
                                    <div className="input-icon"><FaLockOpen /></div>
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                    >
                                        {showConfirm ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>

                                <button
                                    className={`signup-button ${isSaving ? 'loading' : ''}`}
                                    type="submit"
                                    disabled={isSaving}
                                >
                                    {isSaving ? <div className="spinner"></div> : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UpdatePassword;