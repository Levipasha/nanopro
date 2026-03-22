import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import HomeNavbar from '../components/home/HomeNavbar';
import HomeFooter from '../components/home/HomeFooter';
import ShowcaseProfileIframe from '../components/ShowcaseProfileIframe';
import './ShowcaseHero.overrides.css';

export default function RestaurantShowcase() {
    // Mock preview (no dependency on the profiles you created).
    const iframeSrc = `${window.location.origin}/link/mock-restaurant?mock=1`;

    return (
        <>
            <Helmet>
                <title>Restaurant Profiles - Nano Profiles</title>
                <meta name="description" content="Digital menus, reservations, and restaurant profiles powered by NFC. Customers tap to view your menu, story, and links instantly." />
            </Helmet>

            <main className="showcase-page">
                <HomeNavbar />

                <section className="showcase-hero">
                    <div className="showcase-hero-inner">
                        <h1 className="showcase-title">Your Menu.<br />One Tap. Done.</h1>
                        <p className="showcase-subtitle">Digital menus, reservations, and your restaurant story — delivered to any phone the moment they tap.</p>
                        <div className="showcase-cta-row">
                            <Link to="/login" className="showcase-cta-primary">Create Your Profile</Link>
                            <a href="#preview" className="showcase-cta-secondary">See Example ↓</a>
                        </div>
                    </div>
                </section>

                <section className="showcase-features">
                    <div className="showcase-features-grid">
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M3 2h18v20H3z"/><path d="M7 7h10M7 11h10M7 15h6"/></svg></div>
                            <h3>Digital Menu</h3>
                            <p>Upload your full menu as PDF or create a beautiful digital version.</p>
                        </div>
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
                            <h3>Reservations</h3>
                            <p>Let customers book tables directly from their phone.</p>
                        </div>
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
                            <h3>Your Story</h3>
                            <p>Share your restaurant's journey, philosophy, and what makes you unique.</p>
                        </div>
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                            <h3>Quick Contact</h3>
                            <p>Phone, WhatsApp, and social links all in one tap.</p>
                        </div>
                    </div>
                </section>

                <section id="preview" className="showcase-preview">
                    <h2 className="showcase-section-title">Example Restaurant Profile</h2>
                    <div className="showcase-profile-card-pc">
                        <ShowcaseProfileIframe title="Restaurant Preview" src={iframeSrc} />
                    </div>
                </section>

                <section className="showcase-cta-section">
                    <h2>Go digital with your restaurant</h2>
                    <p>Create your NFC-powered restaurant profile today.</p>
                    <Link to="/login" className="showcase-cta-primary">Get Started Free</Link>
                </section>

                <HomeFooter />
            </main>
        </>
    );
}

