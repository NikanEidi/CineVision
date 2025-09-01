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

                <a
                    href="https://www.themoviedb.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tmdb-link"
                >
                    <img
                        src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-94c2d9b6d38e49f16c8c24e9b6d99e3a4fe26c7e7b4b7cdbaff342a2e262aa5b.png"
                        alt="TMDB"
                        className="tmdb-logo"
                    />
                    <span>Powered by TMDB</span>
                </a>
            </div>
        </footer>
    );
};

export default Footer;