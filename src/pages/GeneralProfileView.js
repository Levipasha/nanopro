import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { generalProfileAPI } from '../services/api';
import { fixImageUrl } from '../utils/imageHelper';
import { getLinkIcon, getMenuPdfIcon } from '../components/LinkIcons';
import { getThemeById, resolveFontFamily } from '../constants/generalThemes';
import { Helmet } from 'react-helmet-async';
import './GeneralProfileView.css';
import { useShowcaseEmbedHeight } from '../hooks/useShowcaseEmbedHeight';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function GeneralProfileView() {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === '1';
  const isEmbed = searchParams.get('embed') === '1';
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [showEnlarged, setShowEnlarged] = useState(false);
  const [showMenuViewer, setShowMenuViewer] = useState(false);
  const [menuPage, setMenuPage] = useState(1);
  const [menuTotalPages, setMenuTotalPages] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [pageTurnDir, setPageTurnDir] = useState('');

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
        theme: 'mint',
        font: 'outfit',
        bioFont: 'outfit',
        links: [
          { title: 'Instagram', url: 'https://instagram.com/exampleinsta', platform: 'instagram', order: 0 },
          { title: 'WhatsApp', url: 'https://wa.me/9183746501', platform: 'whatsapp', order: 1 },
          { title: 'Website', url: 'https://example.com', platform: 'website', order: 2 }
        ],
        social: {}
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

  const handleShare = async () => {
    const url = window.location.href;
    const shareTitle = `${profile?.name || 'Profile'} | Nano Profiles`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out ${profile?.name || 'this'} profile on Nano Profiles!`,
          url
        });
      } catch (err) {
        if (err.name !== 'AbortError') copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

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
      <div className="gp-view gp-loading">
        <DotLottieReact
          src="https://lottie.host/70c04cf5-4bee-45cf-a8a3-e1e67345a066/X8rq0FUjaj.lottie"
          loop
          autoplay
          style={{ width: 200, height: 200 }}
        />
        <p>Loading profile...</p>
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

  const links = (profile.links || []).filter(l => l.url).sort((a, b) => (a.order || 0) - (b.order || 0));
  const theme = getThemeById(profile.theme || 'mint');
  const bioLines = String(profile.bio || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const extractedPhoneFromBio = bioLines.find((line) => line.startsWith('📞')) || '';
  const extractedEmailFromBio = bioLines.find((line) => line.startsWith('✉')) || '';
  const cleanBio = bioLines
    .filter((line) => !line.startsWith('📞') && !line.startsWith('✉'))
    .join('\n')
    .trim();
  const restaurantPhone = (extractedPhoneFromBio.replace(/^📞\s*/, '') || '').trim();
  const restaurantEmail = (extractedEmailFromBio.replace(/^✉\s*/, '') || '').trim();



  const activeHeadingFont = profile.font || 'outfit';
  const activeBodyFont = profile.bioFont || activeHeadingFont;

  return (
    <div className={`gp-view gp-layout${isEmbed ? ' gp-embed-showcase' : ''}`}>
      <Helmet>
        <title>{`${profile?.name || 'Profile'} | Nano Profiles`}</title>
        <meta name="description" content={profile?.title || profile?.bio || 'Smart Digital Identity Solutions'} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={`${profile?.name || 'Profile'} | Nano Profiles`} />
        <meta property="og:description" content={profile?.title || 'Smart Digital Identity Solutions'} />
        <meta property="og:image" content={fixImageUrl(profile?.photo) || profile?.photo} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={window.location.href} />
        <meta name="twitter:title" content={`${profile?.name || 'Profile'} | Nano Profiles`} />
        <meta name="twitter:description" content={profile?.title || 'Smart Digital Identity Solutions'} />
        <meta name="twitter:image" content={fixImageUrl(profile?.photo) || profile?.photo} />
      </Helmet>

      <div
        className={`gp-card gp-card-themed ${theme.isAnimated ? theme.className : ''}`}
        style={{
          background: theme.isAnimated ? undefined : theme.bg,
          color: theme.text,
          '--font-heading': resolveFontFamily(activeHeadingFont),
          '--font-body': resolveFontFamily(activeBodyFont)
        }}>
        {/* Share button - top right */}
        <button type="button" onClick={handleShare} className="gp-share-btn" aria-label="Share">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>

        {/* Profile photo - full width header with overlay */}
        <div className="gp-photo-header">
          {profile.photo && !imgError ? (
            <img
              src={fixImageUrl(profile.photo) || profile.photo}
              alt={profile.name}
              className="gp-avatar-img"
              onError={() => setImgError(true)}
              onClick={() => setShowEnlarged(true)}
              title="Click to enlarge"
            />
          ) : (
            <div className="gp-avatar-placeholder gp-avatar-placeholder-header">
              {profile.name?.charAt(0) || '?'}
            </div>
          )}
          <div className="gp-photo-overlay">
            {profile.name && <h1 className="gp-name">{profile.name}</h1>}
            {profile.title && (
              <p className="gp-title-overlay">{profile.title}</p>
            )}
          </div>
        </div>

        {/* Username - @username */}
        <p className="gp-username">@{profile.username}</p>

        {/* Bio */}
        {cleanBio && (
          <p className="gp-bio">{cleanBio}</p>
        )}

        {/* Contact + link buttons (same .gp-link sizing for all rows) */}
        {(restaurantPhone || restaurantEmail || profile.menuPdf || links.length > 0) && (
        <div className="gp-links">
          {profile.menuPdf && (
            <a
              role="button"
              tabIndex={0}
              href="#menu"
              className="gp-link gp-link-menu gp-link-menu-cta"
              aria-label="See my menu"
              style={{ background: theme.linkBg || theme.bg, color: theme.text, borderColor: theme.text }}
              onClick={(e) => {
                e.preventDefault();
                openMenuViewer();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openMenuViewer();
                }
              }}
            >
              <span className="gp-link-icon">{getMenuPdfIcon()}</span>
              <span className="gp-link-text">See my menu</span>
            </a>
          )}
          {restaurantPhone && (
            <a
              href={`tel:${restaurantPhone}`}
              className="gp-link"
              style={{ color: theme.text, background: theme.linkBg || theme.bg, borderColor: theme.text }}
            >
              <span className="gp-link-icon" aria-hidden="true">📞</span>
              <span className="gp-link-text">{restaurantPhone}</span>
            </a>
          )}
          {restaurantEmail && (
            <a
              href={`mailto:${restaurantEmail}`}
              className="gp-link"
              style={{ color: theme.text, background: theme.linkBg || theme.bg, borderColor: theme.text }}
            >
              <span className="gp-link-icon" aria-hidden="true">✉</span>
              <span className="gp-link-text">{restaurantEmail}</span>
            </a>
          )}
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="gp-link"
              style={{ background: theme.linkBg || theme.bg, color: theme.text, borderColor: theme.text }}
            >
              <span className="gp-link-icon">{getLinkIcon(link)}</span>
              <span className="gp-link-text">{link.title || link.url}</span>
            </a>
          ))}
        </div>
        )}

        <div className="gp-footer">
          <span>Powered by <a href="https://nanoprofiles.com" target="_blank" rel="noopener noreferrer">NanoProfiles</a></span>
        </div>

        {/* Photo Enlarge Modal */}
        {showEnlarged && profile.photo && (
          <div className="gp-photo-modal" onClick={() => setShowEnlarged(false)}>
            <div className="gp-modal-overlay" />
            <button className="gp-modal-close" onClick={() => setShowEnlarged(false)} aria-label="Close">×</button>
            <img
              src={fixImageUrl(profile.photo) || profile.photo}
              alt={profile.name}
              className="gp-modal-img"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Menu PDF Book Viewer */}
        {showMenuViewer && profile.menuPdf && (
          <div className="gp-menu-modal" onClick={closeMenuViewer}>
            <div className="gp-modal-overlay" />
            <div className="gp-menu-book" onClick={(e) => e.stopPropagation()}>
              <button className="gp-menu-close" onClick={closeMenuViewer} aria-label="Close menu viewer">×</button>

              <div className="gp-menu-topbar">
                <span className="gp-menu-title">Menu Preview</span>
                <span className="gp-menu-page-indicator">
                  Page {menuPage}{menuTotalPages ? ` / ${menuTotalPages}` : ''}
                </span>
              </div>

              <div
                className={`gp-menu-page-shell ${pageTurnDir ? `turn-${pageTurnDir}` : ''}`}
                onTouchStart={(e) => setTouchStartX(e.changedTouches[0].clientX)}
                onTouchEnd={(e) => {
                  if (touchStartX == null) return;
                  const dx = e.changedTouches[0].clientX - touchStartX;
                  if (dx < -40) turnPage('next');
                  if (dx > 40) turnPage('prev');
                  setTouchStartX(null);
                }}
              >
                <Document
                  file={profile.menuPdf}
                  onLoadSuccess={({ numPages }) => {
                    setMenuTotalPages(numPages || 0);
                    if (menuPage > numPages) setMenuPage(1);
                  }}
                  loading={<div className="gp-menu-loading">Loading menu...</div>}
                  error={<div className="gp-menu-error">Unable to load this menu PDF.</div>}
                >
                  <Page pageNumber={menuPage} width={Math.min(window.innerWidth * 0.82, 720)} />
                </Document>
              </div>

              <div className="gp-menu-controls">
                <button type="button" onClick={() => turnPage('prev')} disabled={menuPage <= 1}>◀ Prev</button>
                <button type="button" onClick={() => turnPage('next')} disabled={menuTotalPages ? menuPage >= menuTotalPages : true}>Next ▶</button>
              </div>
              <p className="gp-menu-hint">Swipe left/right to flip pages like a book.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GeneralProfileView;
