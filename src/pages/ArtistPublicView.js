import React, { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './GeneralProfileView.css';
import { landingArtistAPI } from '../services/api';
import { getLinkIcon } from '../components/LinkIcons';
import { getThemeById, resolveFontFamily } from '../constants/generalThemes';
import { useShowcaseEmbedHeight } from '../hooks/useShowcaseEmbedHeight';
import { Helmet } from 'react-helmet-async';
import { fixImageUrl } from '../utils/imageHelper';
import SkyToggle from '../components/ui/SkyToggle';

/**
 * Public artist profile route used for share links.
 * URL shape: /artist?id=<artistId>&art=<optionalArtId>
 */
function ArtistPublicView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const artistId = searchParams.get('id');
  const artId = searchParams.get('art');
  const isMock = searchParams.get('mock') === '1' || artistId === 'mock-artist';
  const isEmbed = searchParams.get('embed') === '1';

  const [artist, setArtist] = useState(null);
  const [showArtGallery, setShowArtGallery] = useState(false);
  const [selectedArtItem, setSelectedArtItem] = useState(null);
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEventPreview, setShowEventPreview] = useState(false);
  const [activeEventPreview, setActiveEventPreview] = useState(null);
  const [themeOverride, setThemeOverride] = useState(null);

  useShowcaseEmbedHeight(isEmbed);
  const [success, setSuccess] = useState('');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Link copied!');
      setTimeout(() => setSuccess(''), 2000);
    });
  };

  // Lock background scroll when modal open (allow modal scroll only)
  useEffect(() => {
    if (!showArtGallery) return;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    // iOS-friendly scroll lock
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, [showArtGallery]);

  useEffect(() => {
    if (!artistId) {
      setError('Artist profile link is missing an id.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    if (isMock) {
      // Hard-coded mock showcase data (so landing page doesn't depend on user-created profiles)
      const MOCK_ARTIST = {
        artistId: 'mock-artist',
        name: 'Example Artist Profile',
        specialization: 'Visual Artist • Contemporary Works',
        profileTheme: 'midnight',
        profileFont: 'outfit',
        email: 'example.artist@example.com',
        phone: '',
        backgroundPhoto: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&w=1200&q=80',
        photo: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&h=600&q=80',
        bio: 'Exploring texture, light, and form through mixed media. This is a static showcase profile used in the landing page.',
        website: 'https://example.com',
        portfolio: 'https://example.com/portfolio',
        instagram: 'exampleinsta',
        whatsapp: '9183746501',
        gallery: [
          {
            url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80',
            name: 'Gallery Exhibition',
          },
          {
            url: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80',
            name: 'Studio Work',
          }
        ],
        artLinks: [
          {
            id: 'mock-art-1',
            title: 'Neon Study #1',
            description: 'A neon-inspired exploration of color gradients.',
            images: [
              'https://images.unsplash.com/photo-1501472312651-726afe119ff1?auto=format&fit=crop&w=800&q=80'
            ]
          },
          {
            id: 'mock-art-2',
            title: 'Texture & Shadow',
            description: 'Light-driven texture composition.',
            images: [
              'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=800&q=80'
            ]
          }
        ],
      };

      setArtist(MOCK_ARTIST);
      setError(null);
      setLoading(false);
      return;
    }

    landingArtistAPI
      .getPublicProfile(artistId)
      .then((data) => {
        if (cancelled) return;
        setArtist(data.data || data); // backend may wrap in { success, data }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Artist profile not found.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [artistId, isMock]);


  if (!artistId) {
    return (
      <div className="gp-view gp-error">
        <div className="gp-error-icon">🔗</div>
        <h1>Artist profile link is missing an id.</h1>
        <p>Please check the link or regenerate it from your dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="gp-view gp-loading" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <DotLottieReact
          src="https://lottie.host/c1b7e87d-cc8f-44a2-b59a-9f00ec8c540b/n7PRg2j8GX.lottie"
          loop
          autoplay
          style={{ width: 250, height: 250 }}
        />
        <p style={{ 
          fontFamily: "'Press Start 2P', cursive", 
          fontSize: '10px', 
          color: '#fff', 
          marginTop: '1.5rem', 
          opacity: 0.7,
          letterSpacing: '2px'
        }}>
          nano is here
        </p>
        <p style={{ marginTop: '2rem', color: '#94a3b8', fontSize: '1.1rem', fontWeight: '300', letterSpacing: '0.05em' }}>
          Loading artist profile...
        </p>
      </div>
    );
  }


  if (error || !artist) {
    return (
      <div className="gp-view gp-error">
        <div className="gp-error-icon">🔗</div>
        <h1>Artist profile not found</h1>
        <p>{error || 'This artist profile does not exist.'}</p>
      </div>
    );
  }

  const primaryLinks = [];
  const linkFields = [
    'website',
    'portfolio',
    'pinterest',
    'instagram',
    'youtube',
    'tiktok',
    'twitter',
    'linkedin',
    'spotify',
    'facebook',
    'whatsapp',
    'discord',
    'snapchat',
    'telegram',
    'reddit',
    'threads',
    'medium',
    'twitch',
    'quora',
    'github',
  ];

  linkFields.forEach((field) => {
    const val = artist[field];
    if (!val) return;
    let url = val;

    // Keep backward compatible username-style inputs for some platforms
    if (field === 'instagram' && !val.startsWith('http')) {
      url = `https://instagram.com/${val.replace('@', '')}`;
    }
    if (field === 'facebook' && !val.startsWith('http')) {
      url = `https://facebook.com/${val}`;
    }
    if (field === 'twitter' && !val.startsWith('http')) {
      url = `https://x.com/${val.replace('@', '')}`;
    }
    if (field === 'linkedin' && !val.startsWith('http')) {
      url = `https://linkedin.com/in/${val}`;
    }
    if (field === 'whatsapp' && !val.includes('wa.me')) {
      const clean = val.replace(/\D/g, '');
      if (clean) url = `https://wa.me/${clean}`;
    }

    primaryLinks.push({
      id: field,
      title: field.charAt(0).toUpperCase() + field.slice(1),
      url,
    });
  });

  // Also pull from the modern unified 'links' array if it exists
  if (Array.isArray(artist.links)) {
    artist.links.forEach((l) => {
      if (!l.url) return;
      const platform = (l.platform || '').toLowerCase();
      const id = platform || (l.title || '').toLowerCase().replace(/\s+/g, '_');

      // Avoid duplication if the same platform was already added via field logic
      if (primaryLinks.some(pl => pl.id === id)) return;

      primaryLinks.push({
        id: id || 'website',
        title: l.title || (id.charAt(0).toUpperCase() + id.slice(1)),
        url: l.url
      });
    });
  }


  const linkedArtItems = artist?.artLinks
    ? (Array.isArray(artist.artLinks) ? artist.artLinks : Object.values(artist.artLinks))
    : [];

  // Use ONLY artLinks (structured pieces) for the Art Gallery Page
  const artItems = linkedArtItems;

  const hasContact = artist.email || artist.phone;

  const eventSlides = (artist.gallery || []).filter((x) => x && x.url);

  const currentThemeId = themeOverride === 'light' ? 'grey' : (artist?.profileTheme || 'midnight');
  const theme = getThemeById(currentThemeId);

  // Force white background if themeOverride is 'light'
  const themeBg = themeOverride === 'light' ? '#ffffff' : (theme?.bg || '#0f172a');
  const themeText = themeOverride === 'light' ? '#1a1a1a' : (theme?.text || '#ffffff');
  const themeLinkBg = themeOverride === 'light' ? 'rgba(0,0,0,0.05)' : (theme?.linkBg || 'rgba(255,255,255,0.08)');


  const isDarkColor = (color) => {
    if (!color) return false;
    const c = String(color).trim().toLowerCase();
    // Only handle hex colors here; gradients fallback to "not dark"
    const hex = c.startsWith('#') ? c.slice(1) : null;
    if (!hex || (hex.length !== 3 && hex.length !== 6)) return false;
    const full = hex.length === 3 ? hex.split('').map((ch) => ch + ch).join('') : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    // Relative luminance approximation
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance < 0.45;
  };

  const isTextDark = isDarkColor(themeText);
  const glassPillBg = isTextDark ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)';
  const glassPillBorder = isTextDark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.22)';

  const fontId = artist.profileFont || 'outfit';
  const fontFamily = resolveFontFamily(fontId);

  const sharePrimaryName = (artist?.name || '').trim() || 'Artist';
  const nanoProfilesPageTitle = `${sharePrimaryName} - Nano Profiles`;

  const handleShare = async () => {
    let url = window.location.href;
    if (isEmbed && artist?.artistId) {
      const base = (process.env.REACT_APP_FRONTEND_URL || window.location.origin).replace(/\/$/, '');
      url = `${base}/artist?id=${artist.artistId}${artId ? `&art=${artId}` : ''}`;
    }

    const shareTitle = `Check out ${sharePrimaryName} Profile on Nano Profiles`;
    const shareText = `Discover ${sharePrimaryName}'s digital footprint on Nano Profiles. Smart Digital Identity Solutions for modern creators and professionals. Create yours at nanoprofiles.com`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url
        });
      } catch (err) {
        if (err.name !== 'AbortError') copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  return (
    <div
      className={`gp-view gp-layout gp-artist-themed${isEmbed ? ' gp-embed-showcase' : ''}`}
      style={{
        '--artist-bg': themeBg,
        '--artist-text': themeText,
        '--artist-link-bg': themeLinkBg,
        '--artist-glass-pill-bg': glassPillBg,
        '--artist-glass-pill-border': glassPillBorder,
        '--artist-accent': themeText,
        '--artist-bg-contrast': isTextDark ? '#fff' : '#000',
        '--artist-border': isTextDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
        background: themeBg
      }}
    >
      <Helmet>
        <title>{nanoProfilesPageTitle}</title>
        <meta name="description" content={`Check out ${sharePrimaryName} Profile on Nano Profiles. ${[artist?.specialization, artist?.experience].filter(Boolean).join(' • ') || 'Smart Digital Identity Solutions'}.`} />

        {/* Open Graph / Facebook / WhatsApp */}
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={`Check out ${sharePrimaryName} Profile on Nano Profiles`} />
        <meta property="og:description" content={`Discover ${sharePrimaryName}'s digital footprint. Smart Digital Identity Solutions for modern creators and professionals.`} />
        <meta property="og:image" content={fixImageUrl(artist?.photo) || artist?.photo} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={window.location.href} />
        <meta name="twitter:title" content={`Check out ${sharePrimaryName} Profile on Nano Profiles`} />
        <meta name="twitter:description" content={`Discover ${sharePrimaryName}'s digital footprint. Smart Digital Identity Solutions.`} />
        <meta name="twitter:image" content={fixImageUrl(artist?.photo) || artist?.photo} />
      </Helmet>
      <div
        className={`gp-card gp-artist-themed-card ${theme?.isAnimated ? theme.className : ''}`}
        style={{
          background: theme?.isAnimated ? undefined : themeBg,
          color: themeText,
          fontFamily
        }}
      >
        {/* Share button - top right */}
        <button type="button" onClick={handleShare} className="gp-share-btn" aria-label="Share">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>

        {success && (
          <div className="gp-copy-toast" style={{
            position: 'absolute',
            top: '4.5rem',
            right: '1rem',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            zIndex: 100,
            animation: 'fadeIn 0.3s ease'
          }}>
            {success}
          </div>
        )}
        {/* New 'Hero' Layout (DaBaby Style) */}
        <div className="gp-artist-hero">
          {artist.photo || artist.backgroundPhoto ? (
            <div className="gp-artist-hero-overlay-wrap">
              <div className="gp-artist-hero-toggle-wrap">
                <SkyToggle
                  checked={themeOverride !== 'light'}
                  onChange={(e) => {
                    const isDark = e.target.checked;
                    setThemeOverride(isDark ? null : 'light');
                  }}
                />
              </div>
              <img
                src={fixImageUrl(artist.photo || artist.backgroundPhoto) || (artist.photo || artist.backgroundPhoto)}
                alt=""
                className="gp-artist-hero-bg"
                style={{
                  WebkitMaskImage: 'linear-gradient(to bottom, black 45%, transparent 100%)',
                  maskImage: 'linear-gradient(to bottom, black 45%, transparent 100%)'
                }}
              />
              <div className="gp-artist-hero-fade" />
            </div>
          ) : (
            <div className="gp-artist-hero-placeholder" />
          )}

          <div className="gp-artist-hero-content">
            <div className="gp-artist-hero-name-row">
              <h1 className="gp-artist-hero-name">{artist.name}</h1>

            </div>
            <p className="gp-artist-hero-username">@{artist.username || artist.artistId}</p>

            {/* Quick social links overlay removed per user request for vertical list format */}
          </div>
        </div>

        <div className="gp-content-wrap">
          {/* About section moved to top and enriched with meta header */}
          {(artist.bio || artist.specialization || artist.experience) && (
            <div className="gp-section gp-about-section" style={{ paddingLeft: 0, paddingRight: 0, marginTop: '0' }}>
              <div className="gp-about-header">
                {(artist.specialization || artist.experience) && (
                  <div className="gp-about-meta">
                    {artist.specialization && <span>{artist.specialization}</span>}
                    {artist.specialization && artist.experience && <span className="gp-meta-sep">/</span>}
                    {artist.experience && <span>{artist.experience}</span>}
                  </div>
                )}
              </div>
              {artist.bio && <p className="gp-bio" style={{ marginTop: '0.75rem' }}>{artist.bio}</p>}
            </div>
          )}

          {/* 1. Events slideshow */}
          {eventSlides.length > 0 && (
            <div className="gp-section gp-gallery-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <h2 className="gp-section-title">Gallery</h2>

              <div className="gp-gallery-grid-artist">
                {eventSlides.map((item, i) => {
                  const rotation = (i % 2 === 0 ? -1.5 : 1.5) + (i % 3 === 0 ? 0.5 : -0.5);
                  const hasLink = item.link && item.link.trim();
                  return (
                    <div
                      key={`${item.url}-${i}`}
                      className="gp-gallery-polaroid-item"
                      style={{ transform: `rotate(${rotation}deg)`, cursor: hasLink ? 'pointer' : 'zoom-in' }}
                      onClick={() => {
                        if (hasLink) {
                          // Redirect to the configured external link
                          let href = item.link.trim();
                          if (!/^https?:\/\//i.test(href)) href = 'https://' + href;
                          window.open(href, '_blank', 'noopener,noreferrer');
                        } else {
                          setActiveEventPreview({
                            url: item.url,
                            name: item.name || 'Gallery Item'
                          });
                          setShowEventPreview(true);
                        }
                      }}
                    >
                      <div className="gp-gallery-polaroid-frame" style={{ position: 'relative' }}>
                        <img
                          src={fixImageUrl(item.url) || item.url}
                          alt={item.name || ''}
                          loading="lazy"
                        />
                        {hasLink && (
                          <span
                            title="Visit link"
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              background: 'rgba(0,0,0,0.55)',
                              borderRadius: '50%',
                              width: '26px',
                              height: '26px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backdropFilter: 'blur(4px)'
                            }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" width="13" height="13">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="gp-gallery-polaroid-caption">
                        {item.name || 'Art Title'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Show My Art / Add Your Art (gallery entry point) */}
          {artItems.length > 0 && (
            <div className="gp-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <button
                className="gp-art-button"
                onClick={() => {
                  navigate('/show-my-art', { 
                    state: { 
                      artItems: artItems,
                      artistName: artist.name 
                    } 
                  });
                }}
              >
                <span className="gp-art-button-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </span>
                <span className="gp-art-button-text">Show My Art</span>
              </button>
            </div>
          )}

          {/* 3. Get in touch (below gallery, above social icons) */}
          {hasContact && (
            <div className="gp-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <h2 className="gp-section-title">Get in Touch</h2>
              <div className="gp-contact-stack">
                {artist.email && (
                  <div className="gp-contact-item">
                    <div className="gp-contact-label">Email</div>
                    <a href={`mailto:${artist.email}`} className="gp-contact-value">
                      {artist.email}
                    </a>
                  </div>
                )}
                {artist.phone && (
                  <div className="gp-contact-item">
                    <div className="gp-contact-label">Phone</div>
                    <a href={`tel:${artist.phone}`} className="gp-contact-value">
                      {artist.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Social Links List */}
          {primaryLinks.length > 0 && (
            <div className="gp-section gp-links-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <h2 className="gp-section-title">Links</h2>
              <div className="gp-links">
                {primaryLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gp-link"
                    style={{ color: themeText, background: themeLinkBg }}
                  >
                    <span className="gp-link-icon">{getLinkIcon({ platform: link.id })}</span>
                    <span className="gp-link-text">{link.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}


        </div>

        <div className="gp-footer">
          <span>
            Powered by{' '}
            <a href="https://nanoprofiles.com" target="_blank" rel="noopener noreferrer">
              NanoProfiles
            </a>
          </span>
        </div>
      </div>

      {/* Lightweight preview for Events slideshow images */}
      {showEventPreview && activeEventPreview && (
        <div className="gp-photo-modal">
          <div
            className="gp-modal-overlay"
            onClick={() => {
              setShowEventPreview(false);
              setActiveEventPreview(null);
            }}
          />
          <img
            className="gp-modal-img"
            src={fixImageUrl(activeEventPreview.url) || activeEventPreview.url}
            alt={activeEventPreview.name || 'Event image'}
          />
          <button
            type="button"
            className="gp-modal-close"
            onClick={() => {
              setShowEventPreview(false);
              setActiveEventPreview(null);
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Profile photo preview card */}
      {showProfilePreview && artist?.photo && (
        <div className="gp-photo-modal">
          <div
            className="gp-modal-overlay"
            onClick={() => setShowProfilePreview(false)}
          />
          <div className="gp-profile-preview-card">
            <img
              src={fixImageUrl(artist.photo) || artist.photo}
              alt={artist.name || 'Artist'}
              className="gp-profile-preview-img"
            />
            <div className="gp-profile-preview-info">
              <div className="gp-profile-preview-name-row">
                {artist.name && <span className="gp-profile-preview-name">{artist.name}</span>}
                {artist.specialization && <span className="gp-profile-preview-dot" />}
              </div>
              {(artist.specialization || artist.experience) && (
                <div className="gp-artist-badge-wrapper" style={{ marginTop: '0.35rem' }}>
                  <div className="Btn" style={{ height: '28px', minWidth: '120px' }}>
                    <div className="leftContainer">
                      <span className="like" style={{ fontSize: '0.65rem' }}>{artist.specialization || 'Artist'}</span>
                    </div>
                    {artist.experience && (
                      <div className="likeCount" style={{ fontSize: '0.65rem' }}>
                        {artist.experience}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className="gp-modal-close"
            onClick={() => setShowProfilePreview(false)}
          >
            ×
          </button>
        </div>
      )}

      {/* Art / Image modal (reuse same UI) */}
      {showArtGallery && (artItems.length > 0 || (selectedArtItem && (selectedArtItem.images || []).length > 0)) && (
        <div
          className="gp-art-modal-overlay"
          onClick={() => {
            setShowArtGallery(false);
            setSelectedArtItem(null);
          }}
        >
          <div className="gp-art-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gp-art-modal-header">
              <h2>{selectedArtItem?.title ? selectedArtItem.title : 'Art Collection'}</h2>
              {artItems.length > 0 && <span className="gp-art-modal-count">{artItems.length} pieces</span>}
            </div>
            {artItems.length > 0 ? (
              <div className="gp-art-modal-grid">
                {artItems.map((item) => {
                  const firstImage =
                    item.images && item.images[0]
                      ? item.images[0]
                      : null;
                  return (
                    <button
                      key={item.id || item.title}
                      type="button"
                      className="gp-art-card"
                      onClick={() => setSelectedArtItem(item)}
                    >
                      {firstImage ? (
                        <img src={fixImageUrl(firstImage) || firstImage} alt={item.title || 'Artwork'} className="gp-art-card-img" />
                      ) : (
                        <div className="gp-art-card-empty">🎨</div>
                      )}
                      <div className="gp-art-card-info">
                        <h3>{item.title || 'Untitled'}</h3>
                        {item.description && <p>{item.description}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="gp-art-lightbox-inner" style={{ background: 'transparent', padding: 0, maxHeight: 'unset' }}>
                <div className="gp-art-lightbox-images" style={{ marginTop: 0 }}>
                  {(selectedArtItem?.images || []).map((imgUrl, i) => (
                    <img key={i} src={imgUrl} alt={`${selectedArtItem?.title || 'Image'} ${i + 1}`} />
                  ))}
                </div>
              </div>
            )}

            {selectedArtItem && (
              <div className="gp-art-lightbox" onClick={() => setSelectedArtItem(null)}>
                <div className="gp-art-lightbox-inner" onClick={(e) => e.stopPropagation()}>
                  <h2>{selectedArtItem.title || 'Artwork'}</h2>
                  <div className="gp-art-lightbox-images">
                    {(selectedArtItem.images || []).map((imgUrl, i) => (
                      <img key={i} src={imgUrl} alt={`${selectedArtItem.title || 'Artwork'} ${i + 1}`} />
                    ))}
                  </div>
                  {selectedArtItem.description && <p>{selectedArtItem.description}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ArtistPublicView;

