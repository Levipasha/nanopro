import React from 'react';
import icons from '../LinkIcons';

export default function HomeCarousel() {
    const profileItems = [
        { rgb: [142, 249, 252], name: 'Alex', handle: '@alex.art', initial: 'A', links: ['instagram', 'twitter'] },
        { rgb: [142, 252, 204], name: 'Maya', handle: '@mayacreates', initial: 'M', links: ['instagram', 'youtube'] },
        { rgb: [142, 252, 157], name: 'Sam', handle: '@sam.design', initial: 'S', links: ['linkedin', 'twitter'] },
        { rgb: [215, 252, 142], name: 'Jordan', handle: '@jordan.works', initial: 'J', links: ['instagram', 'tiktok'] },
        { rgb: [252, 252, 142], name: 'Riley', handle: '@riley.photo', initial: 'R', links: ['instagram', 'website'] },
        { rgb: [252, 208, 142], name: 'Casey', handle: '@casey.music', initial: 'C', links: ['spotify', 'instagram'] },
        { rgb: [252, 142, 142], name: 'Taylor', handle: '@taylor.art', initial: 'T', links: ['instagram', 'pinterest'] },
        { rgb: [252, 142, 239], name: 'Morgan', handle: '@morgan.design', initial: 'M', links: ['instagram', 'linkedin'] },
        { rgb: [204, 142, 252], name: 'Quinn', handle: '@quinn.creative', initial: 'Q', links: ['instagram', 'youtube'] },
        { rgb: [142, 202, 252], name: 'Skyler', handle: '@skyler.pro', initial: 'S', links: ['linkedin', 'twitter'] }
    ];

    return (
        <section className="landing-carousel-section page-section" aria-hidden="true">
            <div className="landing-carousel-wrapper">
                <div className="landing-carousel-inner" style={{ '--quantity': 10 }}>
                    {profileItems.map((p, i) => (
                        <div
                            key={i}
                            className="landing-carousel-card"
                            style={{ '--index': i, '--color-card': `${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]}` }}
                        >
                            <div className="landing-carousel-card-inner">
                                <div className="landing-carousel-avatar">{p.initial}</div>
                                <div className="landing-carousel-name">{p.name}</div>
                                <div className="landing-carousel-handle">{p.handle}</div>
                                <div className="landing-carousel-links">
                                    {p.links.map((linkId) => (
                                        <button
                                            key={linkId}
                                            type="button"
                                            className="landing-carousel-link"
                                            aria-label={linkId}
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            {icons[linkId] ? React.cloneElement(icons[linkId], { width: 14, height: 14 }) : icons.website}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

