import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams, Link } from 'react-router-dom';
import './ArtistPublicView.css';
import { landingArtistAPI } from '../services/api';
import { getLinkIcon } from '../components/LinkIcons';
import { getThemeById, resolveFontFamily } from '../constants/generalThemes';
import { useShowcaseEmbedHeight } from '../hooks/useShowcaseEmbedHeight';
import { Helmet } from 'react-helmet-async';
import { fixImageUrl } from '../utils/imageHelper';

/**
 * Public artist profile route used for share links.
 * URL shape: /artist/:artistId or /artist?id=<artistId>
 */
const formatSentenceCase = (text) => {
  if (!text) return '';
  let formatted = text.replace(/,([^\s])/g, ', $1');
  formatted = formatted.replace(/^(\s*)([a-z])/i, (match, space, letter) => space + letter.toUpperCase());
  formatted = formatted.replace(/(\.\s*)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
  return formatted;
};

function ArtistPublicView() {
  const navigate = useNavigate();
  const { artistId: routeArtistId } = useParams();
  const [searchParams] = useSearchParams();
  const artistId = routeArtistId || searchParams.get('id');
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
    if (artist && artId) {
      const artItems = artist?.artLinks
        ? (Array.isArray(artist.artLinks) ? artist.artLinks : Object.values(artist.artLinks))
        : [];

      const targetArt = artItems.find(item => String(item.id) === String(artId));
      if (targetArt) {
        navigate('/show-my-art', {
          state: {
            artItems: [targetArt],
            artistName: artist.name
          }
        });
      }
    }
  }, [artist, artId, navigate]);

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
          .profile-card-footer,
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

          .profile-card-footer:hover {
            outline: 2px dashed #2563eb !important;
            outline-offset: -4px !important;
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

      // 2. Badges / Tags Roles
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
        window.parent.postMessage({ type: 'PREVIEW_CLICK', field: 'platforms' }, '*');
        return;
      }

      // 7. Services / Art Portfolio Showcase
      const serviceCard = e.target.closest('.service-card') || e.target.closest('.services-grid');
      if (serviceCard) {
        e.preventDefault();
        e.stopPropagation();
        const section = serviceCard.closest('.section');
        const titleEl = section?.querySelector('.section-title');
        const titleText = titleEl?.textContent || '';
        if (titleText.includes('What I Do')) {
          window.parent.postMessage({ type: 'PREVIEW_CLICK', field: 'what-i-do' }, '*');
        } else if (titleText.includes('Art Portfolio')) {
          window.parent.postMessage({ type: 'PREVIEW_CLICK', field: 'link-art' }, '*');
        } else {
          window.parent.postMessage({ type: 'PREVIEW_CLICK', field: 'what-i-do' }, '*');
        }
        return;
      }

      // 8. Footer / Art Portfolio Showcase
      const footerEl = e.target.closest('.profile-card-footer');
      if (footerEl) {
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
        window.parent.postMessage({ type: 'PREVIEW_CLICK', field: 'design' }, '*');
        return;
      }
    };

    // Use capturing phase so we intercept before standard navigation or click handlers
    document.addEventListener('click', handleIframeClick, true);
    return () => document.removeEventListener('click', handleIframeClick, true);
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'DRAFT_UPDATE') {
        setArtist(prev => {
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
        const msg = err.message || '';
        if (msg.toLowerCase().includes('not found') || msg.includes('404')) {
          navigate(`/link/${encodeURIComponent(artistId)}`, { replace: true });
          return;
        }
        setError(msg || 'Artist profile not found.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [artistId, isMock, navigate]);

  // Redirect to prioritized link if configured
  useEffect(() => {
    if (artist && Array.isArray(artist.links)) {
      const redirectLink = artist.links.find(l => l.prioritizeType === 'redirect');
      const hasNoRedirect = searchParams.get('no_redirect') === '1' || window.location.search.includes('no_redirect');
      if (redirectLink && redirectLink.url && !hasNoRedirect && !isMock) {
        let targetUrl = redirectLink.url;
        const platform = (redirectLink.platform || '').toLowerCase();
        
        if (platform && !targetUrl.startsWith('http')) {
          if (platform === 'instagram') {
            targetUrl = `https://instagram.com/${targetUrl.replace('@', '')}`;
          } else if (platform === 'facebook') {
            targetUrl = `https://facebook.com/${targetUrl}`;
          } else if (platform === 'twitter' || platform === 'x') {
            targetUrl = `https://x.com/${targetUrl.replace('@', '')}`;
          } else if (platform === 'linkedin') {
            targetUrl = `https://linkedin.com/in/${targetUrl}`;
          } else if (platform === 'whatsapp') {
            const clean = targetUrl.replace(/\D/g, '');
            if (clean) targetUrl = `https://wa.me/${clean}`;
          } else {
            targetUrl = `https://${targetUrl}`;
          }
        } else if (!targetUrl.startsWith('http') && !targetUrl.startsWith('mailto:') && !targetUrl.startsWith('tel:')) {
          targetUrl = `https://${targetUrl}`;
        }
        
        window.location.replace(targetUrl);
      }
    }
  }, [artist, isMock, searchParams]);

  // Tell the parent dashboard when the profile is fully loaded and ready to show
  useEffect(() => {
    if (!loading && artist) {
      try { window.parent.postMessage({ type: 'PROFILE_READY' }, '*'); } catch (e) {}
    }
  }, [loading, artist]);

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
    return null;
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
    // If showPhone is toggled off, hide WhatsApp
    if (field === 'whatsapp' && artist.showPhone === false) return;

    // Respect custom platform show/hide toggle
    if (artist[`show_${field}`] === false) return;

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

    let customTitle = field.charAt(0).toUpperCase() + field.slice(1);
    let customImage = null;
    let prioritizeType = 'none';
    let animationType = 'buzz';
    let layoutType = 'classic';
    if (Array.isArray(artist.links)) {
      const foundLink = artist.links.find(l => (l.platform || '').toLowerCase() === field.toLowerCase());
      if (foundLink && foundLink.title) {
        customTitle = foundLink.title;
      }
      if (foundLink && foundLink.image) {
        customImage = foundLink.image;
        layoutType = foundLink.layoutType || 'featured';
      }
      if (foundLink && foundLink.prioritizeType) {
        prioritizeType = foundLink.prioritizeType;
      }
      if (foundLink && foundLink.animationType) {
        animationType = foundLink.animationType;
      }
      if (foundLink && foundLink.layoutType) {
        layoutType = foundLink.layoutType;
      }
    }

    primaryLinks.push({
      id: field,
      title: customTitle,
      url,
      image: customImage,
      prioritizeType,
      animationType,
      layoutType
    });
  });

  // Also pull from the modern unified 'links' array if it exists
  if (Array.isArray(artist.links)) {
    artist.links.forEach((l, index) => {
      if (!l.url) return;
      const platform = (l.platform || '').toLowerCase();
      const id = platform || (l.title || '').toLowerCase().replace(/\s+/g, '_');

      // Respect custom platform show/hide toggle
      if (platform && artist[`show_${platform}`] === false) return;

      // Find the index of the first instance of this platform in artist.links
      const firstIdxOfPlatform = artist.links.findIndex(link => (link.platform || '').toLowerCase() === platform);

      // If this is the first instance, it is already added via field logic, so skip it to avoid duplication.
      // Otherwise, add it!
      if (index === firstIdxOfPlatform && primaryLinks.some(pl => pl.id === id)) {
        return;
      }

      // Format URL if it doesn't have a protocol prefix
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
        id: id || 'website',
        title: l.title || (id.charAt(0).toUpperCase() + id.slice(1)),
        url: formattedUrl,
        image: l.image,
        prioritizeType: l.prioritizeType || 'none',
        animationType: l.animationType || 'buzz',
        layoutType: l.layoutType || (l.image ? 'featured' : 'classic')
      });
    });
  }

  // Also push explicitly enabled Contact fields if they exist and are not already in primaryLinks
  if (artist.email && artist.showEmail !== false) {
    if (!primaryLinks.some(pl => pl.id === 'email')) {
      primaryLinks.push({
        id: 'email',
        title: 'Email',
        url: `mailto:${artist.email}`,
      });
    }
  }


  const getPlatformColor = (id) => {
    const colors = {
      instagram: '#E4405F',
      facebook: '#1877F2',
      twitter: '#000000',
      tiktok: '#000000',
      youtube: '#FF0000',
      whatsapp: '#25D366',
      snapchat: '#FFFC00',
      threads: '#000000',
      linkedin: '#0077B5',
      spotify: '#1DB954',
      pinterest: '#BD081C',
      telegram: '#0088CC',
      discord: '#5865F2',
      github: '#181717',
      twitch: '#9146FF',
    };
    return colors[id] || '#6366f1';
  };


  const linkedArtItems = artist?.artLinks
    ? (Array.isArray(artist.artLinks) ? artist.artLinks : Object.values(artist.artLinks))
    : [];

  // Partition artLinks based on itemType
  const services = linkedArtItems.filter(item => item.itemType === 'service');
  const artworks = linkedArtItems.filter(item => item.itemType === 'artwork' || !item.itemType);

  // For the public "What I Do" section:
  // Render only services. Artworks are kept exclusively in the dedicated Showcase gallery.
  const whatIDoItems = services;
  const showPortfolioSection = false;

  // Use ONLY artLinks (structured pieces) for the Art Gallery Page
  console.log("DEBUG ArtistPublicView:", {
    artistLinks: artist.links,
    primaryLinks: primaryLinks
  });
  const artItems = linkedArtItems;

  const hasContact = (artist.email && artist.showEmail !== false) || (artist.phone && artist.showPhone !== false);

  const getPrimaryContactLink = () => {
    if (artist.whatsapp && artist.showPhone !== false) {
      const clean = artist.whatsapp.replace(/\D/g, '');
      if (clean) return `https://wa.me/${clean}`;
    }
    if (artist.instagram) {
      return `https://instagram.com/${artist.instagram.replace('@', '')}`;
    }
    if (artist.email && artist.showEmail !== false) {
      return `mailto:${artist.email}`;
    }
    if (artist.website) {
      return artist.website;
    }
    return null;
  };

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
      const base = (process.env.REACT_APP_FRONTEND_URL || process.env.REACT_APP_NFC_FRONTEND_URL || window.location.origin).replace(/\/$/, '');
      url = `${base}/artist?id=${artist.artistId}${artId ? `&art=${artId}` : ''}`;
    }

    const shareTitle = `Check out ${sharePrimaryName} Profile on ${process.env.REACT_APP_SITE_NAME || 'Nano Profiles'}`;
    const shareText = `Discover ${sharePrimaryName}'s digital footprint on ${process.env.REACT_APP_SITE_NAME || 'Nano Profiles'}. Smart Digital Identity Solutions for modern creators and professionals. Create yours at ${process.env.REACT_APP_DOMAIN || 'nanoprofiles.com'}`;

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

  const isPreview = window.self !== window.top;

  const showPhotoEffectively = artist.photo && (artist.showPhoto !== false || isPreview);
  const showLocationEffectively = artist.showLocation !== false || isPreview;
  const showNameEffectively = artist.showName !== false || isPreview;
  const showSpecializationEffectively = artist.showSpecialization !== false || isPreview;
  const showAboutEffectively = artist.showAbout !== false || isPreview;
  const showWhatIDoEffectively = artist.showWhatIDo !== false || isPreview;
  const showConnectEffectively = artist.showConnect !== false || isPreview;
  const showArtPortfolioEffectively = artist.showArtPortfolio !== false || isPreview;

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
    <div className={`artist-public-container ${theme?.className || ''}`}>
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
          '--font-heading': resolveFontFamily(artist.profileFont || 'syne'),
          '--font-body': resolveFontFamily(artist.profileFont || 'syne')
        }}
      >

      <Helmet>
        <title>{nanoProfilesPageTitle}</title>
        <meta name="description" content={`Check out ${sharePrimaryName} Profile on Nano Profiles. ${[artist?.specialization, artist?.experience].filter(Boolean).join(' • ') || 'Smart Digital Identity Solutions'}.`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={`Check out ${sharePrimaryName} Profile on ${process.env.REACT_APP_SITE_NAME || 'Nano Profiles'}`} />
        <meta property="og:description" content={`Discover ${sharePrimaryName}'s digital footprint.`} />
        <meta property="og:image" content={fixImageUrl(artist?.photo) || artist?.photo} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={window.location.href} />
        <meta name="twitter:title" content={`Check out ${sharePrimaryName} Profile on Nano Profiles`} />
        <meta name="twitter:description" content={`Discover ${sharePrimaryName}'s digital footprint.`} />
        <meta name="twitter:image" content={fixImageUrl(artist?.photo) || artist?.photo} />
      </Helmet>

      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-brand"><b>NANO</b>PROFILES</div>
        <div className="topbar-handle">
          <span className="live-dot"></span>
          @{artist.username || artist.artistId}
        </div>
      </div>

      {/* HERO */}
      <section className="hero" style={{ minHeight: (showPhotoEffectively && !isEmbed) ? '100vh' : 'auto' }}>
        <div className="hero-bg-text">
          {artist.name ? artist.name.charAt(0).toUpperCase() : 'A'}
        </div>

        {showPhotoEffectively && (
          <div style={{
            position: 'relative',
            width: '100%',
            marginTop: '16px',
            marginBottom: '20px',
            ...(artist.showPhoto === false ? { border: '2px dashed #ef4444', borderRadius: '4px', padding: '4px', boxSizing: 'border-box' } : {})
          }}>
            <img 
              src={fixImageUrl(artist.photo)} 
              alt={artist.name || 'Profile'} 
              className="hero-profile-image" 
              style={{ 
                marginTop: 0, 
                marginBottom: 0,
                ...(artist.showPhoto === false ? { opacity: 0.6 } : {}) 
              }} 
            />
            {artist.showPhoto === false && (
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
          {showLocationEffectively && (artist.city || artist.state) && (
            <div 
              className="name-eyebrow"
              style={{
                ...(artist.showLocation === false ? { 
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
              {artist.city ? `${formatSentenceCase(artist.city)} · ` : ''}
              {artist.state ? `${formatSentenceCase(artist.state)} · ` : ''}
              India
              {renderMiniHiddenBadge(artist.showLocation !== false)}
            </div>
          )}
          
          {showNameEffectively && (
            <h1 
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                ...(artist.showName === false ? { 
                  border: '1.5px dashed #ef4444', 
                  padding: '8px', 
                  borderRadius: '6px', 
                  opacity: 0.6 
                } : {})
              }}
            >
              {artist.showName === false && (
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
              {artist.name ? (
                <>
                  {(() => {
                    // Support both old "FIRST LAST" (space) and new "FIRST|LAST" (pipe) formats
                    let first, last;
                    if (artist.name.includes('|')) {
                      const parts = artist.name.split('|');
                      first = parts[0] || '';
                      last = parts[1] || '';
                    } else {
                      const parts = artist.name.split(' ');
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
              ) : 'ARTIST'}
            </h1>
          )}

          {showSpecializationEffectively && artist.specialization && (
            <div 
              className="roles" 
              style={{ 
                display: 'flex', 
                gap: '8px', 
                flexWrap: 'wrap', 
                marginTop: '12px',
                position: 'relative',
                ...(artist.showSpecialization === false ? { 
                  border: '1.5px dashed #ef4444', 
                  padding: '8px', 
                  borderRadius: '6px', 
                  opacity: 0.6 
                } : {})
              }}
            >
              {artist.showSpecialization === false && (
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
              {artist.specialization.split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
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
      {showAboutEffectively && (
        <section 
          className="section about-section" 
          style={{ 
            paddingTop: '36px',
            position: 'relative',
            ...(artist.showAbout === false ? { 
              opacity: 0.65, 
              borderBottom: '2px dashed #ef4444', 
              borderTop: '2px dashed #ef4444' 
            } : {})
          }}
        >
          {artist.showAbout === false && (
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
              {artist.experience ? (
                 (() => {
                   const parts = artist.experience.split('|');
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
                <><span style={{ color: '#ffffff', textTransform: 'uppercase' }}>A passionate</span><br /><em style={{ color: 'var(--red)', textTransform: 'uppercase' }}>creative</em><br /><span style={{ color: '#ffffff', textTransform: 'uppercase' }}>mind.</span></>
              )}
            </div>
            <div className="about-body">
              {formatSentenceCase(artist.bio) || "This artist hasn't added a bio yet."}
            </div>
          </div>
        </section>
      )}

      {showAboutEffectively && <div className="divider"></div>}

      {/* WHAT I DO (Services / Artworks) */}
      {showWhatIDoEffectively && (
        <section 
          className="section" 
          style={{ 
            paddingTop: '50px',
            position: 'relative',
            ...(artist.showWhatIDo === false ? { 
              opacity: 0.65, 
              borderBottom: '2px dashed #ef4444', 
              borderTop: '2px dashed #ef4444' 
            } : {})
          }}
        >
          {artist.showWhatIDo === false && (
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
            <div className="section-title" style={{ fontSize: '11px', letterSpacing: '4px' }}>What I Do</div>
          </div>
          <div className="services-grid">
            {whatIDoItems && whatIDoItems.length > 0 ? whatIDoItems.map((item, i) => {
              const hasImages = item.images && item.images.length > 0;
              return (
                <div 
                  className={`service-card ${!hasImages ? 'non-clickable' : ''}`}
                  key={i} 
                  onClick={hasImages ? () => {
                    navigate('/show-my-art', {
                      state: {
                        artItems: [item],
                        artistName: artist.name
                      }
                    });
                  } : undefined}
                >
                  {item.images && item.images[0] && (
                    <img src={fixImageUrl(item.images[0])} className="service-img-preview" alt="art" />
                  )}
                  <div className="service-name">{formatSentenceCase(item.title) || 'Untitled'}</div>
                  <div className="service-desc">{formatSentenceCase(item.description) || 'View details'}</div>
                </div>
              );
            }) : (
              <div className="service-card" onClick={() => {
                const link = getPrimaryContactLink();
                if (link) {
                  window.open(link, '_blank');
                } else {
                  document.querySelector('.connect-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}>
                <div className="service-name">Commissions</div>
                <div className="service-desc">Custom artwork commissions — DM to collaborate on a one-of-a-kind piece.</div>
              </div>
            )}
          </div>
        </section>
      )}



      {/* CONNECT */}
      {showConnectEffectively && primaryLinks.length > 0 && (
        <section 
          className="section connect-section"
          style={{
            position: 'relative',
            ...(artist.showConnect === false ? { 
              opacity: 0.65, 
              borderBottom: '2px dashed #ef4444', 
              borderTop: '2px dashed #ef4444' 
            } : {})
          }}
        >
          {artist.showConnect === false && (
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
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)'
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
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)'
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

      {/* FOOTER */}
      {showArtPortfolioEffectively && (
        <footer 
          className="profile-card-footer"
          style={{
            position: 'relative',
            ...(artist.showArtPortfolio === false ? { 
              opacity: 0.65, 
              borderTop: '2px dashed #ef4444' 
            } : {})
          }}
        >
          {artist.showArtPortfolio === false && (
            <div style={{
              position: 'absolute',
              top: '10px',
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
              Hidden
            </div>
          )}
          <div>
            <div className="profile-card-footer-headline">Discover my art<br />showcase — explore the collection.</div>
            <div className="profile-card-footer-sub">NANOPROFILES.COM · Curating Creative Expression</div>
          </div>
          <Link
            to="/show-my-art"
            state={{
              artItems: artworks,
              artistName: artist.name
            }}
            className="profile-card-footer-cta"
            style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' }}
          >
            View Showcase →
          </Link>
        </footer>
      )}
      </div>
    </div>
  );
}

export default ArtistPublicView;
