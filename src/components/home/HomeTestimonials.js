import React, { useState, useEffect, useCallback, useRef } from 'react';
import './HomeTestimonials.css';

/* ═══════════════════════════════════════════════
   Pixel-art avatar generator
   12×12 grid · each cell = 8px · total = 96×96
   ═══════════════════════════════════════════════ */
function makePixelAvatar(config) {
  const P = 8; // px per cell
  const parts = [];

  // Draw a rectangle in grid coordinates
  const r = (col, row, w, h, color) => {
    if (!color) return;
    parts.push(
      `<rect x="${col * P}" y="${row * P}" width="${w * P}" height="${h * P}" fill="${color}"/>`
    );
  };

  const {
    bg = '#0f172a',
    skin = '#f2c2a0',
    hair = '#1a0a06',
    shirt = '#3b82f6',
    collar = '#ffffff',
    eye = '#0d0b0a',
    mouth = '#b84050',
    style = 'default', // 'default'|'long'|'bun'|'curly'|'turban'
    glasses = false,
    bindi = false,
    beard = false,
    earring = false,
    accentColor = '#ef4444',
  } = config;

  // ── 1. Background (frame uses accent as border glow via CSS) ──
  r(0, 0, 12, 12, bg);

  // ── 2. Hair ──
  if (style === 'turban') {
    // Turban wraps the head
    r(3, 0, 6, 1, accentColor); // top knot
    r(2, 1, 8, 2, accentColor);
    r(2, 3, 2, 3, accentColor); // side wraps
    r(8, 3, 2, 3, accentColor);
  } else if (style === 'bun') {
    r(4, 0, 4, 1, hair); // bun top
    r(3, 1, 6, 2, hair);
    r(3, 3, 2, 3, hair); // sides (short)
    r(7, 3, 2, 3, hair);
    // hair bun decoration dot
    r(5, 0, 2, 1, accentColor);
  } else if (style === 'long') {
    r(3, 1, 6, 1, hair); // top
    r(2, 2, 8, 1, hair);
    r(2, 3, 2, 6, hair); // long sides flowing down
    r(8, 3, 2, 6, hair);
    r(3, 3, 1, 2, hair);
    r(8, 3, 1, 2, hair);
  } else if (style === 'curly') {
    // Curly / afro-style
    r(3, 1, 6, 2, hair);
    r(2, 2, 2, 2, hair);
    r(8, 2, 2, 2, hair);
    r(2, 3, 2, 4, hair);
    r(8, 3, 2, 4, hair);
    r(3, 1, 1, 1, '#3d2317'); // curly texture highlight
    r(6, 1, 1, 1, '#3d2317');
    r(5, 2, 1, 1, '#3d2317');
  } else {
    // default: short / neat
    r(3, 1, 6, 1, hair);
    r(2, 2, 8, 2, hair);
    r(2, 4, 2, 3, hair); // sides
    r(8, 4, 2, 3, hair);
  }

  // ── 3. Face ──
  r(3, 3, 6, 1, skin); // forehead top row
  r(3, 4, 6, 5, skin); // main face block
  r(2, 5, 1, 3, skin); // left cheek
  r(9, 5, 1, 3, skin); // right cheek

  // ── 4. Eyes ──
  if (glasses) {
    const g = '#64748b';
    // Left glass frame
    r(3, 5, 3, 2, 'rgba(200,230,255,0.25)');
    r(3, 5, 3, 1, g); r(3, 6, 3, 1, g); // top & bottom
    r(3, 5, 1, 2, g); r(5, 5, 1, 2, g); // sides
    // Right glass frame
    r(6, 5, 3, 2, 'rgba(200,230,255,0.25)');
    r(6, 5, 3, 1, g); r(6, 6, 3, 1, g);
    r(6, 5, 1, 2, g); r(8, 5, 1, 2, g);
    // Bridge
    r(5, 6, 1, 1, g);
    // Pupils inside frames
    r(4, 5, 1, 1, eye);
    r(7, 5, 1, 1, eye);
  } else {
    // Normal eyes: white + pupil
    r(3, 5, 2, 2, '#ffffff');
    r(7, 5, 2, 2, '#ffffff');
    r(4, 5, 1, 1, eye); // left pupil
    r(7, 5, 1, 1, eye); // right pupil
    r(3, 4, 2, 1, hair); // eyebrow left
    r(7, 4, 2, 1, hair); // eyebrow right
  }

  // ── 5. Nose ──
  r(5, 7, 2, 1, skin);

  // ── 6. Mouth ──
  r(4, 8, 4, 1, mouth);
  r(5, 9, 2, 1, mouth); // smile curve

  // ── 7. Accessories ──
  if (bindi) {
    r(5, 3, 2, 1, accentColor); // forehead bindi
  }
  if (beard) {
    const b = '#3d2b1f';
    r(3, 8, 6, 1, b);
    r(3, 9, 6, 1, b);
    r(4, 10, 4, 1, b);
  }
  if (earring) {
    r(2, 7, 1, 1, accentColor);
    r(9, 7, 1, 1, accentColor);
  }

  // ── 8. Neck ──
  r(5, 10, 2, 1, skin);

  // ── 9. Shirt + collar ──
  r(3, 11, 6, 1, collar); // collar strip
  r(5, 11, 2, 1, shirt);  // collar V gap
  r(2, 12, 8, 1, shirt);  // shirt (off canvas but clips ok)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg"
    width="96" height="96" viewBox="0 0 96 96"
    shape-rendering="crispEdges">
    ${parts.join('\n    ')}
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/* ═══════════════════════════════════════════════
   Testimonial data — all Indian names
   ═══════════════════════════════════════════════ */
const TESTIMONIALS = [
  {
    id: 1,
    name: 'Aarav Sharma',
    role: 'Founder, BrightCell Labs',
    quote: 'Setup took minutes. Staff tap once and see the right digital profile instantly — no app, no friction whatsoever.',
    accent: '#60a5fa',
    avatar: makePixelAvatar({
      bg: '#0f172a', skin: '#f2c2a0', hair: '#1a0a06', shirt: '#1d4ed8',
      collar: '#93c5fd', style: 'default', glasses: true, accentColor: '#60a5fa',
    }),
  },
  {
    id: 2,
    name: 'Priya Nair',
    role: 'Principal, Greenfield School',
    quote: 'No installation needed. Any phone taps and opens the student profile instantly with a beautifully clean UI.',
    accent: '#34d399',
    avatar: makePixelAvatar({
      bg: '#052e16', skin: '#f1c1a0', hair: '#2d1c14', shirt: '#059669',
      collar: '#a7f3d0', style: 'long', bindi: true, accentColor: '#34d399',
    }),
  },
  {
    id: 3,
    name: 'Riya Gupta',
    role: 'Director, Nano Studio',
    quote: "Our artists' portfolios stay updated. When someone taps they see the latest story without manual sharing.",
    accent: '#c084fc',
    avatar: makePixelAvatar({
      bg: '#1a0333', skin: '#eeb08f', hair: '#21130f', shirt: '#7c3aed',
      collar: '#e9d5ff', style: 'curly', earring: true, accentColor: '#c084fc',
    }),
  },
  {
    id: 4,
    name: 'Arjun Verma',
    role: 'CEO, TapWorks India',
    quote: 'We connect everything with a single chip. Tap to open, show the right profile, and update whenever we need.',
    accent: '#fb923c',
    avatar: makePixelAvatar({
      bg: '#1c0a00', skin: '#f2c3a0', hair: '#3b2a22', shirt: '#c2410c',
      collar: '#fed7aa', style: 'default', beard: true, accentColor: '#fb923c',
    }),
  },
  {
    id: 5,
    name: 'Meera Patel',
    role: 'Operations Head, SecureDeck',
    quote: 'The experience feels secure and modern. Users tap once and get verified details in less than a second.',
    accent: '#38bdf8',
    avatar: makePixelAvatar({
      bg: '#082f49', skin: '#f0b895', hair: '#2f1f17', shirt: '#0369a1',
      collar: '#bae6fd', style: 'bun', bindi: true, accentColor: '#38bdf8',
    }),
  },
  {
    id: 6,
    name: 'Karan Singh',
    role: 'Product Manager, Smart Profiles',
    quote: 'Tap → open profile card → show correct info. Our workflow is dramatically faster with zero friction for users.',
    accent: '#4ade80',
    avatar: makePixelAvatar({
      bg: '#052e16', skin: '#f1c0a0', hair: '#2a1f18', shirt: '#15803d',
      collar: '#bbf7d0', style: 'default', accentColor: '#4ade80',
    }),
  },
  {
    id: 7,
    name: 'Ananya Krishnan',
    role: 'Head Chef, Spice Route Mumbai',
    quote: 'Guests tap once and the digital menu opens beautifully. No paper, no reprinting — perfect for our restaurant.',
    accent: '#f472b6',
    avatar: makePixelAvatar({
      bg: '#3b0a24', skin: '#eabf9a', hair: '#1e1410', shirt: '#9d174d',
      collar: '#fbcfe8', style: 'bun', bindi: true, earring: true, accentColor: '#f472b6',
    }),
  },
  {
    id: 8,
    name: 'Rohan Mehta',
    role: 'Co-Founder, PixelForge',
    quote: "Clients scan the NFC card and land directly on the designer's portfolio. Clean, instant, impressive.",
    accent: '#818cf8',
    avatar: makePixelAvatar({
      bg: '#1e1b4b', skin: '#f3c5a2', hair: '#2e1e16', shirt: '#4338ca',
      collar: '#c7d2fe', style: 'default', glasses: true, accentColor: '#818cf8',
    }),
  },
  {
    id: 9,
    name: 'Divya Reddy',
    role: 'Registrar, Heritage Academy',
    quote: 'Student IDs are now fully digital. Parents tap the card at pickup and instantly verify identity — brilliant.',
    accent: '#fbbf24',
    avatar: makePixelAvatar({
      bg: '#1c1400', skin: '#f0bb97', hair: '#2c1b13', shirt: '#b45309',
      collar: '#fde68a', style: 'long', bindi: true, accentColor: '#fbbf24',
    }),
  },
  {
    id: 10,
    name: 'Vikram Iyer',
    role: 'Event Director, CultureFest',
    quote: 'Artist cards with NFC replaced printed bios. Attendees tap to see full profiles, social links, and artwork.',
    accent: '#f87171',
    avatar: makePixelAvatar({
      bg: '#1c0404', skin: '#f1c3a1', hair: '#331f15', shirt: '#b91c1c',
      collar: '#fecaca', style: 'turban', accentColor: '#f87171',
    }),
  },
];

/* ═══════════════════════════════════════════════
   Star row
   ═══════════════════════════════════════════════ */
function StarRow({ count = 5 }) {
  return (
    <div className="tc-stars" aria-label={`${count} star rating`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="tc-star" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Single card
   ═══════════════════════════════════════════════ */
function TestimonialCard({ item }) {
  const accent = item.accent || '#3b82f6';
  return (
    <article className="tc-card" style={{ '--tc-accent': accent }}>
      {/* Pixel avatar with accent glow frame */}
      <div className="tc-avatar-frame">
        <div className="tc-avatar-pixel-border" />
        <img
          src={item.avatar}
          alt={item.name || 'avatar'}
          className="tc-avatar"
          loading="lazy"
          width="96"
          height="96"
        />
        {/* quote pixel badge */}
        <span className="tc-quote-badge" aria-hidden="true">&quot;</span>
      </div>

      {item.name && <h3 className="tc-name">{item.name}</h3>}
      {item.role && <p className="tc-role">{item.role}</p>}

      <StarRow count={5} />

      {item.quote && <p className="tc-quote">"{item.quote}"</p>}
    </article>
  );
}

/* ═══════════════════════════════════════════════
   Main carousel
   ═══════════════════════════════════════════════ */
export default function HomeTestimonials() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const itemsPerSlide = isMobile ? 1 : 2;
  const count = TESTIMONIALS.length;
  const slideCount = Math.ceil(count / itemsPerSlide);
  
  const [index, setIndex] = useState(0); // Slide index
  const [animKey, setAnimKey] = useState(0);
  const [slideDir, setSlideDir] = useState('right');
  const timerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const go = useCallback((delta) => {
    setSlideDir(delta > 0 ? 'right' : 'left');
    setIndex((i) => (i + delta + slideCount) % slideCount);
    setAnimKey((k) => k + 1);
  }, [slideCount]);

  // autoplay
  useEffect(() => {
    timerRef.current = setInterval(() => go(1), 6000);
    return clearTimer;
  }, [go]);

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') { clearTimer(); go(1); }
      if (e.key === 'ArrowLeft')  { clearTimer(); go(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const activeSlide = index;
  const startIndex = activeSlide * itemsPerSlide;
  const visibleItems = TESTIMONIALS.slice(startIndex, startIndex + itemsPerSlide);

  return (
    <section
      id="testimonials"
      className="tc-section page-section"
      aria-roledescription="carousel"
      aria-label="Testimonials"
    >
      <div className="tc-inner">
        <h2 className="tc-title">Testimonials</h2>
        <p className="tc-subtitle">What our users say about Nano Profiles</p>

        <div className="tc-stage">
          {/* Left arrow */}
          <button type="button" className="tc-arrow tc-arrow--left"
            onClick={() => { clearTimer(); go(-1); }}
            aria-label="Previous testimonials"
          >
            &#10094;
          </button>

          {/* Slide */}
          <div className="tc-slide-wrap" aria-live="polite">
            <div
              key={animKey}
              className={`tc-slide tc-slide--${slideDir}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${activeSlide + 1} of ${slideCount}`}
            >
              <div className="tc-slide-grid">
                {visibleItems.map((item) => (
                  <TestimonialCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Right arrow */}
          <button type="button" className="tc-arrow tc-arrow--right"
            onClick={() => { clearTimer(); go(1); }}
            aria-label="Next testimonials"
          >
            &#10095;
          </button>
        </div>

        {/* Dots */}
        <div className="tc-dots" aria-hidden="true">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`tc-dot ${i === activeSlide ? 'tc-dot--active' : ''}`}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => { clearTimer(); setSlideDir(i > activeSlide ? 'right' : 'left'); setIndex(i); setAnimKey(k => k + 1); }}
            />
          ))}
        </div>

        <p className="tc-counter">{activeSlide + 1} / {slideCount}</p>
      </div>
    </section>
  );
}
