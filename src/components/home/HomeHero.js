import React from 'react';
import { Link } from 'react-router-dom';
import Particles from '../../Particles';
import HeroHeadMesh from './HeroHeadMesh';
import './HomeHero.pixel.css';

// SVG Icon Components
const PaletteIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <circle cx="13.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="16" cy="11" r=".5" fill="currentColor" /><circle cx="12" cy="14" r=".5" fill="currentColor" /><circle cx="8" cy="11" r=".5" fill="currentColor" /><path d="M12 21a9 9 0 1 1 0-18c2.45 0 3.5 1 4.5 3 .6 1.2 2.5 2 4.5 2a.5.5 0 0 1 .5.5 8.5 8.5 0 0 1-9.5 12.5z" />
    </svg>
);

const GraduationIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
);

const ChefIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M6 13.8V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v9.8M18 17v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2" /><path d="M9 2v3M12 2v3M15 2v3M9 13.8c0 2.2 4 2.2 4 0v-.8c0-2.2-4-2.2-4 0z" />
    </svg>
);

export default function HomeHero() {
    return (
        <section id="home" className="home-hero-section">
            <div className="hero-particles-bg">
                <Particles
                    particleColors={["#ffffff"]}
                    particleCount={40}
                    particleSpread={10}
                    speed={0.03}
                    particleBaseSize={100}
                    moveParticlesOnHover={false}
                    alphaParticles={true}
                    disableRotation={false}
                    pixelRatio={1}
                />
            </div>

            <div className="hero-content">
                <div className="hero-left">
                    <div className="hero-tagline">
                        <span className="tagline-line"></span>
                        <span className="tagline-text">NFC — ONE TAP IDENTITY</span>
                    </div>

                    <h1 className="hero-title">
                        <span className="title-white">NANO</span>
                        <span className="title-gradient">PROFILES</span>
                    </h1>

                    <p className="hero-description">
                        One NFC chip. Zero friction. Your entire world: artist, student, chef, delivered to any phone the moment they tap.
                    </p>

                    <div className="hero-features-list">
                        <Link to="/artist-showcase" className="hero-feature-item">
                            <div className="feature-icon artist-icon">
                                <PaletteIcon />
                            </div>
                            <div className="feature-info">
                                <h3 className="feature-name">The Artist</h3>
                                <p className="feature-detail">Gallery • Bio • 10 years of micro-sculpture</p>
                            </div>
                            <span className="feature-arrow">→</span>
                        </Link>

                        <Link to="/student-showcase" className="hero-feature-item">
                            <div className="feature-icon student-icon">
                                <GraduationIcon />
                            </div>
                            <div className="feature-info">
                                <h3 className="feature-name">The Student</h3>
                                <p className="feature-detail">Portfolio • Skills • Achievements</p>
                            </div>
                            <span className="feature-arrow">→</span>
                        </Link>

                         <Link to="/restaurant-showcase" className="hero-feature-item">
                            <div className="feature-icon chef-icon">
                                <ChefIcon />
                            </div>
                            <div className="feature-info">
                                <h3 className="feature-name">The Chef</h3>
                                <p className="feature-detail">Menu • Story • Reserve a table</p>
                            </div>
                            <span className="feature-arrow">→</span>
                        </Link>
                    </div>
                </div>

                <div className="hero-right">
                    <div className="hero-interactive-profile">
                        <div className="profile-orbit">
                            <div className="orbit-ring ring-1"></div>
                            <div className="orbit-ring ring-2"></div>
                            <div className="orbit-ring ring-3"></div>
                            <div className="profile-center hero-3d-center">
                                <HeroHeadMesh />
                            </div>

                            {/* Decorative dots in orbit */}
                            <div className="orbit-dot dot-1"></div>
                            <div className="orbit-dot dot-2"></div>
                            <div className="orbit-dot dot-3"></div>
                            <div className="orbit-dot dot-4"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background glow decoration */}
            <div className="hero-glow-blob"></div>
        </section>
    );
}

