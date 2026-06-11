import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
  const [success, setSuccess] = useState('');

  useShowcaseEmbedHeight(isEmbed);

  useEffect(() => {
    if (isMock) {
      if (username === 'mock-professional' || username === 'mock-general' || searchParams.get('type') === 'professional') {
        const MOCK_PROFESSIONAL = {
          username: 'mock-professional',
          name: 'Devon Webb',
          title: 'Product Designer & Developer',
          bio: 'Crafting digital experiences and smart identity solutions. Helping teams build modern web applications and premium design systems.',
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop',
          profileType: 'professional',
          theme: 'custom-theme',
          font: 'outfit',
          bioFont: 'outfit',
          links: [
            { title: 'Instagram', url: 'https://instagram.com/devonwebb', platform: 'instagram', order: 0 },
            { title: 'LinkedIn', url: 'https://linkedin.com/in/devonwebb', platform: 'linkedin', order: 1 },
            { title: 'Twitter', url: 'https://x.com/devonwebb', platform: 'twitter', order: 2 },
            { title: 'Portfolio', url: 'https://example.com', platform: 'website', order: 3 }
          ],
          social: {},
          gallery: []
        };

        setProfile(MOCK_PROFESSIONAL);
        setError(null);
        setLoading(false);
        return;
      }

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

  // Inject helper style tags if loaded inside an iframe (visual editor mode)
  useEffect(() => {
    try {
      if (window.self !== window.top) {
        const style = document.createElement('style');
        style.innerHTML = `
          html, body {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }

          /* Visual outlines for editable elements inside the iframe */
          .hero-name-block h1,
          .name-eyebrow,
          .roles,
          .hero-profile-image,
          .about-section,
          .connect-section,
          .services-grid,
          .hero {
            transition: all 0.2s ease-in-out !important;
            position: relative !important;
          }

          .hero-name-block h1:hover,
          .name-eyebrow:hover,
          .roles:hover,
          .hero-profile-image:hover,
          .about-section:hover,
          .connect-section:hover,
          .services-grid:hover {
            outline: 2px dashed #2563eb !important;
            outline-offset: 6px !important;
            cursor: pointer !important;
            opacity: 0.95 !important;
          }
        `;
        document.head.appendChild(style);
      }
    } catch (e) {
      console.warn('Iframe helper styles initialization issue:', e);
    }
  }, []);

  // Handle click events on elements when loaded inside an iframe (visual editor mode)
  useEffect(() => {
    if (window.self === window.top) return;

    const handleIframeClick = (e) => {
      // 1. Location Eyebrow
      const locEl = e.target.closest('.name-eyebrow');
      if (locEl) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: 'PREVIEW_CLICK', field: 'location' }, '*');
        return;
      }

      // 2. Badges / Tag pills
      const tagsEl = e.target.closest('.roles') || e.target.closest('.role-pill');
      if (tagsEl) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: 'PREVIEW_CLICK', field: 'tags' }, '*');
        return;
      }

      // 3. Name (H1 or Name Block)
      const nameEl = e.target.closest('.hero-name-block h1') || e.target.closest('.hero-name-block');
      if (nameEl) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: 'PREVIEW_CLICK', field: 'name' }, '*');
        return;
      }

      // 4. Profile Photo (Avatar)
      const photoEl = e.target.closest('.hero-profile-image');
      if (photoEl) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: 'PREVIEW_CLICK', field: 'photo' }, '*');
        return;
      }

      // 5. About / Bio Section
      const aboutEl = e.target.closest('.about-section');
      if (aboutEl) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: 'PREVIEW_CLICK', field: 'about' }, '*');
        return;
      }

      // 6. Connect / Social Links Section
      const connectEl = e.target.closest('.connect-section');
      if (connectEl) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: 'PREVIEW_CLICK', field: 'links' }, '*'); // Open Links tab
        return;
      }

      // 7. Suggestions / What I Do Section
      const serviceCard = e.target.closest('.service-card') || e.target.closest('.services-grid');
      if (serviceCard) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: 'PREVIEW_CLICK', field: 'suggestions' }, '*'); // Open What I Do tab
        return;
      }

      // 8. Gallery Section
      const galleryEl = e.target.closest('.gp-gallery-section') || e.target.closest('.gp-gallery-grid-general');
      if (galleryEl) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: 'PREVIEW_CLICK', field: 'gallery' }, '*');
        return;
      }

      // 9. Design Customization (Hero empty space)
      const heroEl = e.target.closest('.hero');
      if (heroEl) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: 'PREVIEW_CLICK', field: 'design' }, '*'); // Open Design tab
        return;
      }
    };

    document.addEventListener('click', handleIframeClick, true);
    return () => document.removeEventListener('click', handleIframeClick, true);
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'DRAFT_UPDATE') {
        setProfile(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            ...event.data.data
          };
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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

  // Tell the parent dashboard when the profile is fully loaded and ready to show
  useEffect(() => {
    if (!loading && profile) {
      try { window.parent.postMessage({ type: 'PROFILE_READY' }, '*'); } catch (e) {}
    }
  }, [loading, profile]);

  if (loading) {
    return null;
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
  const isRestaurant = profile?.profileType === 'restaurant';
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

  const currentThemeId = themeOverride === 'light' ? 'grey' : (profile?.theme || 'midnight');
  const resolvedTheme = getThemeById(currentThemeId);
  const themeBg = themeOverride === 'light' ? '#ffffff' : (resolvedTheme?.bg || '#F7F3EE');
  const themeText = themeOverride === 'light' ? '#0A0A0A' : (resolvedTheme?.text || '#0A0A0A');
  const themeLinkBg = themeOverride === 'light' ? 'rgba(0,0,0,0.05)' : (resolvedTheme?.linkBg || 'rgba(255,255,255,0.08)');
  const isTextDark = themeOverride === 'light' ? true : !resolvedTheme.isDark;

  const linkedArtItems = profile?.artLinks
    ? (Array.isArray(profile.artLinks) ? profile.artLinks : Object.values(profile.artLinks))
    : [];

  const services = linkedArtItems.filter(item => item.itemType === 'service');
  const artworks = linkedArtItems.filter(item => item.itemType === 'artwork' || !item.itemType);

  const suggestions = services.length > 0
    ? services.map(s => ({
        url: (s.images && s.images[0]) || s.image || '',
        caption: s.title || '',
        description: s.description || '',
        link: s.link || ''
      }))
    : (Array.isArray(profile.suggestions) ? profile.suggestions : []);

  // Extract primary links identical to Artist view
  const primaryLinks = [];
  if (Array.isArray(profile.links)) {
    profile.links.forEach((l) => {
      if (!l.url) return;
      const platform = (l.platform || '').toLowerCase();
      const id = platform || (l.title || '').toLowerCase().replace(/\s+/g, '_');
      
      let formattedUrl = l.url;
      if (platform && !formattedUrl.startsWith('http')) {
        if (platform === 'instagram') {
          formattedUrl = `https://instagram.com/${formattedUrl.replace('@', '')}`;
        } else if (platform === 'facebook') {
          formattedUrl = `https://facebook.com/${formattedUrl}`;
        } else if (platform === 'twitter' || platform === 'x') {
          formattedUrl = `https://x.com/${formattedUrl.replace('@', '')}`;
        } else if (platform === 'linkedin') {
          formattedUrl = `https://linkedin.com/in/${formattedUrl}`;
        } else if (platform === 'whatsapp') {
          const clean = formattedUrl.replace(/\D/g, '');
          if (clean) formattedUrl = `https://wa.me/${clean}`;
        } else {
          formattedUrl = `https://${formattedUrl}`;
        }
      } else if (!formattedUrl.startsWith('http') && !formattedUrl.startsWith('mailto:') && !formattedUrl.startsWith('tel:')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      primaryLinks.push({
        id,
        title: l.title || displayGeneralLinkLabel(l),
        url: formattedUrl,
        image: l.image,
        prioritizeType: l.prioritizeType || 'none',
        animationType: l.animationType || 'buzz',
        layoutType: l.layoutType || (l.image ? 'featured' : 'classic')
      });
    });
  }

  if (displayEmail && profile.showEmail !== false) {
    if (!primaryLinks.some(pl => pl.id === 'email')) {
      primaryLinks.push({
        id: 'email',
        title: 'Email',
        url: `mailto:${displayEmail}`,
      });
    }
  }


  // 1. RENDER RESTAURANT PUBLIC VIEW
  if (isRestaurant) {
    return (
      <div className={`gp-view gp-layout gp-artist-themed gp-general-view gp-profile-restaurant${isEmbed ? ' gp-embed-showcase' : ''}`} style={{ background: theme.isAnimated ? undefined : theme.bg }}>
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
                    setThemeOverride(null);
                  } else {
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

          <div className="gp-restaurant-header-info">
            <h1 className="gp-name">{profile.name}</h1>
            <div className="gp-username-row">
              <span className="gp-username-display">@{profile?.username || username}</span>
              {profile.title && (
                <>
                  <span className="gp-sep">/</span>
                  <span className="gp-tagline">{profile.title.replace('|', ' ')}</span>
                </>
              )}
            </div>
          </div>

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
            {Array.isArray(suggestions) && suggestions.length > 0 && (
              <div className="gp-section gp-suggestions-section" style={{ paddingLeft: 0, paddingRight: 0, marginBottom: '2rem' }}>
                <h2 className="gp-section-title">{profile.suggestionsTitle || 'What I Do'}</h2>
                <div className="gp-gallery-grid-general">
                  {suggestions.map((sug, idx) => {
                    if (!sug) return null;
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
                {links.map((link, idx) => {
                  const hasImage = link.image && link.image.trim() !== '';
                  const isFeatured = hasImage && link.layoutType !== 'classic';

                  if (isFeatured) {
                    return (
                      <a
                        key={idx}
                        href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gp-link-featured-style-new"
                        style={{
                          display: 'block',
                          background: '#ffffff',
                          borderRadius: '24px',
                          padding: '12px',
                          textDecoration: 'none',
                          transition: 'transform 0.25s ease',
                          position: 'relative',
                          border: '1px solid rgba(0,0,0,0.08)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                          marginBottom: '16px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <div style={{
                          width: '100%',
                          aspectRatio: '16/10',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          marginBottom: '16px'
                        }}>
                          <img 
                            src={link.image} 
                            alt={link.title || 'Featured Link'} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px 8px 8px', minWidth: 0 }}>
                          <span style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: '500',
                            fontSize: '16px',
                            color: '#1a1a1a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {link.title || displayGeneralLinkLabel(link)}
                          </span>
                          <div style={{ position: 'absolute', right: '24px', color: '#a3a3a3', display: 'flex', alignItems: 'center' }}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                              <circle cx="12" cy="5" r="1.5" />
                              <circle cx="12" cy="12" r="1.5" />
                              <circle cx="12" cy="19" r="1.5" />
                            </svg>
                          </div>
                        </div>
                      </a>
                    );
                  }

                  return (
                    <a
                      key={idx}
                      href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gp-link-classic-style-new"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ffffff',
                        borderRadius: '24px',
                        padding: '12px',
                        textDecoration: 'none',
                        transition: 'transform 0.25s ease',
                        position: 'relative',
                        minHeight: '68px',
                        width: '100%',
                        boxSizing: 'border-box',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                        marginBottom: '16px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {hasImage && (
                        <div style={{
                          position: 'absolute',
                          left: '12px',
                          top: '12px',
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1
                        }}>
                          <img 
                            src={link.image} 
                            alt="" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                          />
                        </div>
                      )}
                      <div style={{ 
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingLeft: hasImage ? '56px' : '24px',
                        paddingRight: '56px',
                        minWidth: 0
                      }}>
                        <span style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: '500',
                          fontSize: '16px',
                          color: '#1a1a1a',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {link.title || displayGeneralLinkLabel(link)}
                        </span>
                      </div>
                      <div style={{ position: 'absolute', right: '24px', color: '#a3a3a3', display: 'flex', alignItems: 'center' }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Contact section */}
            {((displayPhone && profile.showPhone !== false) || (displayEmail && profile.showEmail !== false)) && (
              <div className="gp-section gp-contact-section" style={{ paddingLeft: 0, paddingRight: 0, marginTop: '1rem' }}>
                <h2 className="gp-section-title">Contact</h2>
                <div className="gp-contact-stack">
                  {(displayPhone && profile.showPhone !== false) && (
                    <a href={`tel:${displayPhone}`} className="gp-link">
                      <span className="gp-link-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </span>
                      <span className="gp-link-text">{displayPhone}</span>
                    </a>
                  )}
                  {(displayEmail && profile.showEmail !== false) && (
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

  // 2. RENDER STANDARD PUBLIC PROFILE VIEW (Styled same-to-same as Artist profile)
  const isPreview = window.self !== window.top;

  const showPhotoEffectively = profile.photo && (profile.showPhoto !== false || isPreview);
  const showLocationEffectively = profile.showLocation !== false || isPreview;
  const showNameEffectively = profile.showName !== false || isPreview;
  const showSpecializationEffectively = profile.showSpecialization !== false || isPreview;
  const showAboutEffectively = profile.showAbout !== false || isPreview;
  const showWhatIDoEffectively = profile.showWhatIDo !== false || isPreview;
  const showConnectEffectively = profile.showConnect !== false || isPreview;
  const showGalleryEffectively = profile.showGallery !== false || isPreview;

  const renderMiniHiddenBadge = (isShown) => {
    if (isShown) return null;
    return (
      <span style={{
        fontSize: '9px',
        background: '#ef4444',
        color: '#ffffff',
        padding: '2px 4px',
        borderRadius: '2px',
        fontWeight: 'bold',
        marginLeft: '8px',
        textTransform: 'uppercase',
        fontFamily: 'sans-serif',
        verticalAlign: 'middle',
        display: 'inline-block',
        lineHeight: 1
      }}>
        Hidden
      </span>
    );
  };

  return (
    <div className={`artist-public-container ${resolvedTheme?.className || ''}`}>
      {success && (
        <div className="profile-success-overlay" role="dialog" aria-live="polite" onClick={() => setSuccess('')} style={{ zIndex: 10000 }}>
          <div className="profile-success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-success-icon-wrap" style={{ background: 'rgba(200,0,26,0.1)', color: '#C8001A' }}>
              <svg className="profile-success-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 className="profile-success-title" style={{ color: '#0f172a' }}>Saved</h2>
            <p className="profile-success-message" style={{ color: '#64748b' }}>{success}</p>
            <button type="button" className="profile-success-ok" onClick={() => setSuccess('')} style={{ background: '#C8001A', color: '#fff' }}>OK</button>
          </div>
        </div>
      )}

      <div 
        className="artist-public-wrapper"
        style={{
          '--cream': themeBg,
          '--cream2': themeBg,
          '--ink': themeText,
          '--ink2': themeText,
          '--red': themeLinkBg,
          '--red2': themeLinkBg,
          '--border': isTextDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
          '--border-light': isTextDark ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
          '--font-heading': resolveFontFamily(activeHeadingFont),
          '--font-body': resolveFontFamily(activeBodyFont)
        }}
      >
        <Helmet>
          <title>{nanoProfilesPageTitle}</title>
          <meta name="description" content={`Check out ${sharePrimaryName} Profile on Nano Profiles.`} />
        </Helmet>

        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-brand"><b>NANO</b>PROFILES</div>
          <div className="topbar-handle">
            <span className="live-dot"></span>
            @{profile.username || username}
          </div>
        </div>



        {/* HERO SECTION */}
        <section className="hero" style={{ minHeight: (showPhotoEffectively && !isEmbed) ? '100vh' : 'auto' }}>
          <div className="hero-bg-text">
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'P'}
          </div>

          {showPhotoEffectively && (
            <div style={{
              position: 'relative',
              width: '100%',
              marginTop: '16px',
              marginBottom: '20px',
              ...(profile.showPhoto === false ? { border: '2px dashed #ef4444', borderRadius: '4px', padding: '4px', boxSizing: 'border-box' } : {})
            }}>
              <img 
                src={fixImageUrl(profile.photo)} 
                alt={profile.name || 'Profile'} 
                className="hero-profile-image" 
                style={{ 
                  marginTop: 0, 
                  marginBottom: 0,
                  ...(profile.showPhoto === false ? { opacity: 0.6 } : {}) 
                }} 
              />
              {profile.showPhoto === false && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: '#ef4444',
                  color: '#ffffff',
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  zIndex: 10,
                  fontFamily: 'sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}>
                  Hidden
                </div>
              )}
            </div>
          )}

          <div className="hero-name-block">
            {showLocationEffectively && (
              <div 
                className="name-eyebrow" 
                style={{ 
                  color: 'var(--red)',
                  ...(profile.showLocation === false ? { 
                    opacity: 0.5, 
                    border: '1px dashed #ef4444', 
                    padding: '2px 6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    width: 'fit-content'
                  } : {})
                }}
              >
                {profile.city || profile.state ? (
                  <>{profile.city && `${profile.city.toUpperCase()} · `}{profile.state && `${profile.state.toUpperCase()} · `}INDIA</>
                ) : 'INDIA'}
                {renderMiniHiddenBadge(profile.showLocation !== false)}
              </div>
            )}
            
            {showNameEffectively && (
              <h1 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  ...(profile.showName === false ? { 
                    border: '1.5px dashed #ef4444', 
                    padding: '8px', 
                    borderRadius: '6px', 
                    opacity: 0.6 
                  } : {})
                }}
              >
                {profile.showName === false && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '8px',
                    background: '#ef4444',
                    color: '#ffffff',
                    padding: '1px 5px',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    borderRadius: '3px',
                    zIndex: 10,
                    textTransform: 'uppercase',
                    fontFamily: 'sans-serif'
                  }}>
                    Hidden
                  </div>
                )}
                {profile.name ? (
                  <>
                    {(() => {
                      let first, last;
                      if (profile.name.includes('|')) {
                        const parts = profile.name.split('|');
                        first = parts[0] || '';
                        last = parts[1] || '';
                      } else {
                        const parts = profile.name.split(' ');
                        first = parts[0] || '';
                        last = parts.slice(1).join(' ');
                      }

                      const firstLen = Math.max(1, first.length);
                      const firstScale = firstLen > 10 ? 10 / firstLen : 1;

                      const lastLen = Math.max(1, last.length);
                      const lastScale = lastLen > 10 ? 10 / lastLen : 1;

                      return (
                        <>
                          {first && (
                            <span style={{ 
                              color: 'var(--ink)', 
                              fontSize: `${firstScale}em`, 
                              lineHeight: 0.92,
                              textTransform: 'uppercase'
                            }}>
                              {first}
                            </span>
                          )}
                          {last && (
                            <em style={{ 
                              color: 'var(--red)', 
                              fontSize: `${lastScale}em`, 
                              lineHeight: 0.92,
                              textTransform: 'uppercase'
                            }}>
                              {last}
                            </em>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : 'PROFILE'}
              </h1>
            )}

            {/* Tag pills */}
            {showSpecializationEffectively && profile.specialization && (
              <div 
                className="roles" 
                style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  flexWrap: 'wrap', 
                  marginTop: '12px',
                  position: 'relative',
                  ...(profile.showSpecialization === false ? { 
                    border: '1.5px dashed #ef4444', 
                    padding: '8px', 
                    borderRadius: '6px', 
                    opacity: 0.6 
                  } : {})
                }}
              >
                {profile.showSpecialization === false && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '8px',
                    background: '#ef4444',
                    color: '#ffffff',
                    padding: '1px 5px',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    borderRadius: '3px',
                    zIndex: 10,
                    textTransform: 'uppercase',
                    fontFamily: 'sans-serif'
                  }}>
                    Hidden
                  </div>
                )}
                {profile.specialization.split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
                  <div
                    className="role-pill"
                    key={i}
                    style={{
                      textTransform: 'none',
                      fontSize: '15px',
                      fontWeight: '600',
                      padding: '4px 12px',
                      letterSpacing: '0.5px',
                      background: '#000000',
                      color: '#ffffff',
                      border: '1.5px solid #000000',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ABOUT */}
        {showAboutEffectively && cleanBio && (
          <section 
            className="section about-section" 
            style={{ 
              paddingTop: '36px',
              position: 'relative',
              ...(profile.showAbout === false ? { 
                opacity: 0.65, 
                borderBottom: '2px dashed #ef4444', 
                borderTop: '2px dashed #ef4444' 
              } : {})
            }}
          >
            {profile.showAbout === false && (
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '24px',
                background: '#ef4444',
                color: '#ffffff',
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '4px',
                zIndex: 10,
                fontFamily: 'sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}>
                Hidden from Public
              </div>
            )}
            <div className="section-head" style={{ marginBottom: '20px' }}>
              <div className="section-title" style={{ color: 'rgba(247,243,238,.6)', fontSize: '11px', letterSpacing: '4px' }}>About</div>
            </div>
            <div className="about-inner">
            <div className="about-label">
              {profile.title ? (
                (() => {
                  const parts = profile.title.split('|');
                  const part1 = parts[0] || '';
                  const part2 = parts.slice(1).join('|');
                  
                  if (part2) {
                    return (
                      <>
                        <span style={{ color: '#ffffff', whiteSpace: 'pre-wrap', textTransform: 'uppercase' }}>{part1}</span>
                        <br />
                        <em style={{ color: 'var(--red)', fontStyle: 'italic', textTransform: 'uppercase' }}>{part2}</em>
                      </>
                    );
                  }
                  return <span style={{ color: '#ffffff', whiteSpace: 'pre-wrap', textTransform: 'uppercase' }}>{part1}</span>;
                })()
              ) : (
                <><span style={{ color: '#ffffff', textTransform: 'uppercase' }}>A passionate</span><br /><em style={{ color: 'var(--red)', fontStyle: 'italic', textTransform: 'uppercase' }}>creative</em><br /><span style={{ color: '#ffffff', textTransform: 'uppercase' }}>mind.</span></>
              )}
            </div>
              <div className="about-body">
                {cleanBio}
              </div>
            </div>
          </section>
        )}
        {showAboutEffectively && cleanBio && <div className="divider"></div>}

        {/* WHAT I DO (Suggestions) */}
        {showWhatIDoEffectively && Array.isArray(suggestions) && suggestions.length > 0 && (
          <section 
            className="section" 
            style={{ 
              paddingTop: '50px',
              position: 'relative',
              ...(profile.showWhatIDo === false ? { 
                opacity: 0.65, 
                borderBottom: '2px dashed #ef4444', 
                borderTop: '2px dashed #ef4444' 
              } : {})
            }}
          >
            {profile.showWhatIDo === false && (
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '24px',
                background: '#ef4444',
                color: '#ffffff',
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '4px',
                zIndex: 10,
                fontFamily: 'sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}>
                Hidden from Public
              </div>
            )}
            <div className="section-head" style={{ marginBottom: '20px' }}>
              <div className="section-title" style={{ fontSize: '11px', letterSpacing: '4px' }}>{profile.suggestionsTitle || 'What I Do'}</div>
            </div>
            <div className="services-grid">
              {suggestions.map((sug, i) => {
                if (!sug) return null;
                const displayDesc = sug.description || (sug.link ? 'Click to visit' : 'View details');
                return (
                  <div 
                    className={`service-card ${!sug.link ? 'non-clickable' : ''}`}
                    key={i} 
                    onClick={sug.link ? () => {
                      window.open(sug.link.startsWith('http') ? sug.link : `https://${sug.link}`, '_blank');
                    } : undefined}
                  >
                    {sug.url && (
                      <img src={fixImageUrl(sug.url)} className="service-img-preview" alt="" />
                    )}
                    <div className="service-name">{sug.caption || 'Untitled'}</div>
                    <div className="service-desc">{displayDesc}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {showWhatIDoEffectively && suggestions && suggestions.length > 0 && <div className="divider"></div>}

        {/* CONNECT */}
        {showConnectEffectively && primaryLinks.length > 0 && (
          <section 
            className="section connect-section"
            style={{
              position: 'relative',
              ...(profile.showConnect === false ? { 
                opacity: 0.65, 
                borderBottom: '2px dashed #ef4444', 
                borderTop: '2px dashed #ef4444' 
              } : {})
            }}
          >
            {profile.showConnect === false && (
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '24px',
                background: '#ef4444',
                color: '#ffffff',
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '4px',
                zIndex: 10,
                fontFamily: 'sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}>
                Hidden from Public
              </div>
            )}
            <div className="section-head">
              <div className="section-title">Connect</div>
            </div>
            <div className="connect-cards">
              {primaryLinks.map((link, i) => {
                const fallbackTitle = link.id.charAt(0).toUpperCase() + link.id.slice(1);
                let displayValue = '';
                if (link.id === 'email') {
                  displayValue = link.url.replace('mailto:', '');
                } else if (link.id === 'phone') {
                  displayValue = link.url.replace('tel:', '');
                } else if (link.id === 'whatsapp') {
                  displayValue = 'Message Us';
                } else if (link.id === 'website' || link.id === 'portfolio') {
                  try {
                    displayValue = new URL(link.url).hostname.replace('www.', '');
                  } catch (e) {
                    displayValue = link.url.replace('https://', '').replace('http://', '');
                  }
                } else {
                  const cleanPart = link.url.split('/').pop() || '';
                  const socialPlatforms = ['instagram', 'twitter', 'tiktok', 'snapchat', 'threads'];
                  if (socialPlatforms.includes(link.id)) {
                    displayValue = cleanPart.startsWith('@') ? cleanPart : `@${cleanPart}`;
                  } else {
                    displayValue = cleanPart || link.title || link.url;
                  }
                }

                const hasImage = link.image && link.image.trim() !== '';
                const isFeatured = hasImage && link.layoutType !== 'classic';

                if (isFeatured) {
                  return (
                    <a 
                      className={`connect-card-image-style ${link.prioritizeType === 'animate' ? 'nano-anim-' + link.animationType : ''}`} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      key={i}
                      style={{
                        display: 'block',
                        background: '#ffffff',
                        borderRadius: '24px',
                        padding: '12px',
                        textDecoration: 'none',
                        transition: 'transform 0.25s ease',
                        position: 'relative',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                        marginBottom: '16px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{
                        width: '100%',
                        aspectRatio: '16/10',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        marginBottom: '16px'
                      }}>
                        <img 
                          src={link.image} 
                          alt={link.title || fallbackTitle} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px 8px 8px', minWidth: 0 }}>
                        <span style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: '500',
                          fontSize: '16px',
                          color: '#1a1a1a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {link.title || fallbackTitle}
                        </span>
                        <div style={{ position: 'absolute', right: '24px', color: '#a3a3a3', display: 'flex', alignItems: 'center' }}>
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <circle cx="12" cy="5" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </div>
                      </div>
                    </a>
                  );
                }

                return (
                  <a 
                    className={`connect-card-classic-style ${link.prioritizeType === 'animate' ? 'nano-anim-' + link.animationType : ''}`} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#ffffff',
                      borderRadius: '24px',
                      padding: '12px',
                      textDecoration: 'none',
                      transition: 'transform 0.25s ease',
                      position: 'relative',
                      minHeight: '68px',
                      width: '100%',
                      boxSizing: 'border-box',
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                      marginBottom: '16px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {hasImage && (
                      <div style={{
                        position: 'absolute',
                        left: '12px',
                        top: '12px',
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1
                      }}>
                        <img 
                          src={link.image} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                        />
                      </div>
                    )}
                    <div style={{ 
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingLeft: hasImage ? '56px' : '24px',
                      paddingRight: '56px',
                      minWidth: 0
                    }}>
                      <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: '500',
                        fontSize: '16px',
                        color: '#1a1a1a',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {link.title || fallbackTitle}
                      </span>
                    </div>
                    <div style={{ position: 'absolute', right: '24px', color: '#a3a3a3', display: 'flex', alignItems: 'center' }}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Gallery section - Polaroid Style */}
        {showGalleryEffectively && galleryItems.length > 0 && (
          <>
            <div className="divider"></div>
            <section 
              className="section gp-gallery-section" 
              style={{ 
                paddingTop: '50px',
                position: 'relative',
                ...(profile.showGallery === false ? { 
                  opacity: 0.65, 
                  borderBottom: '2px dashed #ef4444', 
                  borderTop: '2px dashed #ef4444' 
                } : {})
              }}
            >
              {profile.showGallery === false && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '24px',
                  background: '#ef4444',
                  color: '#ffffff',
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  zIndex: 10,
                  fontFamily: 'sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}>
                  Hidden from Public
                </div>
              )}
              <div className="section-head" style={{ marginBottom: '20px' }}>
                <div className="section-title" style={{ fontSize: '11px', letterSpacing: '4px' }}>GALLERY</div>
              </div>
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
            </section>
          </>
        )}

        {/* FOOTER */}
        <footer className="profile-card-footer" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', width: '100%' }}>
            <div>
              <div className="profile-card-footer-headline">Create your profile in the nanoprofiles.com</div>
              <div className="profile-card-footer-sub" style={{ fontSize: '12px', color: 'var(--ink)', marginTop: '8px', opacity: 0.65 }}>NANOPROFILES.COM · Curating Creative Expression</div>
            </div>
            <button
              className="profile-card-footer-cta"
              style={{
                background: 'var(--red)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '100px',
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                transition: 'all 0.2s'
              }}
              onClick={() => {
                window.open('https://nanoprofiles.com', '_blank');
              }}
            >
              Get Started →
            </button>
          </div>
        </footer>

        {/* Gallery Modal */}
        {galleryModalIndex !== null && galleryItems[galleryModalIndex] && (
          <div className="gp-photo-modal" onClick={() => setGalleryModalIndex(null)} style={{ zIndex: 10000 }}>
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
