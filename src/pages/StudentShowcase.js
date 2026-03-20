import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import HomeNavbar from '../components/home/HomeNavbar';
import HomeFooter from '../components/home/HomeFooter';
 

export default function StudentShowcase() {
    const nfcFrontend = process.env.REACT_APP_NFC_FRONTEND_URL ||
        (['localhost', '127.0.0.1'].includes(window.location.hostname)
            ? `http://${window.location.hostname}:5173`
            : window.location.origin);
    // Mock preview (no dependency on the profiles you created).
    const iframeSrc = `${nfcFrontend}/student?id=mock-student&mock=1`;

    return (
        <>
            <Helmet>
                <title>Student Profiles - Nano Profiles</title>
                <meta name="description" content="Digital student ID cards powered by NFC. Share your portfolio, skills, and achievements with a single tap." />
            </Helmet>

            <main className="showcase-page">
                <HomeNavbar />

                <section className="showcase-hero">
                    <div className="showcase-hero-inner">
                        <span className="showcase-badge">FOR STUDENTS</span>
                        <h1 className="showcase-title">Your Identity.<br />Always With You.</h1>
                        <p className="showcase-subtitle">Digital ID, portfolio, skills, and achievements — everything in one NFC-powered profile card.</p>
                        <div className="showcase-cta-row">
                            <Link to="/login" className="showcase-cta-primary">Create Your Profile</Link>
                            <a href="#preview" className="showcase-cta-secondary">See Example ↓</a>
                        </div>
                    </div>
                </section>

                <section className="showcase-features">
                    <div className="showcase-features-grid">
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/></svg></div>
                            <h3>Digital ID</h3>
                            <p>Your student identity card, always accessible from any phone with a tap.</p>
                        </div>
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
                            <h3>Portfolio</h3>
                            <p>Showcase your projects, research papers, and creative work beautifully.</p>
                        </div>
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></div>
                            <h3>Skills & Certs</h3>
                            <p>List your technical skills, certifications, and competencies.</p>
                        </div>
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C6 4 6 7 6 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C18 4 18 7 18 7"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></div>
                            <h3>Achievements</h3>
                            <p>Highlight hackathon wins, publications, and academic honors.</p>
                        </div>
                    </div>
                </section>

                <section id="preview" className="showcase-preview">
                    <h2 className="showcase-section-title">Example Student Profile</h2>
                    <div className="showcase-profile-card-pc">
                        <iframe
                            title="Student Preview"
                            src={iframeSrc}
                            className="showcase-profile-iframe"
                        />
                    </div>
                </section>

                <section className="showcase-cta-section">
                    <h2>Stand out from the crowd</h2>
                    <p>Create your digital student profile in minutes.</p>
                    <Link to="/login" className="showcase-cta-primary">Get Started Free</Link>
                </section>

                <HomeFooter />
            </main>
        </>
    );
}

