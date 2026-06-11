import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import HomeNavbar from '../components/home/HomeNavbar';
import HomeFooter from '../components/home/HomeFooter';
import ShowcaseProfileIframe from '../components/ShowcaseProfileIframe';
import './ShowcaseHero.overrides.css';

export default function ProfessionalShowcase() {
    // Mock preview for general/professional profiles.
    const iframeSrc = `${window.location.origin}/link/mock-professional?mock=1`;

    return (
        <>
            <Helmet>
                <title>Professional Profiles - Nano Profiles</title>
                <meta name="description" content="Share your professional bio, social links, portfolio, and contact details with a single tap. Ideal for creators and professionals." />
            </Helmet>

            <main className="showcase-page">
                <HomeNavbar />

                <section className="showcase-hero">
                    <div className="showcase-hero-inner">
                        <h1 className="showcase-title">Your Profile.<br />One Tap. Shared.</h1>
                        <p className="showcase-subtitle">Bio, links, socials, and contact card — everything your audience and clients need, delivered instantly with a tap.</p>
                        <div className="showcase-cta-row">
                            <Link to="/login" className="showcase-cta-primary">Create Your Profile</Link>
                            <a href="#preview" className="showcase-cta-secondary">See Example ↓</a>
                        </div>
                    </div>
                </section>

                <section className="showcase-features">
                    <div className="showcase-features-grid">
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <h3>Digital Bio</h3>
                            <p>Introduce yourself, your work, and your professional experience in style.</p>
                        </div>
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                            </div>
                            <h3>Social Connections</h3>
                            <p>Connect your LinkedIn, Instagram, X (Twitter), and personal websites together.</p>
                        </div>
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                            </div>
                            <h3>Quick Contact</h3>
                            <p>Let people email, call, or message you directly from your profile page.</p>
                        </div>
                        <div className="showcase-feat-card">
                            <div className="feat-icon-wrap">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
                                    <circle cx="18" cy="5" r="3" />
                                    <circle cx="6" cy="12" r="3" />
                                    <circle cx="18" cy="19" r="3" />
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                </svg>
                            </div>
                            <h3>Easy Sharing</h3>
                            <p>Share your professional credentials instantly with NFC cards or custom URLs.</p>
                        </div>
                    </div>
                </section>

                <section id="preview" className="showcase-preview">
                    <h2 className="showcase-section-title">Example Professional Profile</h2>
                    <div className="showcase-profile-card-pc">
                        <ShowcaseProfileIframe title="Professional Preview" src={iframeSrc} />
                    </div>
                </section>

                <section className="showcase-cta-section">
                    <h2>Go digital with your identity</h2>
                    <p>Create your custom professional profile today.</p>
                    <Link to="/login" className="showcase-cta-primary">Get Started Free</Link>
                </section>

                <HomeFooter />
            </main>
        </>
    );
}
