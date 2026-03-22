import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import './HomeTestimonials.css';

function svgToDataUri(svg) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function makeIndianAvatar({ skin, hair, accent, shirt }) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/>
            <stop offset="1" stop-color="#e5e7eb" stop-opacity="1"/>
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="96" height="96" rx="18" fill="url(#bg)"/>

        <!-- shoulders -->
        <path d="M16 86c2-18 16-26 32-26s30 8 32 26" fill="${shirt}" opacity="0.9"/>

        <!-- hair -->
        <path d="M22 38c0-14 10-26 26-26s26 12 26 26c0 5-1 10-4 14-6-7-13-11-22-11s-16 4-22 11c-3-4-4-9-4-14z" fill="${hair}"/>

        <!-- face -->
        <circle cx="48" cy="44" r="20" fill="${skin}"/>

        <!-- eyes -->
        <circle cx="40" cy="44" r="3.2" fill="#0b1220"/>
        <circle cx="56" cy="44" r="3.2" fill="#0b1220"/>
        <circle cx="39.2" cy="43.2" r="1.1" fill="#ffffff"/>
        <circle cx="55.2" cy="43.2" r="1.1" fill="#ffffff"/>

        <!-- bindi -->
        <circle cx="48" cy="52" r="2.3" fill="${accent}"/>

        <!-- nose -->
        <path d="M48 49c-2 4 2 7 0 9" stroke="#5b3426" stroke-width="2" fill="none" stroke-linecap="round"/>

        <!-- mouth -->
        <path d="M40 58c4 5 12 5 16 0" stroke="#5b3426" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `;
    return svgToDataUri(svg);
}

function StarRow({ count = 5 }) {
    const stars = Array.from({ length: count });
    return (
        <div className="testimonials-stars" aria-label={`${count} star rating`}>
            {stars.map((_, i) => (
                <svg
                    key={i}
                    className="testimonials-star"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    fill="currentColor"
                >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
            ))}
        </div>
    );
}

const TESTIMONIALS = [
        {
            name: 'Emily Jeff',
            title: 'TheWeAgency',
            text: 'We tap the NFC tag and the profile opens instantly. No app, no friction—works perfectly for quick access on the go.',
            avatar: makeIndianAvatar({ skin: '#f3c7a6', hair: '#2b1b12', accent: '#f59e0b', shirt: '#dbeafe' })
        },
        {
            name: 'Hamza Malik',
            title: 'TheWekTech',
            text: 'Setup took minutes. Students and staff can tap once and see the right digital ID and details immediately.',
            avatar: makeIndianAvatar({ skin: '#eab997', hair: '#1f1b16', accent: '#f97316', shirt: '#fee2e2' })
        },
        {
            name: 'Elizabeth Rai',
            title: 'I2C Company',
            text: 'Digital ID updates stay current. Users can refresh their profile anytime and the NFC content stays accurate.',
            avatar: makeIndianAvatar({ skin: '#f0c4a0', hair: '#4b2f22', accent: '#f59e0b', shirt: '#dcfce7' })
        },
        {
            name: 'Sara Thomas',
            title: 'TheConstruction',
            text: 'The tap-to-open experience is super smooth. Customers love how quickly the menu/billing or profile appears.',
            avatar: makeIndianAvatar({ skin: '#f0b995', hair: '#2a1a15', accent: '#fb7185', shirt: '#e0e7ff' })
        },
        {
            name: 'Aarav Sharma',
            title: 'BrightCell Labs',
            text: 'We use it for school staff. Tap → instant access to the correct profile and information, every time.',
            avatar: makeIndianAvatar({ skin: '#f2c2a0', hair: '#3a241a', accent: '#f59e0b', shirt: '#fef3c7' })
        },
        {
            name: 'Priya Nair',
            title: 'I2C School',
            text: 'No installation needed. Any phone can tap the NFC chip and open the profile instantly with clean UI.',
            avatar: makeIndianAvatar({ skin: '#f1c1a0', hair: '#2d1c14', accent: '#f59e0b', shirt: '#cffafe' })
        },
        {
            name: 'Riya Gupta',
            title: 'Nano Studio',
            text: 'Our artists’ portfolios stay updated. When someone taps, they see the latest story and projects without manual sharing.',
            avatar: makeIndianAvatar({ skin: '#eeb08f', hair: '#21130f', accent: '#fb7185', shirt: '#e9d5ff' })
        },
        {
            name: 'Arjun Verma',
            title: 'TapWorks',
            text: 'We connect everything with a single chip. Tap to open, show the right profile, and update whenever we need.',
            avatar: makeIndianAvatar({ skin: '#f2c3a0', hair: '#3b2a22', accent: '#f97316', shirt: '#fde68a' })
        },
        {
            name: 'Meera Patel',
            title: 'SecureDeck',
            text: 'The experience feels secure and modern. Users tap once and get verified details immediately.',
            avatar: makeIndianAvatar({ skin: '#f0b895', hair: '#2f1f17', accent: '#f59e0b', shirt: '#bfdbfe' })
        },
        {
            name: 'Karan Singh',
            title: 'Smart Profiles',
            text: 'Our workflow is faster. Tap → open profile card and show the correct info without any extra steps for users.',
            avatar: makeIndianAvatar({ skin: '#f1c0a0', hair: '#2a1f18', accent: '#fb7185', shirt: '#d1fae5' })
        }
];

const MOBILE_MAX_PX = 720;

export default function HomeTestimonials() {
    const [cardsPerSlide, setCardsPerSlide] = useState(3);

    useLayoutEffect(() => {
        const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_PX}px)`);
        const apply = () => setCardsPerSlide(mq.matches ? 1 : 3);
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);

    const totalSlides = Math.ceil(TESTIMONIALS.length / cardsPerSlide);

    const [slideIndex, setSlideIndex] = useState(0);

    useEffect(() => {
        const maxIdx = Math.max(0, totalSlides - 1);
        setSlideIndex((i) => Math.min(i, maxIdx));
    }, [totalSlides]);

    const visibleTestimonials = useMemo(() => {
        const start = slideIndex * cardsPerSlide;
        let slice = TESTIMONIALS.slice(start, start + cardsPerSlide);
        if (
            slice.length > 0
            && slice.length < cardsPerSlide
            && TESTIMONIALS.length > cardsPerSlide
        ) {
            const need = cardsPerSlide - slice.length;
            slice = [...slice, ...TESTIMONIALS.slice(0, need)];
        }
        return slice;
    }, [slideIndex, cardsPerSlide]);

    useEffect(() => {
        if (totalSlides <= 1) return;
        const t = window.setInterval(() => {
            setSlideIndex((prev) => (prev + 1) % totalSlides);
        }, 6000);
        return () => window.clearInterval(t);
    }, [totalSlides]);

    return (
        <section id="testimonials" className="testimonials-section page-section">
            <div className="info-inner">
                <h2 className="testimonials-title">Testimonials</h2>

                <div className="testimonials-grid" role="region" aria-label="Testimonials slideshow">
                    {visibleTestimonials.map((t, idx) => (
                        <div
                            key={`${slideIndex}-${idx}`}
                            className="testimonial-card"
                        >
                            <img className="testimonials-avatar" src={t.avatar} alt={`${t.name} avatar`} />

                            <div className="testimonials-name">{t.name}</div>
                            <div className="testimonials-role">{t.title}</div>

                            <StarRow count={5} />
                            <p className="testimonials-text">{t.text}</p>
                        </div>
                    ))}
                </div>

                <div className="testimonials-dots" aria-hidden="true">
                    {Array.from({ length: totalSlides }).map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`testimonials-dot ${i === slideIndex ? 'testimonials-dot--active' : ''}`}
                            aria-label={`Go to slide ${i + 1}`}
                            onClick={() => setSlideIndex(i)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

