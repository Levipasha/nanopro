import './App.css';
import Particles from './Particles';
import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { API_URL } from './services/api';
import gsap from 'gsap';
import Profile from './pages/Profile';
import GeneralProfileView from './pages/GeneralProfileView';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import nanoProfileVideo from './nano profile.mp4';
import digitalIdVideo from './digital id scan and check my info.mp4';
import corporateVideo from './Blue and White Corporate Entrepreneurs\' Day Your Story (1).mp4';
import nanoProfileAvatar from './NANO PROfile.png';
import customIntegrationImage from './ChatGPT Image Feb 26, 2026, 10_40_38 AM.png';
import SchoolBadge3D from './SchoolBadge3D';
import RestaurantBadge3D from './RestaurantBadge3D';
import ArtistBadge3D from './ArtistBadge3D';
import ProfileCard from './ProfileCard';

function App() {
  const galleryRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNfcPopup, setShowNfcPopup] = useState(false);
  const [showDigitalIdPopup, setShowDigitalIdPopup] = useState(false);
  const [showSmartBadgePopup, setShowSmartBadgePopup] = useState(false);
  const [showCustomIntegrationPopup, setShowCustomIntegrationPopup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    try {
      const base = API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
      const response = await fetch(`${base}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Thank you, ${name}! Your message has been sent successfully.`);
        e.target.reset();
      } else {
        alert(`Error: ${data.error || 'Failed to send message. Please try again.'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send message. Please check your connection and try again.');
    }
  };

  const location = useLocation();
  const isGalleryRoute = !['/profile', '/link'].some(p => location.pathname.startsWith(p));

  useEffect(() => {
    if (!isGalleryRoute) return;

    gsap.registerPlugin(ScrollTrigger);

    const galleryEl = galleryRef.current;
    if (!galleryEl) return;

    const sections = ['#home', '#about', '#products', '#services', '#contact'];

    // Defer setup to ensure DOM/layout is ready (helps with Strict Mode and route transitions)
    let ctx = null;
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!galleryRef.current) return;

    ctx = gsap.context(() => {
      const el = galleryRef.current;
      if (!el) return;
      gsap.to(el.querySelectorAll('img, video'), { opacity: 1, delay: 0.1 });

      const spacing = 0.1;
      const snap = gsap.utils.snap(spacing);
      const cards = gsap.utils.toArray('.cards li', el);
      if (!cards.length) return;

      const buildSeamlessLoop = (items, itemSpacing) => {
        const overlap = Math.ceil(1 / itemSpacing);
        const startTime = items.length * itemSpacing + 0.5;
        const loopTime = (items.length + overlap) * itemSpacing + 1;
        const rawSequence = gsap.timeline({ paused: true });
        const loop = gsap.timeline({
          paused: true,
          repeat: -1,
          onRepeat() {
            this._time === this._dur && (this._tTime += this._dur - 0.01);
          }
        });
        const l = items.length + overlap * 2;
        let time = 0;

        gsap.set(items, { xPercent: 400, opacity: 0, scale: 0 });

        for (let i = 0; i < l; i++) {
          const index = i % items.length;
          const item = items[index];
          time = i * itemSpacing;

          rawSequence
            .fromTo(
              item,
              { scale: 0, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                zIndex: 100,
                duration: 0.5,
                yoyo: true,
                repeat: 1,
                ease: 'power1.in',
                immediateRender: false
              },
              time
            )
            .fromTo(
              item,
              { xPercent: 400 },
              { xPercent: -400, duration: 1, ease: 'none', immediateRender: false },
              time
            );

          i <= items.length && loop.add('label' + i, time);
        }

        rawSequence.time(startTime);
        loop
          .to(rawSequence, {
            time: loopTime,
            duration: loopTime - startTime,
            ease: 'none'
          })
          .fromTo(
            rawSequence,
            { time: overlap * itemSpacing + 1 },
            {
              time: startTime,
              duration: startTime - (overlap * itemSpacing + 1),
              immediateRender: false,
              ease: 'none'
            }
          );

        return loop;
      };

      const seamlessLoop = buildSeamlessLoop(cards, spacing);
      const loopDuration = seamlessLoop.duration();
      const scrub = gsap.to(seamlessLoop, {
        totalTime: 0,
        duration: 0.5,
        ease: 'power3',
        paused: true
      });

      const trigger = ScrollTrigger.create({
        start: 'top top',
        end: '+=3000',
        pin: '.gallery',
        onUpdate(self) {
          scrub.vars.totalTime = snap(self.progress * loopDuration);
          scrub.invalidate().restart();
        }
      });

      ScrollTrigger.refresh();

      const scrubTo = totalTime => {
        const wrapped = ((totalTime % loopDuration) + loopDuration) % loopDuration;
        const progress = wrapped / loopDuration;
        trigger.scroll(trigger.start + progress * (trigger.end - trigger.start));
      };

      const nextBtn = el.querySelector('.next');
      const prevBtn = el.querySelector('.prev');
      const onNext = () => scrubTo(scrub.vars.totalTime + spacing);
      const onPrev = () => scrubTo(scrub.vars.totalTime - spacing);

      nextBtn?.addEventListener('click', onNext);
      prevBtn?.addEventListener('click', onPrev);

      return () => {
        nextBtn?.removeEventListener('click', onNext);
        prevBtn?.removeEventListener('click', onPrev);
        trigger.kill();
        scrub.kill();
        seamlessLoop.kill();
      };
    }, galleryEl);

    // Navbar active states outside context
    setTimeout(() => {
      const navLinks = gsap.utils.toArray('.navbar-links a');

      sections.forEach((sectionId, index) => {
        ScrollTrigger.create({
          trigger: sectionId,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => {
            navLinks.forEach(link => link.classList.remove('active'));
            navLinks[index]?.classList.add('active');
          },
          onEnterBack: () => {
            navLinks.forEach(link => link.classList.remove('active'));
            navLinks[index]?.classList.add('active');
          },
          onLeave: () => {
            if (index === sections.length - 1) return; // Don't remove active on last section leave
            navLinks[index]?.classList.remove('active');
          },
          onLeaveBack: () => {
            if (index === 0) return; // Don't remove active on first section leave back
            navLinks[index]?.classList.remove('active');
          }
        });
      });
    }, 100);

      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (ctx) ctx.revert();
      // Kill navbar triggers
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.trigger && sections.includes(trigger.vars.trigger)) {
          trigger.kill();
        }
      });
    };
  }, [isGalleryRoute]);

  const isProfile = location.pathname === '/profile';

  return (
    <div>
      <Helmet>
        <title>{isProfile ? 'Profile | Nano Profiles' : 'Nano Profiles - Smart Digital Identity Solutions'}</title>
        <meta name="description" content={isProfile ? 'Manage your artist profiles and NFC settings.' : 'NFC digital identity for schools, restaurants, and artists. Tap to get menu and bills, student ID cards, artist portfolios. Contactless and secure. Just tap to trust.'} />
        {!isProfile && (
          <>
            <meta property="og:title" content="Nano Profiles - Smart Digital Identity Solutions" />
            <meta property="og:description" content="NFC digital identity for schools, restaurants, and artists. Tap to get menu and bills, student ID cards, artist portfolios. Just tap to trust." />
            <meta property="og:url" content="https://nanoprofiles.com/" />
            <meta name="twitter:title" content="Nano Profiles - Smart Digital Identity Solutions" />
            <meta name="twitter:description" content="NFC digital identity for schools, restaurants, and artists. Tap to get menu and bills. Just tap to trust." />
          </>
        )}
        {isProfile && <meta name="robots" content="noindex, follow" />}
      </Helmet>
      <Routes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/link/:username" element={<GeneralProfileView />} />
        <Route path="/*" element={
          <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link className="navbar-brand" to="/">
            <span className="navbar-brandText">Nano Profiles</span>
          </Link>
          <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
            <a href="#products" onClick={() => setMobileMenuOpen(false)}>Products</a>
            <a href="#services" onClick={() => setMobileMenuOpen(false)}>Services</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
          </div>
          <button className={`hamburger-menu ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <section id="home" className="page-section" style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
          <Particles
            particleColors={["#ffffff"]}
            particleCount={50}
            particleSpread={8}
            speed={0.05}
            particleBaseSize={80}
            moveParticlesOnHover={false}
            alphaParticles={false}
            disableRotation={false}
            pixelRatio={1}
          />
        </div>
        <div className="stuck-grid" style={{ position: 'relative', zIndex: 1 }}>
          <div className="grid-item special"><b>Nano Profiles</b></div>
          <div className="grid-item">ID Card</div>
          <div className="grid-item">NFC Technology</div>
          <div className="grid-item">Data Security</div>
          <div className="grid-item">Biometric Access</div>
          <div className="grid-item">Digital Identity</div>
          <div className="grid-item">Smart Authentication</div>
          <div className="grid-item">Encryption</div>
          <div className="grid-item">Secure Storage</div>
          <div className="grid-item">Privacy Protection</div>
          <div className="grid-item">Cloud Sync</div>
          <div className="grid-item">Mobile Access</div>
        </div>
      </section>

      <section className="gallery page-section" ref={galleryRef}>
        <ul className="cards">
          <li>
            <video
              src={nanoProfileVideo}
              muted
              autoPlay
              loop
              playsInline
            />
          </li>
          <li>
            <video
              src={digitalIdVideo}
              muted
              autoPlay
              loop
              playsInline
            />
          </li>
          <li>
            <video
              src={corporateVideo}
              muted
              autoPlay
              loop
              playsInline
            />
          </li>
          {/* Repeat videos to make the loop feel richer */}
          <li>
            <video
              src={nanoProfileVideo}
              muted
              autoPlay
              loop
              playsInline
            />
          </li>
          <li>
            <video
              src={digitalIdVideo}
              muted
              autoPlay
              loop
              playsInline
            />
          </li>
          <li>
            <video
              src={corporateVideo}
              muted
              autoPlay
              loop
              playsInline
            />
          </li>
        </ul>
      </section>

      <section id="about" className="info-section page-section">
        <div className="info-inner">
          <h2>The Badge</h2>
          <p className="about-badge-lead">
            Tap an NFC badge and instantly view a secure digital profile—no app install, no typing. Our smart badges
            and digital ID cards replace paper and plastic with a single tap. Fast, reliable, and contactless:
            ideal for schools, offices, events, and enterprises. One tap to verify identity, share contact details,
            or open a portfolio.
          </p>
          <div className="about-us-sub">
            <h3>About Us</h3>
            <p>
              We are a professional technology company specializing in NFC-based digital ID cards and smart badges
              for modern businesses. Designed for enterprises, institutions, and large organizations, our system
              delivers a smarter, more secure way to manage identity and access. We focus on innovation, scalability,
              and enterprise-grade reliability to help you move toward a fully digital, future-ready identity system.
            </p>
          </div>
        </div>
      </section>

      <section id="digital-id" className="info-section page-section">
        <div className="info-inner">
          <h2>Digital ID of You</h2>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
            <ProfileCard
              name="Your Digital ID"
              title="Secure, Smart Identity"
              handle="nanoprofiles"
              status="Tap to view"
              contactText="View Profile"
              avatarUrl={nanoProfileAvatar}
              showUserInfo={false}
              enableTilt={true}
              enableMobileTilt={false}
              behindGlowColor="rgba(125, 190, 255, 0.67)"
              iconUrl="/assets/demo/iconpattern.png"
              behindGlowEnabled
              innerGradient="linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)"
            />
          </div>
        </div>
      </section>

      <section id="products" className="info-section page-section">
        <div className="info-inner">
          <h2>Our Products</h2>
          <div className="products-grid">
            <div className="product-card product-card-artist product-card-no-flip">
              <div className="product-card-inner">
                <div className="product-card-front">
                  <div className="product-cover artist-cover">
                    <ArtistBadge3D />
                  </div>
                  <h3>Artist</h3>
                  <p>Creative portfolios on NFC tags</p>
                </div>
              </div>
            </div>
            <div className="product-card">
              <div className="product-card-inner">
                <div className="product-card-front">
                  <div className="product-cover school-cover">
                    <SchoolBadge3D />
                  </div>
                  <h3>School</h3>
                  <p>Digital ID cards for students and staff</p>
                </div>
                <div className="product-card-back">
                  <h3>Why Better?</h3>
                  <p>Instant verification, no physical wear, eco-friendly, integrated with school systems for seamless access.</p>
                </div>
              </div>
            </div>
            <div className="product-card">
              <div className="product-card-inner">
                <div className="product-card-front">
                  <div className="product-cover office-cover">
                    <RestaurantBadge3D />
                  </div>
                  <h3>Restaurant</h3>
                  <p>Tap to get menu and bills</p>
                </div>
                <div className="product-card-back">
                  <h3>Why Better?</h3>
                  <p>Tap to get menu and bills—contactless ordering, instant menu access, quick payment. No waiting, no paper.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="info-section page-section">
        <div className="info-inner">
          <h2>Our Services</h2>
          <div className="services-grid">
            <div className="service-card" onClick={() => setShowNfcPopup(true)}>
              <div className="service-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M7 15h.01"/><path d="M12 15h.01"/></svg>
              </div>
              <h3>NFC Profile Cards</h3>
              <p>Tap-to-share profiles with secure data controls and clean design.</p>
            </div>
            <div className="service-card" onClick={() => setShowDigitalIdPopup(true)}>
              <div className="service-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>Digital ID & Verification</h3>
              <p>Identity scanning flows with encryption-ready storage patterns.</p>
            </div>
            <div className="service-card" onClick={() => setShowSmartBadgePopup(true)}>
              <div className="service-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
              <h3>Smart Badges</h3>
              <p>Scan the badge to instantly view and verify your profile in real time.</p>
            </div>
            <div className="service-card" onClick={() => setShowCustomIntegrationPopup(true)}>
              <div className="service-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <h3>Custom Integrations</h3>
              <p>Connect profiles with mobile apps, cloud sync, and business systems.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="contact page-section">
        <div className="contact-hero">
          <h2>Get In Touch</h2>
          <p>We’d love to hear from you. Let’s start a conversation!</p>
        </div>

        <div className="contact-cards">
          <a className="contact-card" href="mailto:hello@nanoprofiles.com">
            <div className="contact-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div className="contact-title">Email Us</div>
            <div className="contact-sub">Send us an email anytime</div>
            <div className="contact-value">hello@nanoprofiles.com</div>
          </a>

          <a className="contact-card" href="tel:+919121428210">
            <div className="contact-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <div className="contact-title">Call Us</div>
            <div className="contact-sub">Mon–Fri from 9am to 6pm</div>
            <div className="contact-value">+91 91214 28210</div>
          </a>

          <a className="contact-card" href="#contact" onClick={(e) => e.preventDefault()}>
            <div className="contact-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div className="contact-title">Visit Us</div>
            <div className="contact-sub">Come say hello</div>
            <div className="contact-value">Hyderabad, India</div>
          </a>

          <a className="contact-card" href="https://instagram.com" target="_blank" rel="noreferrer">
            <div className="contact-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </div>
            <div className="contact-title">Follow Us</div>
            <div className="contact-sub">Stay updated with our latest</div>
            <div className="contact-value">@nanoprofiles</div>
          </a>

          <a className="contact-card" href="https://wa.me/919121428210" target="_blank" rel="noreferrer">
            <div className="contact-icon contact-icon-whatsapp" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <div className="contact-title">WhatsApp Us</div>
            <div className="contact-sub">Chat with us directly</div>
            <div className="contact-value">Message Us</div>
          </a>
        </div>

        <div className="contact-form-container">
          <div className="contact-form">
            <h3>Send us a Message</h3>
            <form onSubmit={handleSubmit}>
              <input name="name" type="text" placeholder="Your Name" required />
              <input name="email" type="email" placeholder="Your Email" required />
              <textarea name="message" placeholder="Your Message" required></textarea>
              <button type="submit">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-brandText">Nano Profiles</div>
            <p>Smart digital identity solutions with NFC technology</p>
            <div className="footer-quote">Just tap to trust</div>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <a href="#contact">Contact</a>
            <Link to="/profile">Profile</Link>
          </div>

          <div className="footer-contact">
            <h4>Get In Touch</h4>
            <p>hello@nanoprofiles.com</p>
            <p>+91 91214 28210</p>
          </div>

          <div className="footer-social">
            <h4>Follow Us</h4>
            <a href="https://instagram.com/nanoprofiles" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://wa.me/919121428210" target="_blank" rel="noreferrer">WhatsApp</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Nano Profiles. All rights reserved. A product of <a href="https://www.skywebdev.xyz" target="_blank" rel="noreferrer">Skyweb IT Solutions Pvt Ltd</a></p>
        </div>
      </footer>

      {/* NFC Profile Popup */}
      {showNfcPopup && (
        <div className="popup-overlay" onClick={() => setShowNfcPopup(false)}>
          <div className="popup-content">
            <div className="popup-image">
              <img src="https://expondigital.ae/assets/images/resources/nfc-digital-card.png" alt="NFC Profile Cards" />
            </div>
            <div className="popup-text">
              <h3>NFC Profile Cards</h3>
              <p>NFC Profile is a smart digital identity system that instantly displays a user's verified profile when an NFC card or tag is tapped on a device. It securely presents key details such as name, class/role, contact information, blood group, and more in a clean, professional interface. Ideal for schools, colleges, enterprises, and events, it replaces traditional ID cards with a fast, secure, and modern tap-to-verify solution.</p>
              <div className="popup-features">
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                  <span>Secure, real-time profile access via NFC tap</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg></span>
                  <span>Digital ID card replacement</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></span>
                  <span>Instant verification for organizations</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg></span>
                  <span>Mobile-friendly, responsive profile view</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg></span>
                  <span>Cloud-based, easy profile updates</span>
                </div>
              </div>
              <p className="tagline">Just Tap & Verify.</p>
              <button className="popup-close" onClick={() => setShowNfcPopup(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital ID & Verification Popup */}
      {showDigitalIdPopup && (
        <div className="popup-overlay" onClick={() => setShowDigitalIdPopup(false)}>
          <div className="popup-content">
            <div className="popup-image">
              <img src="https://www.shutterstock.com/image-photo/digital-identification-concept-electronic-id-600nw-2552860339.jpg" alt="Digital ID & Verification" />
            </div>
            <div className="popup-text">
              <h3>Digital ID & Verification</h3>
              <p>Advanced digital identity verification system that provides secure, instant authentication through multiple verification methods. Our solution combines cutting-edge encryption with user-friendly interfaces to deliver reliable identity verification for modern organizations.</p>
              <div className="popup-features">
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                  <span>Multi-layer security encryption</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></span>
                  <span>Instant identity verification</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></span>
                  <span>Real-time authentication tracking</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>
                  <span>Cross-platform compatibility</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
                  <span>Fraud detection & prevention</span>
                </div>
              </div>
              <p className="tagline">Secure Identity, Instant Access.</p>
              <button className="popup-close" onClick={() => setShowDigitalIdPopup(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Badges Popup */}
      {showSmartBadgePopup && (
        <div className="popup-overlay" onClick={() => setShowSmartBadgePopup(false)}>
          <div className="popup-content">
            <div className="popup-image">
              <img src="https://i.etsystatic.com/14793044/r/il/5a1578/5745450374/il_570xN.5745450374_qzk9.jpg" alt="Smart Badges" />
            </div>
            <div className="popup-text">
              <h3>Smart Badges</h3>
              <p>Revolutionary smart badge system that enables instant profile verification and access control through advanced NFC technology. Perfect for corporate environments, events, and secure facilities requiring real-time identity verification.</p>
              <div className="popup-features">
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>
                  <span>Instant profile scanning</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg></span>
                  <span>Access control integration</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
                  <span>Multi-factor authentication</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></span>
                  <span>Analytics dashboard</span>
                </div>
              </div>
              <p className="tagline">Smart Access, Secure Entry.</p>
              <button className="popup-close" onClick={() => setShowSmartBadgePopup(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Integrations Popup */}
      {showCustomIntegrationPopup && (
        <div className="popup-overlay" onClick={() => setShowCustomIntegrationPopup(false)}>
          <div className="popup-content">
            <div className="popup-image">
              <img src={customIntegrationImage} alt="Custom Integrations" />
            </div>
            <div className="popup-text">
              <h3>Custom Integrations</h3>
              <p>Seamless integration solutions that connect your digital identity system with existing business applications, mobile platforms, and enterprise workflows. Our flexible API and development tools enable custom solutions tailored to your specific organizational needs.</p>
              <div className="popup-features">
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
                  <span>API integration capabilities</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg></span>
                  <span>Mobile app development</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg></span>
                  <span>Cloud synchronization</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg></span>
                  <span>Enterprise system connectivity</span>
                </div>
                <div className="feature">
                  <span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
                  <span>Custom workflow automation</span>
                </div>
              </div>
              <p className="tagline">Integrated Solutions, Seamless Operations.</p>
              <button className="popup-close" onClick={() => setShowCustomIntegrationPopup(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
          </>
        }
      />
      </Routes>
    </div>
  );
}

export default App;
