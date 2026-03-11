import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './GeneralProfileView.css';
import { landingArtistAPI } from '../services/api';
import { getLinkIcon } from '../components/LinkIcons';

/**
 * Public artist profile route used for NFC / share links.
 * URL shape: /artist?id=<artistId>&art=<optionalArtId>
 */
function ArtistPublicView() {
  const [searchParams] = useSearchParams();
  const artistId = searchParams.get('id');
  const artId = searchParams.get('art');

  const [artist, setArtist] = useState(null);
  const [showArtGallery, setShowArtGallery] = useState(false);
  const [selectedArtItem, setSelectedArtItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!artistId) {
      setError('Artist profile link is missing an id.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

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
  }, [artistId]);

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
      <div className="gp-view gp-loading">
        <div className="gp-spinner" />
        <p>Loading artist profile...</p>
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
  const linkFields = ['website', 'instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp'];
  linkFields.forEach((field) => {
    const val = artist[field];
    if (!val) return;
    let url = val;
    if (field === 'instagram' && !val.startsWith('http')) url = `https://instagram.com/${val.replace('@', '')}`;
    if (field === 'facebook' && !val.startsWith('http')) url = `https://facebook.com/${val}`;
    if (field === 'twitter' && !val.startsWith('http')) url = `https://x.com/${val.replace('@', '')}`;
    if (field === 'linkedin' && !val.startsWith('http')) url = `https://linkedin.com/in/${val}`;
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

  const artItems = artist?.artLinks
    ? (Array.isArray(artist.artLinks) ? artist.artLinks : Object.values(artist.artLinks))
    : [];

  const hasGallery = Array.isArray(artist.gallery) && artist.gallery.length > 0;
  const hasContact = artist.email || artist.phone;

  const galleryStripRef = useRef(null);

  const themeId = artist.profileTheme || 'mono';
  const themeMap = {
    mono: { bg: '#0f172a', text: '#ffffff', linkBg: 'rgba(255,255,255,0.08)' },
    classic: { bg: '#f5f5f5', text: '#111827', linkBg: 'rgba(0,0,0,0.06)' },
    neon: { bg: '#020617', text: '#22d3ee', linkBg: 'rgba(34,211,238,0.12)' },
    art: { bg: '#000000', text: '#f97373', linkBg: 'rgba(248,113,113,0.12)' }
  };
  const theme = themeMap[themeId] || themeMap.mono;

  const fontId = artist.profileFont || 'outfit';
  const fontMap = {
    outfit: "'Outfit', system-ui, -apple-system, sans-serif",
    playfair: "'Playfair Display', system-ui, serif",
    caveat: "'Caveat', system-ui, cursive",
    inter: "'Inter', system-ui, -apple-system, sans-serif",
    'mono-font': "'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
  };
  const fontFamily = fontMap[fontId] || fontMap.outfit;

  // Auto-scroll gallery strip horizontally to create slideshow effect
  useEffect(() => {
    if (!hasGallery || !galleryStripRef.current) return;

    const stripEl = galleryStripRef.current;
    const gapPx = 14; // approx 0.9rem gap between cards
    let index = 0;

    const timer = setInterval(() => {
      const firstCard = stripEl.firstElementChild;
      if (!firstCard) return;
      const cardWidth = firstCard.getBoundingClientRect().width || 0;
      if (!cardWidth) return;

      index = (index + 1) % artist.gallery.length;
      const scrollLeft = index * (cardWidth + gapPx);
      stripEl.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }, 4000);

    return () => clearInterval(timer);
  }, [hasGallery, artist.gallery?.length]);

  return (
    <div
      className="gp-view gp-layout"
      style={{
        background: theme.bg
      }}
    >
      <div
        className="gp-card"
        style={{
          background: theme.bg,
          color: theme.text,
          fontFamily
        }}
      >
        {/* Cover banner */}
        <div className="gp-photo-header">
          {artist.backgroundPhoto && (
            <img src={artist.backgroundPhoto} alt={artist.name || 'Cover'} className="gp-cover-img" />
          )}
        </div>

        {/* Centered circular avatar + basic details */}
        <div className="gp-avatar-row">
          <div className="gp-avatar-circle">
            {artist.photo ? (
              <img
                src={artist.photo}
                alt={artist.name || 'Artist'}
              />
            ) : (
              <div className="gp-avatar-circle-fallback">
                {artist.name?.charAt(0) || 'A'}
              </div>
            )}
          </div>
          <div className="gp-avatar-text">
            {artist.name && <h1 className="gp-name">{artist.name}</h1>}
            {artist.specialization && <p className="gp-title-overlay">{artist.specialization}</p>}
            <p className="gp-username">ID: {artist.artistId || artist.username || artistId}</p>
          </div>
        </div>

        {/* About */}
        {artist.bio && (
          <div className="gp-section">
            <h2 className="gp-section-title">About</h2>
            <p className="gp-bio">{artist.bio}</p>
          </div>
        )}

        {/* Links */}
        {primaryLinks.length > 0 && (
          <div className="gp-section">
            <h2 className="gp-section-title">Links</h2>
            <div className="gp-links">
              {primaryLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gp-link"
                  style={{ backgroundColor: theme.linkBg }}
                >
                  <span className="gp-link-icon">{getLinkIcon({ platform: link.id })}</span>
                  <span className="gp-link-text">{link.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Get in touch */}
        {hasContact && (
          <div className="gp-section">
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

        {/* Show My Art / Add Your Art */}
        {artItems.length > 0 && (
          <div className="gp-section">
            <button
              className="gp-art-button"
              onClick={() => {
                setShowArtGallery(true);
                setSelectedArtItem(null);
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
              <span className="gp-art-button-count">{artItems.length}</span>
            </button>
          </div>
        )}

        {/* Events / Gallery – compact horizontal strip */}
        {hasGallery && (
          <div className="gp-section">
            <h2 className="gp-section-title">Events</h2>
            <div className="gp-gallery-strip-wrapper">
              <div className="gp-gallery-strip" ref={galleryStripRef}>
                {artist.gallery.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="gp-gallery-chip"
                    onClick={() => {
                      // Reuse art modal for a simple large view behaviour
                      setSelectedArtItem({
                        title: item.name || 'Event',
                        images: [item.url]
                      });
                      setShowArtGallery(true);
                    }}
                  >
                    <div className="gp-gallery-chip-thumb">
                      <img src={item.url} alt={item.name || 'Event'} />
                    </div>
                    {item.name && <div className="gp-gallery-chip-title">{item.name}</div>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {artId && (
          <p style={{ opacity: 0.75, marginTop: '12px' }}>
            Viewing artwork: <strong>{artId}</strong>
          </p>
        )}

        <div className="gp-footer">
          <span>
            Powered by{' '}
            <a href="https://nanoprofiles.com" target="_blank" rel="noopener noreferrer">
              NanoProfiles
            </a>
          </span>
        </div>
      </div>

      {/* Art collection modal */}
      {showArtGallery && artItems.length > 0 && (
        <div
          className="gp-art-modal-overlay"
          onClick={() => {
            setShowArtGallery(false);
            setSelectedArtItem(null);
          }}
        >
          <div className="gp-art-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gp-art-modal-header">
              <h2>Art Collection</h2>
              <span className="gp-art-modal-count">{artItems.length} pieces</span>
              <button
                className="gp-art-modal-close"
                onClick={() => {
                  setShowArtGallery(false);
                  setSelectedArtItem(null);
                }}
              >
                ✕
              </button>
            </div>
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
                      <img src={firstImage} alt={item.title || 'Artwork'} className="gp-art-card-img" />
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

            {selectedArtItem && (
              <div className="gp-art-lightbox" onClick={() => setSelectedArtItem(null)}>
                <div className="gp-art-lightbox-inner" onClick={(e) => e.stopPropagation()}>
                  <button className="gp-art-lightbox-close" onClick={() => setSelectedArtItem(null)}>
                    ✕
                  </button>
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

