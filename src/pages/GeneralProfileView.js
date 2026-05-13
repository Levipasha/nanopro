import React, { useState, useEffect } from 'react';
import { DotLottieReact as BrandLoader } from '@lottiefiles/dotlottie-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { pdfjs } from 'react-pdf';
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
function displayGeneralLinkLabel(link) {
  const t = (link?.title || '').trim();
  if (!t) return link?.url || '';
  if (/^google_maps$/i.test(t) || t === 'Google_maps') return 'Google Maps';
  return t;
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
  // const [imgError, setImgError] = useState(false);
  // const [showEnlarged, setShowEnlarged] = useState(false);
  // const [showMenuViewer, setShowMenuViewer] = useState(false);
  // const [menuPage, setMenuPage] = useState(1);
  // const [menuTotalPages, setMenuTotalPages] = useState(0);
  // const [touchStartX, setTouchStartX] = useState(null);
  // const [pageTurnDir, setPageTurnDir] = useState('');
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

  // const openMenuViewer = () => {
  //   setMenuPage(1);
  //   setShowMenuViewer(true);
  // };

  // const closeMenuViewer = () => {
  //   setShowMenuViewer(false);
  //   setPageTurnDir('');
  // };

  // const turnPage = (direction) => {
  //   if (!menuTotalPages) return;
  //   const nextPage = direction === 'next'
  //     ? Math.min(menuPage + 1, menuTotalPages)
  //     : Math.max(menuPage - 1, 1);
  //   if (nextPage === menuPage) return;
  //   setPageTurnDir(direction);
  //   setMenuPage(nextPage);
  //   window.setTimeout(() => setPageTurnDir(''), 220);
  // };

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

  const links = (profile.links || []).filter(l => l.url).sort((a, b) => (a.order || 0) - (b.order || 0));
  const theme = getThemeById(themeOverride || profile.theme || 'midnight');
  const bioLines = String(profile.bio || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const cleanBio = bioLines
    .filter((line) => !line.startsWith('📞') && !line.startsWith('✉'))
    .join('\n')
    .trim();

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
    <div className={`gp-view gp-layout gp-artist-themed${isEmbed ? ' gp-embed-showcase' : ''}`}>
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

        {/* Hero Section - Matches Artist Profile Style */}
        <div className="gp-artist-hero">
          <div className="gp-artist-hero-overlay-wrap">
            <div className="gp-artist-hero-toggle-wrap">
              <SkyToggle
                checked={theme.id !== 'light'}
                onChange={(e) => {
                  setThemeOverride(e.target.checked ? 'midnight' : 'light');
                }}
              />
            </div>
            <img 
              src={fixImageUrl(profile.banner || profile.photo) || profile.banner || profile.photo} 
              alt="" 
              className="gp-artist-hero-bg"
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, black 45%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, black 45%, transparent 100%)'
              }}
            />
            <div className="gp-artist-hero-fade" />
          </div>

          <div className="gp-artist-hero-content">
            <div className="gp-artist-hero-name-row">
              <h1 className="gp-artist-hero-name">{profile.name}</h1>
            </div>
            <p className="gp-artist-hero-username">@{profile.username}</p>
          </div>
        </div>

        <div className="gp-content-wrap">
          {/* About section */}
          {(cleanBio || profile.title) && (
            <div className="gp-section gp-about-section" style={{ paddingLeft: 0, paddingRight: 0, marginTop: '0' }}>
              <div className="gp-about-header">
                <h2 className="gp-section-title">About</h2>
                {profile.title && (
                  <div className="gp-about-meta">
                    <span>{profile.title}</span>
                  </div>
                )}
              </div>
              {cleanBio && <p className="gp-bio">{cleanBio}</p>}
            </div>
          )}

          {/* Gallery section - Polaroid Style */}
          {galleryItems.length > 0 && (
            <div className="gp-section gp-gallery-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <h2 className="gp-section-title">Gallery</h2>
              <div className="gp-gallery-grid-artist">
                {galleryItems.map((g, idx) => {
                  const rotation = (idx % 2 === 0 ? -1.5 : 1.5);
                  return (
                    <div
                      key={`${g.url}-${idx}`}
                      className="gp-gallery-polaroid-item"
                      style={{ transform: `rotate(${rotation}deg)` }}
                      onClick={() => setGalleryModalIndex(idx)}
                    >
                      <div className="gp-gallery-polaroid-frame">
                        <img src={fixImageUrl(g.url) || g.url} alt={g.name || ''} loading="lazy" />
                      </div>
                      <div className="gp-gallery-polaroid-caption">
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
            <div className="gp-links" style={{ paddingLeft: 0, paddingRight: 0, marginTop: '1.5rem' }}>
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
      </div>
    </div>
  );
}

export default GeneralProfileView;
