import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Animations.css";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa"; // npm install react-icons

const Animations = () => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    return (
        <div className="intro-container">
            <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                className="intro-video"
            >
                <source src="/V1.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Mute/Unmute Button */}
            <button className="glass-sound-toggle" onClick={toggleMute}>
                {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>

            {/* Sign In / Sign Up */}
            <div className="intro-buttons">
                <button className="glass-button" onClick={() => navigate("/login")}>
                    Sign In
                </button>
                <button className="glass-button" onClick={() => navigate("/signup")}>
                    Sign Up
                </button>
            </div>
        </div>
    );
};

export default Animations;