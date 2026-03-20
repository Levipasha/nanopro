import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import HomeNavbar from '../components/home/HomeNavbar';
import HomeFooter from '../components/home/HomeFooter';
 

export default function ArtistShowcase() {
    const nfcFrontend = process.env.REACT_APP_NFC_FRONTEND_URL ||
        (['localhost', '127.0.0.1'].includes(window.location.hostname)
            ? `http://${window.location.hostname}:5173`
            : window.location.origin);

    // Mock preview (no dependency on the profiles you created).
    const iframeSrc = `${nfcFrontend}/artist?id=mock-artist&mock=1`;

    return (
        <>
            <Helmet>
                <title>Artist Profiles - Nano Profiles</title>
                <meta name="description" content="Showcase your art portfolio, gallery, and creative links with a single NFC tap. Built for artists, sculptors, and creators." />
            </Helmet>

            <main className="showcase-page">
                <HomeNavbar />

                <section className="showcase-hero">
                    <div className="showcase-hero-inner">
                        <span className="showcase-badge">FOR ARTISTS</span>
                        <h1 className="showcase-title">Your Art.<br />One Tap Away.</h1>
                        <p className="showcase-subtitle">Gallery, bio, links, and events — everything your audience needs, delivered instantly through NFC.</p>
                        <div className="showcase-cta-row">
                            <Link to="/login" className="showcase-cta-primary">Create Your Profile</Link>
                            <a href="#preview" className="showcase-cta-secondary">See Example ↓</a>
                        </div>
                    </div>
                </section>

                <section className="showcase-features">
                    <div className="showcase-features-grid">
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>
                            <h3>Art Gallery</h3>
                            <p>Showcase your portfolio with a stunning visual gallery that loads instantly.</p>
                        </div>
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg></div>
                            <h3>Bio & Story</h3>
                            <p>Tell your creative journey with a beautifully formatted personal bio.</p>
                        </div>
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
                            <h3>Social Links</h3>
                            <p>Instagram, YouTube, portfolio — all your links in one beautiful page.</p>
                        </div>
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
                            <h3>Events & Shows</h3>
                            <p>Promote upcoming exhibitions and events right on your profile.</p>
                        </div>
                    </div>
                </section>

                <section id="preview" className="showcase-preview">
                    <h2 className="showcase-section-title">Example Artist Profile</h2>
                    <div className="showcase-profile-card-pc">
                        <iframe
                            title="Artist Preview"
                            src={iframeSrc}
                            className="showcase-profile-iframe"
                        />
                    </div>
                </section>

                <section className="showcase-cta-section">
                    <h2>Ready to share your art?</h2>
                    <p>Create your NFC-powered artist profile in minutes.</p>
                    <Link to="/login" className="showcase-cta-primary">Get Started Free</Link>
                </section>

                <HomeFooter />
            </main>
        </>
    );
}

