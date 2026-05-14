import React, { useState, useEffect } from 'react';
import { DotLottieReact as BrandLoader } from '@lottiefiles/dotlottie-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { generalProfileAPI } from '../services/api';
import { fixImageUrl } from '../utils/imageHelper';
import { getLinkIcon } from '../components/LinkIcons';
import { getThemeById, resolveFontFamily } from '../constants/generalThemes';
import { Helmet } from 'react-helmet-async';
import './GeneralProfileView.css';
import { useShowcaseEmbedHeight } from '../hooks/useShowcaseEmbedHeight';
import SkyToggle from '../components/ui/SkyToggle';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/** Fix legacy titles saved as Google_maps from older publish logic. */
/** Clean up URLs for display if no title is provided. */
function displayGeneralLinkLabel(linkOrUrl) {
  let t = '';
  let url = '';
  let platform = '';

  if (typeof linkOrUrl === 'string') {
    url = linkOrUrl;
  } else {
    t = (linkOrUrl?.title || '').trim();
    url = (linkOrUrl?.url || '').trim();
    platform = (linkOrUrl?.platform || '').toLowerCase();
  }

  // If title is explicitly provided and doesn't look like a URL, use it
  if (t && !t.includes('/') && !t.includes('.')) {
    if (/^google_maps$/i.test(t) || t === 'Google_maps') return 'Google Maps';
    return t;
  }

  // If no title, or title is just a URL, try to guess the app name
  const domains = [
    { d: 'instagram.com', name: 'Instagram' },
    { d: 'facebook.com', name: 'Facebook' },
    { d: 'twitter.com', name: 'Twitter' },
    { d: 'x.com', name: 'X' },
    { d: 'linkedin.com', name: 'LinkedIn' },
    { d: 'youtube.com', name: 'YouTube' },
    { d: 'tiktok.com', name: 'TikTok' },
    { d: 'spotify.com', name: 'Spotify' },
    { d: 'pinterest.com', name: 'Pinterest' },
    { d: 'threads.net', name: 'Threads' },
    { d: 'snapchat.com', name: 'Snapchat' },
    { d: 'github.com', name: 'GitHub' },
    { d: 'wa.me', name: 'WhatsApp' },
    { d: 'whatsapp.com', name: 'WhatsApp' },
    { d: 't.me', name: 'Telegram' },
    { d: 'telegram.org', name: 'Telegram' },
    { d: 'discord.gg', name: 'Discord' },
    { d: 'reddit.com', name: 'Reddit' },
    { d: 'google.com/maps', name: 'Google Maps' },
    { d: 'maps.app.goo.gl', name: 'Google Maps' }
  ];

  const cleanUrl = (url || t || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').toLowerCase();

  // 1. Check platform explicitly if provided
  if (platform && platform !== 'website' && platform !== 'custom') {
    const pMatch = domains.find(d => d.name.toLowerCase() === platform || d.d.includes(platform));
    if (pMatch) return pMatch.name;
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  }

  // 2. Check URL matches for known domains
  for (const domain of domains) {
    if (cleanUrl.startsWith(domain.d)) {
      return domain.name;
    }
  }

  // 3. Fallback: if we have something from cleaning the URL, return the first part (domain)
  const fallback = cleanUrl.split('/')[0];
  if (fallback) {
    return fallback.charAt(0).toUpperCase() + fallback.slice(1);
  }

  return t || url || '';
}

function GeneralProfileView() {
  const { username } = useParams();
  // const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === '1';
  const isEmbed = searchParams.get('embed') === '1';
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenuViewer, setShowMenuViewer] = useState(false);
  const [menuPage, setMenuPage] = useState(1);
  const [menuTotalPages, setMenuTotalPages] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [pageTurnDir, setPageTurnDir] = useState('');
  const [galleryModalIndex, setGalleryModalIndex] = useState(null);
  const [themeOverride, setThemeOverride] = useState(null);

  useShowcaseEmbedHeight(isEmbed);

  useEffect(() => {
    if (isMock) {
      const MOCK_RESTAURANT = {
        username: 'mock-restaurant',
        name: 'Sakura Kitchen',
        title: 'Modern Japanese Cuisine',
        bio: 'Authentic Japanese flavors reimagined with local ingredients. From sushi to ramen, every dish tells a story of tradition meeting innovation.',
        photo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&h=500&fit=crop',
        menuPdf: '',
        profileType: 'restaurant',
        theme: 'mint',
        font: 'outfit',
        bioFont: 'outfit',
        links: [
          { title: 'Instagram', url: 'https://instagram.com/exampleinsta', platform: 'instagram', order: 0 },
          { title: 'WhatsApp', url: 'https://wa.me/9183746501', platform: 'whatsapp', order: 1 },
          { title: 'Website', url: 'https://example.com', platform: 'website', order: 2 }
        ],
        social: {},
        gallery: [
          { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600', name: 'Interior' },
          { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600', name: 'Dining' }
        ]
      };

      setProfile(MOCK_RESTAURANT);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await generalProfileAPI.getByUsername(username);
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          setError('Profile not found');
        }
      } catch (err) {
        setError(err.message || 'Profile not found');
      } finally {
        setLoading(false);
      }
    };
    if (username) fetchProfile();
  }, [username, isMock]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => alert('Link copied!'));
  };

  const openMenuViewer = () => {
    setMenuPage(1);
    setShowMenuViewer(true);
  };

  const closeMenuViewer = () => {
    setShowMenuViewer(false);
    setPageTurnDir('');
  };

  const turnPage = (direction) => {
    if (!menuTotalPages) return;
    const nextPage = direction === 'next'
      ? Math.min(menuPage + 1, menuTotalPages)
      : Math.max(menuPage - 1, 1);
    if (nextPage === menuPage) return;
    setPageTurnDir(direction);
    setMenuPage(nextPage);
    window.setTimeout(() => setPageTurnDir(''), 220);
  };

  if (loading) {
    return (
      <div className="gp-view gp-loading" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <BrandLoader
          src="https://lottie.host/6b4bd948-73df-46e5-aa82-fbc42ca9d04a/k5p94sM04J.lottie"
          loop
          autoplay
          style={{ width: 200, height: 200 }}
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
          Loading profile...
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="gp-view gp-error">
        <div className="gp-error-icon">🔗</div>
        <h1>Profile not found</h1>
        <p>{error || 'This profile does not exist.'}</p>
      </div>
    );
  }

  const isRestaurant = profile?.profileType === 'restaurant' || !!profile?.menuPdf;
  const links = (profile.links || []).filter(l => l.url).sort((a, b) => (a.order || 0) - (b.order || 0));
  const theme = getThemeById(themeOverride || profile.theme || 'midnight');
  const bioLines = String(profile.bio || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const cleanBio = bioLines
    .filter((line) => !line.startsWith('📞') && !line.startsWith('✉'))
    .join('\n')
    .trim();

  const rawBio = String(profile.bio || '');
  const extractedPhone = bioLines.find(l => l.includes('📞'))?.split('📞')[1]?.trim() ||
    bioLines.find(l => l.toLowerCase().includes('phone:'))?.split(/phone:/i)[1]?.trim() ||
    bioLines.find(l => l.toLowerCase().includes('mobile:'))?.split(/mobile:/i)[1]?.trim();

  const emailRegex = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i;
  const extractedEmail = bioLines.find(l => l.includes('✉'))?.split('✉')[1]?.trim() ||
    bioLines.find(l => l.toLowerCase().includes('email:'))?.split(/email:/i)[1]?.trim() ||
    rawBio.match(emailRegex)?.[0];

  const displayPhone = profile.phone || extractedPhone;
  const displayEmail = profile.email || extractedEmail;

  const galleryItems = (Array.isArray(profile.gallery) ? profile.gallery : [])
    .map((g) => ({
      url: (g && g.url) ? String(g.url).trim() : '',
      name: (g && g.name) ? String(g.name).trim() : '',
      link: (g && g.link) ? String(g.link).trim() : ''
    }))
    .filter((g) => g.url);

  const activeHeadingFont = profile.font || 'outfit';
  const activeBodyFont = profile.bioFont || activeHeadingFont;
  const sharePrimaryName = (profile?.name || '').trim() || 'Profile';
  const nanoProfilesPageTitle = `${sharePrimaryName} - Nano Profiles`;

  const handleShare = async () => {
    let url = window.location.href;
    if (isEmbed && profile?.username) {
      const base = (process.env.REACT_APP_FRONTEND_URL || window.location.origin).replace(/\/$/, '');
      url = `${base}/link/${profile.username}`;
    }
    const shareTitle = `Check out ${sharePrimaryName} Profile`;
    const shareText = `Discover ${sharePrimaryName}'s digital footprint on Nano Profiles.`;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
      } catch (err) {
        if (err.name !== 'AbortError') copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  return (
    <div
      className={`gp-view gp-layout gp-artist-themed gp-general-view${isRestaurant ? ' gp-profile-restaurant' : ''}${isEmbed ? ' gp-embed-showcase' : ''}`}
      style={{ background: theme.isAnimated ? undefined : theme.bg }}
    >
      <Helmet>
        <title>{nanoProfilesPageTitle}</title>
        <meta name="description" content={`Check out ${sharePrimaryName} Profile on Nano Profiles.`} />
      </Helmet>

      <div
        className={`gp-card gp-card-themed gp-artist-themed-card ${theme.isAnimated ? theme.className : ''}`}
        style={{
          background: theme.isAnimated ? undefined : theme.bg,
          color: theme.text,
          '--font-heading': resolveFontFamily(activeHeadingFont),
          '--font-body': resolveFontFamily(activeBodyFont)
        }}>

        {/* Share button */}
        <button type="button" onClick={handleShare} className="gp-share-btn" aria-label="Share">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>

        {/* Banner Section */}
        <div className="gp-photo-header">
          <div className="gp-artist-hero-toggle-wrap" style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
            <SkyToggle
              checked={theme.isDark}
              onChange={(e) => {
                const wantDark = e.target.checked;
                const profileThemeObj = getThemeById(profile.theme || 'midnight');

                if (profileThemeObj.isDark === wantDark) {
                  // User wants the mode that matches their original theme choice
                  setThemeOverride(null);
                } else {
                  // User wants the opposite of their original theme choice
                  setThemeOverride(wantDark ? 'midnight' : 'light');
                }
              }}
            />
          </div>
          <img
            src={fixImageUrl(profile.banner || profile.photo) || profile.banner || profile.photo}
            alt=""
            className="gp-banner-bg"
          />
        </div>

        {/* Profile Info Overlay (Half-on, Half-off for General, Classic for Restaurant) */}
        {!isRestaurant ? (
          <div className="gp-banner-overlay-info">
            <div className="gp-avatar-square">
              <img
                src={fixImageUrl(profile.photo) || profile.photo}
                alt={profile.name}
                className="gp-avatar-img"
              />
            </div>
            <div className="gp-avatar-text-overlay">
              <h1 className="gp-name">
                {profile.name && profile.name.length > 16
                  ? profile.name.substring(0, 16) + '..'
                  : profile.name}
              </h1>
              <div className="gp-username-row">
                <span className="gp-username-display">@{profile?.username || username}</span>
                {profile.title && (
                  <>
                    <span className="gp-sep">/</span>
                    <span className="gp-tagline">{profile.title}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="gp-restaurant-header-info">
            <h1 className="gp-name">{profile.name}</h1>
            <div className="gp-username-row">
              <span className="gp-username-display">@{profile?.username || username}</span>
              {profile.title && (
                <>
                  <span className="gp-sep">/</span>
                  <span className="gp-tagline">{profile.title}</span>
                </>
              )}
            </div>
          </div>
        )}



        <div className="gp-content-wrap">


          {/* About section */}
          {(cleanBio || profile.title) && (
            <div className="gp-section gp-about-section" style={{ paddingLeft: 0, paddingRight: 0, marginTop: '0' }}>
              <div className="gp-about-header">
                <h2 className="gp-section-title">About</h2>
              </div>
              {cleanBio && <p className="gp-bio">{cleanBio}</p>}
            </div>
          )}

          {/* Menu Button */}
          {profile.menuPdf && (
            <div className="gp-section" style={{ paddingLeft: 0, paddingRight: 0, marginTop: '1rem', marginBottom: '1.5rem' }}>
              <button
                onClick={openMenuViewer}
                style={{
                  width: '100%', padding: '0.85rem', borderRadius: '12px',
                  background: theme.text, color: theme.bg,
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                View Menu
              </button>
            </div>
          )}

          {/* Suggestions section - Polaroid Style */}
          {profile.suggestions && profile.suggestions.length > 0 && (
            <div className="gp-section gp-suggestions-section" style={{ paddingLeft: 0, paddingRight: 0, marginBottom: '2rem' }}>
              <h2 className="gp-section-title">{profile.suggestionsTitle || 'Suggestions'}</h2>
              <div className="gp-gallery-grid-general">
                {profile.suggestions.map((sug, idx) => {
                  const rotation = (idx % 2 === 0 ? -1.5 : 1.5);
                  const sugContent = (
                    <div
                      key={`${sug.url}-${idx}`}
                      className="gp-gallery-polaroid-item-general"
                      style={{ transform: `rotate(${rotation}deg)`, cursor: sug.link ? 'pointer' : 'default' }}
                    >
                      <div className="gp-gallery-polaroid-frame-general">
                        <img src={fixImageUrl(sug.url) || sug.url} alt={sug.caption || ''} loading="lazy" />
                      </div>
                      <div className="gp-gallery-polaroid-caption-general">
                        {sug.caption || 'Suggestion'}
                      </div>
                    </div>
                  );

                  if (sug.link) {
                    return (
                      <a
                        key={idx}
                        href={sug.link.startsWith('http') ? sug.link : `https://${sug.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {sugContent}
                      </a>
                    );
                  }
                  return sugContent;
                })}
              </div>
            </div>
          )}

          {/* Gallery section - Polaroid Style */}
          {galleryItems.length > 0 && (
            <div className="gp-section gp-gallery-section" style={{ paddingLeft: 0, paddingRight: 0, marginBottom: '2rem' }}>
              <h2 className="gp-section-title">Gallery</h2>
              <div className="gp-gallery-grid-general">
                {galleryItems.map((g, idx) => {
                  const rotation = (idx % 2 === 0 ? -1.5 : 1.5);
                  return (
                    <div
                      key={`${g.url}-${idx}`}
                      className="gp-gallery-polaroid-item-general"
                      style={{ transform: `rotate(${rotation}deg)` }}
                      onClick={() => setGalleryModalIndex(idx)}
                    >
                      <div className="gp-gallery-polaroid-frame-general">
                        <img src={fixImageUrl(g.url) || g.url} alt={g.name || ''} loading="lazy" />
                      </div>
                      <div className="gp-gallery-polaroid-caption-general">
                        {g.name || 'Art Title'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Links section */}
          {links.length > 0 && (
            <div className="gp-links" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gp-link"
                >
                  <span className="gp-link-icon">{getLinkIcon(link)}</span>
                  <span className="gp-link-text">{displayGeneralLinkLabel(link)}</span>
                </a>
              ))}
            </div>
          )}

          {/* Contact section */}
          {(displayPhone || displayEmail) && (
            <div className="gp-section gp-contact-section" style={{ paddingLeft: 0, paddingRight: 0, marginTop: '1rem' }}>
              <h2 className="gp-section-title">Contact</h2>
              <div className="gp-contact-stack">
                {displayPhone && (
                  <a href={`tel:${displayPhone}`} className="gp-link">
                    <span className="gp-link-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <span className="gp-link-text">{displayPhone}</span>
                  </a>
                )}
                {displayEmail && (
                  <a href={`mailto:${displayEmail}`} className="gp-link">
                    <span className="gp-link-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <span className="gp-link-text">{displayEmail}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="gp-footer">
          <span>Powered by <a href="/">Nano Profiles</a></span>
        </div>

        {/* Gallery Modal */}
        {galleryModalIndex !== null && galleryItems[galleryModalIndex] && (
          <div className="gp-photo-modal" onClick={() => setGalleryModalIndex(null)}>
            <div className="gp-modal-overlay" />
            <button type="button" className="gp-modal-close">×</button>
            <img
              src={fixImageUrl(galleryItems[galleryModalIndex].url) || galleryItems[galleryModalIndex].url}
              alt=""
              className="gp-modal-img"
            />
          </div>
        )}

        {/* Menu Modal */}
        {showMenuViewer && profile.menuPdf && (
          <div className="gp-menu-modal">
            <div className="gp-modal-overlay" onClick={closeMenuViewer} />
            <div className="gp-menu-book">
              <div className="gp-menu-topbar">
                <span className="gp-menu-title">Menu</span>
                <div className="gp-menu-topbar-right">
                  <span className="gp-menu-page-indicator">
                    {menuTotalPages ? `${menuPage} / ${menuTotalPages}` : '...'}
                  </span>
                  <button className="gp-menu-close" onClick={closeMenuViewer}>✕</button>
                </div>
              </div>
              <div
                className={`gp-menu-page-shell ${pageTurnDir === 'next' ? 'turn-next' : pageTurnDir === 'prev' ? 'turn-prev' : ''}`}
                onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
                onTouchEnd={e => {
                  if (!touchStartX) return;
                  const diff = touchStartX - e.changedTouches[0].clientX;
                  if (diff > 40) turnPage('next');
                  else if (diff < -40) turnPage('prev');
                  setTouchStartX(null);
                }}
              >
                <Document
                  file={profile.menuPdf}
                  onLoadSuccess={({ numPages }) => setMenuTotalPages(numPages)}
                  loading={<div className="gp-menu-loading">Loading menu...</div>}
                  error={<div className="gp-menu-error">Failed to load menu PDF.</div>}
                >
                  <Page
                    pageNumber={menuPage}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={Math.min(window.innerWidth * 0.85, 600)}
                  />
                </Document>
              </div>
              {menuTotalPages > 1 && (
                <div className="gp-menu-controls">
                  <button onClick={() => turnPage('prev')} disabled={menuPage <= 1}>← Prev</button>
                  <button onClick={() => turnPage('next')} disabled={menuPage >= menuTotalPages}>Next →</button>
                </div>
              )}
              {menuTotalPages > 1 && <p className="gp-menu-hint">Swipe to turn pages</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GeneralProfileView;
