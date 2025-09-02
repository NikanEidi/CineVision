import React from "react";
import "./Footer.css";

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-overlay" />

            <div className="footer-content">
                <p className="footer-text">
                    © {new Date().getFullYear()} CineVision — Built by{" "}
                    <span className="highlight">Nikan Eidi</span>
                </p>

                <div className="tmdb-attribution">
                    <a
                        href="https://www.themoviedb.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tmdb-link"
                    >
                        <img
                            src="/tmdb_logo.svg"
                            alt="TMDB Logo"
                            className="tmdb-logo"
                        />
                        <span>Powered by TMDB</span>
                    </a>
                    <p className="tmdb-note">
                        This product uses the TMDB API but is not endorsed or certified by TMDB.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
