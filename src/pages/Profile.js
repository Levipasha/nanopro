import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, onAuthStateChanged, auth, logout, getGoogleRedirectResult, getIdToken } from '../firebase';
import { landingArtistAPI, generalProfileAPI } from '../services/api';
import PlatformIconSelect from '../components/PlatformIconSelect';
import { getLinkIcon } from '../components/LinkIcons';
import { GENERAL_THEMES, AVAILABLE_FONTS, resolveFontFamily } from '../constants/generalThemes';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './Profile.css';
import './Profile.mobile.css';
import ProfileChoiceScreen from '../components/profile/ProfileChoiceScreen';
import ProfileArtistOnboardingWizard from '../components/profile/ProfileArtistOnboardingWizard';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Profile mode: 'choice' | 'artist' | 'general' | 'restaurant'
const PROFILE_MODE_KEY = 'profile_mode';
// Lock type: 'artist' | 'general_restaurant' | null (not yet chosen)
const PROFILE_LOCK_KEY = 'profile_type_lock';

const defaultForm = {
  artistId: '',
  name: '',
  bio: '',
  specialization: '',
  photo: '',
  backgroundPhoto: '',
  email: '',
  phone: '',
  website: '',
  instagram: '',
  facebook: '',
  twitter: '',
  linkedin: '',
  whatsapp: '',
  gallery: [],
  instagramName: '',
  instagramCategory: '',
  instagramPosts: '',
  instagramFollowers: '',
  instagramFollowing: '',
  instagramAccountBio: '',
  artworkCount: '',
  profileTheme: 'mono',
  profileFont: 'outfit'
};

const OTP_STORAGE_KEY = 'landing_otp_auth';
const RESTAURANT_STORAGE_KEY = 'restaurant_profile';
const RESTAURANT_ONBOARDING_KEY = 'restaurant_onboarding_step';
const GENERAL_FLOW_MODE_KEY = 'general_flow_mode';

const ALL_PLATFORMS = [
  { id: 'google_maps', label: 'Rate us on Google' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'website', label: 'Website' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'spotify', label: 'Spotify' },
  { id: 'snapchat', label: 'Snapchat' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'threads', label: 'Threads' },
  { id: 'discord', label: 'Discord' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'medium', label: 'Medium' },
  { id: 'twitch', label: 'Twitch' },
  { id: 'quora', label: 'Quora' },
  { id: 'github', label: 'GitHub' }
];

const MAX_PLATFORM_LINKS = 6;

const SMART_PLATFORMS = ['whatsapp', 'telegram', 'instagram', 'twitter', 'tiktok', 'snapchat', 'threads'];

function buildLinkUrl(platform, link) {
  if (platform === 'whatsapp') {
    const num = (link.waPhone || link.url || '').replace(/\D/g, '');
    if (!num) return '';
    const msg = (link.waMessage || '').trim();
    return 'https://wa.me/' + num + (msg ? '?text=' + encodeURIComponent(msg) : '');
  }
  if (platform === 'telegram') {
    const u = (link.platformUsername || '').trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\/\+?/i, '').replace(/\s/g, '');
    if (!u) return '';
    const clean = u.replace(/^\+/, '');
    return /^\d+$/.test(clean) && clean.length >= 10 ? 'https://t.me/+' + clean : 'https://t.me/' + clean;
  }
  const username = (link.platformUsername || '').trim().replace(/^@/, '');
  if (!username && platform !== 'website' && platform !== 'custom') {
    if (link.url && (link.url.includes('instagram.com') || link.url.includes('x.com') || link.url.includes('tiktok.com') || link.url.includes('snapchat.com') || link.url.includes('threads.net'))) return link.url;
    return '';
  }
  if (platform === 'instagram') return username ? 'https://instagram.com/' + username : '';
  if (platform === 'twitter') return username ? 'https://x.com/' + username : '';
  if (platform === 'tiktok') return username ? 'https://www.tiktok.com/@' + username : '';
  if (platform === 'snapchat') return username ? 'https://snapchat.com/add/' + username : '';
  if (platform === 'threads') return username ? 'https://threads.net/@' + username : '';
  return link.url || '';
}

function parseLinkFromUrl(link) {
  const url = (link.url || '').trim();
  const out = { ...link };
  if (url.includes('wa.me/')) {
    out.platform = out.platform || 'whatsapp';
    const m = url.match(/wa\.me\/(\d+)/);
    if (m) out.waPhone = m[1];
    const t = url.match(/[?&]text=([^&]+)/);
    if (t) out.waMessage = decodeURIComponent(t[1].replace(/\+/g, ' '));
  } else if (url.includes('instagram.com/')) {
    out.platform = out.platform || 'instagram';
    out.platformUsername = (url.split('instagram.com/')[1] || '').split('/')[0].split('?')[0] || '';
  } else if (url.includes('x.com/') || url.includes('twitter.com/')) {
    out.platform = out.platform || 'twitter';
    out.platformUsername = (url.split('x.com/')[1] || url.split('twitter.com/')[1] || '').split('/')[0].split('?')[0].replace(/^@/, '') || '';
  } else if (url.includes('tiktok.com/@')) {
    out.platform = out.platform || 'tiktok';
    out.platformUsername = (url.split('@')[1] || '').split('/')[0].split('?')[0] || '';
  } else if (url.includes('snapchat.com/add/')) {
    out.platform = out.platform || 'snapchat';
    out.platformUsername = (url.split('snapchat.com/add/')[1] || '').split('/')[0].split('?')[0] || '';
  } else if (url.includes('threads.net/@')) {
    out.platform = out.platform || 'threads';
    out.platformUsername = (url.split('@')[1] || '').split('/')[0].split('?')[0] || '';
  } else if (url.includes('t.me/')) {
    out.platform = out.platform || 'telegram';
    out.platformUsername = (url.split('t.me/')[1] || '').replace(/^\+/, '').split('/')[0].split('?')[0] || '';
  }
  return out;
}

function Profile() {
  const navigate = useNavigate();
  const [profileMode, setProfileMode] = useState(() => {
    try {
      const stored = localStorage.getItem(PROFILE_MODE_KEY);
      const lock = localStorage.getItem(PROFILE_LOCK_KEY);
      const hasRestaurantLocal = !!localStorage.getItem(RESTAURANT_STORAGE_KEY);
      // If this account uses general/restaurant flow and restaurant data exists,
      // restore restaurant dashboard after relogin by default.
      if (lock === 'general_restaurant' && hasRestaurantLocal && (!stored || stored === 'general' || stored === 'choice')) {
        return 'restaurant';
      }
      return stored || 'choice';
    } catch (e) {
      return 'choice';
    }
  });
  const [choiceSource, setChoiceSource] = useState(null);
  const [profileLock, setProfileLock] = useState(() => {
    try { return localStorage.getItem(PROFILE_LOCK_KEY) || null; } catch (e) { return null; }
  });
  const [user, setUser] = useState(null);
  const [otpUser, setOtpUser] = useState(() => {
    try {
      const raw = localStorage.getItem(OTP_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.email && data?.token) return { email: data.email, token: data.token };
      }
    } catch (e) { }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [tempPlatforms, setTempPlatforms] = useState([]);
  const [savingLink, setSavingLink] = useState(null); // which platform is saving
  const [pendingLinks, setPendingLinks] = useState({}); // local unsaved edits
  const [editingHeroField, setEditingHeroField] = useState(null); // 'name' | 'bio' | 'spec' | 'email' | 'phone'
  const [heroUpdates, setHeroUpdates] = useState({}); // local unsaved edits for name/bio/spec/email/phone
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dash-platform-selector-open', !!isSelectorOpen);
    document.documentElement.classList.toggle('dash-platform-selector-open', !!isSelectorOpen);
    return () => {
      document.body.classList.remove('dash-platform-selector-open');
      document.documentElement.classList.remove('dash-platform-selector-open');
    };
  }, [isSelectorOpen]);
  const [mobileHeroEditField, setMobileHeroEditField] = useState(null); // 'name' | 'specialization'
  const [mobileHeroDraft, setMobileHeroDraft] = useState('');
  const [isUploading, setIsUploading] = useState(null); // 'photo' | 'backgroundPhoto' | 'gallery_add'
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0); // For auto-refreshing iframe
  const [myArtists, setMyArtists] = useState([]);
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [bgFile, setBgFile] = useState(null);
  const [onboardingGalleryFiles, setOnboardingGalleryFiles] = useState([]);
  const [onboardingPlatforms, setOnboardingPlatforms] = useState([]);
  const [isOnboardingSelectorOpen, setIsOnboardingSelectorOpen] = useState(false);
  const [newGalleryFile, setNewGalleryFile] = useState(null);
  const [visiblePlatforms, setVisiblePlatforms] = useState([]);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [saving, setSaving] = useState(false);
  // Legacy OTP login state (currently unused, kept for future expansion)
  // eslint-disable-next-line no-unused-vars
  const [otpEmail, setOtpEmail] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [otpCode, setOtpCode] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [otpStep, setOtpStep] = useState('idle');
  // eslint-disable-next-line no-unused-vars
  const [otpSendLoading, setOtpSendLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);

  // General profile (Linktree-like) state
  const [generalProfile, setGeneralProfile] = useState(null);
  const [generalProfileLoading, setGeneralProfileLoading] = useState(false);
  const [generalStep, setGeneralStep] = useState(() => {
    try {
      return localStorage.getItem('general_step') || 'theme';
    } catch (e) {
      return 'theme';
    }
  });

  const updateGeneralStep = (step) => {
    setGeneralStep(step);
    localStorage.setItem('general_step', step);
  };
  const [generalOnboardingStep, setGeneralOnboardingStep] = useState(() => {
    try {
      const s = localStorage.getItem('general_onboarding_step');
      return s ? parseInt(s, 10) : 1;
    } catch (e) { return 1; }
  });
  const updateGeneralOnboardingStep = (step) => {
    setGeneralOnboardingStep(step);
    localStorage.setItem('general_onboarding_step', step.toString());
  };
  const [generalForm, setGeneralForm] = useState({
    username: '',
    name: '',
    title: '',
    bio: '',
    photo: '',
    theme: 'mint',
    font: 'outfit',
    links: [{ title: '', url: '', platform: 'website', order: 0 }]
  });
  const [generalPhotoFile, setGeneralPhotoFile] = useState(null);
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalSuccess, setGeneralSuccess] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [generalActiveTab, setGeneralActiveTab] = useState('profile');
  const [usernameCheck, setUsernameCheck] = useState({ status: 'idle', msg: '' }); // idle | checking | available | taken | invalid
  const usernameCheckTimer = useRef(null);
  const restaurantSyncTimerRef = useRef(null);
  const lastRestaurantSyncSigRef = useRef('');

  // Restaurant profile state (localStorage until backend exists)
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    tagline: '',
    bio: '',
    phone: '',
    email: '',
    theme: 'mono',
    font: 'outfit',
    titleFont: 'outfit',
    bodyFont: 'outfit',
    banner: null,
    menuPdf: null,
    gallery: [],
    links: {}
  });
  const [restaurantOnboardingStep, setRestaurantOnboardingStep] = useState(() => {
    try {
      const s = localStorage.getItem(RESTAURANT_ONBOARDING_KEY);
      return s ? parseInt(s, 10) : 1;
    } catch (e) { return 1; }
  });
  const [restaurantActiveTab, setRestaurantActiveTab] = useState('info');
  const [rBioEditing, setRBioEditing] = useState(false);
  const [rBioDraft, setRBioDraft] = useState('');
  const [rLinkSelectorOpen, setRLinkSelectorOpen] = useState(false);
  const [rTempPlatforms, setRTempPlatforms] = useState([]);
  const [rSyncFonts, setRSyncFonts] = useState(true);
  const [restaurantProfile, setRestaurantProfile] = useState(() => {
    try {
      const raw = localStorage.getItem(RESTAURANT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  });

  // Strip large base64 blobs before persisting — images/PDFs stay in React state only
  const persistRestaurant = (profile) => {
    try {
      // Prevent localStorage blow-ups: keep only small base64 images.
      const MAX_DATA_URL_LENGTH = 500000; // ~0.5MB string; adjust if needed
      const keepDataImage = (v) => typeof v === 'string' && v.startsWith('data:image/') && v.length <= MAX_DATA_URL_LENGTH;
      const safe = {
        ...profile,
        banner: (profile.banner && profile.banner.startsWith('http')) ? profile.banner : (keepDataImage(profile.banner) ? profile.banner : undefined),
        // menuPdf base64 can be very large; only persist when it's already uploaded (http url).
        menuPdf: profile.menuPdf && profile.menuPdf.startsWith('http') ? profile.menuPdf : undefined,
        gallery: (profile.gallery || []).map(g => ({
          ...g,
          url: (g.url && g.url.startsWith('http')) ? g.url : (keepDataImage(g.url) ? g.url : undefined),
        })).filter(g => g.url),
      };
      localStorage.setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(safe));
    } catch (e) {
      // If still too large, save only non-binary fields
      try {
        const minimal = { ...profile, banner: undefined, menuPdf: undefined, gallery: [] };
        localStorage.setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(minimal));
      } catch (e2) { console.warn('Could not persist restaurant profile', e2); }
    }
  };

  const updateRestaurantOnboardingStep = (step) => {
    setRestaurantOnboardingStep(step);
    localStorage.setItem(RESTAURANT_ONBOARDING_KEY, step.toString());
  };
  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRestaurantForm(prev => ({ ...prev, menuPdf: event.target.result }));
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid PDF file.');
    }
  };

  const handleRestaurantBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRestaurantForm(prev => ({ ...prev, banner: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePdf = () => {
    setRestaurantForm(prev => ({ ...prev, menuPdf: null }));
  };

  const [pdfNumPages, setPdfNumPages] = useState(null);
  const onPdfLoadSuccess = ({ numPages }) => {
    setPdfNumPages(numPages);
  };

  const saveRestaurantProfile = async () => {
    // Basic validation
    if (!restaurantForm.name.trim()) {
      alert('Restaurant name is required');
      updateRestaurantOnboardingStep(1);
      return;
    }
    
    // Auto-generate username from name if not provided
    let usernameToSave = restaurantForm.username;
    if (!usernameToSave || !usernameToSave.trim()) {
       usernameToSave = restaurantForm.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    const payload = {
      ...restaurantForm,
      username: usernameToSave
    };
    
    try {
      // Keep local form immediately, but persist banner/menuPdf only after upload succeeds.
      setRestaurantProfile(payload);
      const ok = await handleRestaurantPublish(payload, { silent: true });
      if (!ok) throw new Error('Failed to publish restaurant profile');
      localStorage.removeItem(RESTAURANT_ONBOARDING_KEY);
      setRestaurantOnboardingStep(0); // 0 means done, show dashboard
    } catch (e) {
      console.error('Failed to save restaurant profile', e);
      alert('Failed to save. Please try again.');
    }
  };

  const handleRestaurantPublish = useCallback(async (profileInput = restaurantProfile, options = {}) => {
    const { silent = false } = options;
    if (!profileInput?.username) {
      alert('Please add a username to your restaurant profile first.');
      return false;
    }
    const getIdTokenFn = user ? () => getIdToken() : (otpUser ? () => Promise.resolve(otpUser.token) : () => Promise.resolve(null));
    const getFirebaseUserFn = user
      ? () => ({ uid: user.uid || null, email: user.email || null, name: user.displayName || null })
      : (otpUser ? () => (otpUser?.email ? { uid: otpUser.email, email: otpUser.email } : null) : () => null);
    if (!user && !otpUser) {
      alert('Please sign in to publish your profile.');
      return false;
    }
    try {
      let photoUrl = profileInput.banner && profileInput.banner.startsWith('http') ? profileInput.banner : '';
      if (profileInput.banner && profileInput.banner.startsWith('data:')) {
        try {
          const arr = profileInput.banner.split(',');
          const mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/png';
          const bstr = atob(arr[1]);
          const u8arr = new Uint8Array(bstr.length);
          for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
          const file = new File([u8arr], 'banner.png', { type: mime });
          const up = await generalProfileAPI.uploadPhoto(file, getIdTokenFn);
          photoUrl = up?.url || '';
        } catch (e) {
          console.warn('Banner upload failed:', e);
        }
      }
      let menuPdfUrl = profileInput.menuPdf && profileInput.menuPdf.startsWith('http') ? profileInput.menuPdf : '';
      if (profileInput.menuPdf && profileInput.menuPdf.startsWith('data:')) {
        try {
          const arr = profileInput.menuPdf.split(',');
          const mime = (arr[0].match(/:(.*?);/) || [])[1] || 'application/pdf';
          const bstr = atob(arr[1]);
          const u8arr = new Uint8Array(bstr.length);
          for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
          const file = new File([u8arr], 'menu.pdf', { type: mime });
          const up = await generalProfileAPI.uploadMenuPdf(file, getIdTokenFn, getFirebaseUserFn);
          menuPdfUrl = up?.url || '';
        } catch (e) {
          console.warn('Menu PDF upload failed:', e);
        }
      }
      const linkEntries = Object.entries(profileInput.links || {}).filter(([, v]) => v && String(v).trim());
      const links = linkEntries.map(([k, v], idx) => {
        let url = String(v).trim();
        const isFullUrl = url.startsWith('http') || url.startsWith('www.');
        if (!isFullUrl && SMART_PLATFORMS.includes(k)) {
          const built = buildLinkUrl(k, { platform: k, platformUsername: url });
          if (built) url = built;
        } else if (isFullUrl && !url.startsWith('http')) {
          url = 'https://' + url;
        }
        return { platform: k, title: k.charAt(0).toUpperCase() + k.slice(1), url, order: idx };
      }).filter(l => l.url);
      const bioParts = [profileInput.bio || ''];
      if (profileInput.phone) bioParts.push(`📞 ${profileInput.phone}`);
      if (profileInput.email || user?.email || otpUser?.email) bioParts.push(`✉ ${profileInput.email || user?.email || otpUser?.email}`);
      const payload = {
        username: (profileInput.username || '').toLowerCase().trim(),
        name: profileInput.name || '',
        title: profileInput.tagline || '',
        bio: bioParts.filter(Boolean).join('\n'),
        photo: photoUrl,
        menuPdf: menuPdfUrl,
        theme: profileInput.theme || 'mint',
        font: profileInput.titleFont || profileInput.font || 'outfit',
        bioFont: profileInput.bodyFont || profileInput.font || 'outfit',
        links,
        profileType: 'restaurant'
      };
      const existing = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, 'restaurant');
      if (existing?.data) {
        await generalProfileAPI.update(payload, getIdTokenFn, getFirebaseUserFn);
        if (!silent) alert('Profile updated! Your link is now live.');
      } else {
        await generalProfileAPI.create(payload, getIdTokenFn, getFirebaseUserFn);
        if (!silent) alert('Profile published! Your link is now live.');
      }

      // Update local state with uploaded URLs, then persist.
      // This prevents banner/menuPdf from disappearing after refresh (localStorage strips base64).
      const updatedRestaurantProfile = {
        ...profileInput,
        banner: photoUrl || profileInput.banner || null,
        menuPdf: menuPdfUrl || profileInput.menuPdf || null,
        theme: payload.theme || profileInput.theme || 'mint',
        font: payload.font || profileInput.font || 'outfit',
        titleFont: payload.font || profileInput.titleFont || profileInput.font || 'outfit',
        bodyFont: payload.bioFont || profileInput.bodyFont || profileInput.font || 'outfit',
      };
      try { persistRestaurant(updatedRestaurantProfile); } catch (e) { }
      setRestaurantProfile(updatedRestaurantProfile);
      try { lastRestaurantSyncSigRef.current = JSON.stringify(updatedRestaurantProfile); } catch (e) { }
      return true;
    } catch (err) {
      if (!silent) alert(err.message || 'Failed to publish. Please try again.');
      else console.warn('Restaurant auto-publish failed:', err);
      return false;
    }
  }, [restaurantProfile, user, otpUser]);

  // Dashboard customization state
  const [activeTab, setActiveTab] = useState('profiles'); // 'profiles' | 'design' | 'preview' | 'link-art'
  const [dashTheme] = useState(() => localStorage.getItem('dash_theme') || 'aura');
  const [dashFont] = useState(() => localStorage.getItem('dash_font') || 'outfit');
  const [syncFonts, setSyncFonts] = useState(true);
  const [designSubTab, setDesignSubTab] = useState(null); // null | 'theme' | 'font' (used for artist design)
  const [generalDesignSubTab, setGeneralDesignSubTab] = useState('theme'); // 'theme' | 'font'
  // Link Your Art tab state (must be top-level, not inside callback)
  const [newArtTheme, setNewArtTheme] = useState('painting');
  const [artSaving, setArtSaving] = useState(false);
  const [artImagePreview, setArtImagePreview] = useState([]); // [{ file, url }, ...] for new art upload
  const [artPreviewId, setArtPreviewId] = useState(null); // which art item to preview in side panel
  const [showArtGallery, setShowArtGallery] = useState(false);
  const [artGallerySelectedItem, setArtGallerySelectedItem] = useState(null);
  const [onboardingStep, setOnboardingStep] = useState(() => {
    try {
      return parseInt(localStorage.getItem('onboarding_step')) || 0;
    } catch (e) {
      return 0;
    }
  });

  const updateOnboardingStep = (step) => {
    setOnboardingStep(step);
    localStorage.setItem('onboarding_step', step.toString());
  };

  const getFirebaseUser = useCallback(
    () => (user ? { uid: user.uid, email: user.email || null } : null),
    [user]
  );

  const handleSelectArtistMode = useCallback(() => {
    setError('');
    setProfileMode('artist');
    if (!profileLock) {
      setProfileLock('artist');
      try { localStorage.setItem(PROFILE_LOCK_KEY, 'artist'); } catch (e) { }
    }
    try { localStorage.setItem(PROFILE_MODE_KEY, 'artist'); } catch (e) { }
  }, [profileLock]);

  const handleSelectGeneralMode = useCallback(() => {
    setError('');
    setProfileMode('general');
    if (!profileLock) {
      setProfileLock('general_restaurant');
      try { localStorage.setItem(PROFILE_LOCK_KEY, 'general_restaurant'); } catch (e) { }
    }
    try { localStorage.setItem(GENERAL_FLOW_MODE_KEY, 'general'); } catch (e) { }
    try { localStorage.setItem(PROFILE_MODE_KEY, 'general'); } catch (e) { }
  }, [profileLock]);

  const handleSelectRestaurantMode = useCallback(() => {
    setError('');
    setProfileMode('restaurant');
    if (!profileLock) {
      setProfileLock('general_restaurant');
      try { localStorage.setItem(PROFILE_LOCK_KEY, 'general_restaurant'); } catch (e) { }
    }
    try { localStorage.setItem(GENERAL_FLOW_MODE_KEY, 'restaurant'); } catch (e) { }
    try { localStorage.setItem(PROFILE_MODE_KEY, 'restaurant'); } catch (e) { }
  }, [profileLock]);

  const loadMyProfiles = useCallback(async () => {
    if (user) {
      setArtistsLoading(true);
      try {
        const res = await landingArtistAPI.getMyProfiles(() => getIdToken(), getFirebaseUser);
        setMyArtists(res.data || []);
      } catch (err) {
        console.warn('Artist profiles load:', err.message);
        setMyArtists([]);
      } finally {
        setArtistsLoading(false);
      }
    } else if (otpUser) {
      setArtistsLoading(true);
      try {
        const res = await landingArtistAPI.getMyProfilesWithOtpToken(otpUser.token);
        setMyArtists(res.data || []);
      } catch (err) {
        console.warn('Artist profiles load:', err.message);
        setMyArtists([]);
        // Do not auto-logout OTP users here.
        // Restaurant/general dashboards should still work even if artist routes
        // reject OTP tokens or the user has no artist profile.
      } finally {
        setArtistsLoading(false);
      }
    }
  }, [user, otpUser, getFirebaseUser]);

  const loadGeneralProfile = useCallback(async () => {
    if (!user && !otpUser) return;
    const getIdTokenFn = user ? () => getIdToken() : (otpUser ? () => Promise.resolve(otpUser.token) : () => Promise.resolve(null));
    const getFirebaseUserFn = user ? getFirebaseUser : (otpUser ? () => (otpUser?.email ? { uid: null, email: otpUser.email } : null) : () => null);
    setGeneralProfileLoading(true);
    try {
      // On "choice" screen, always try restaurant first, then general.
      // This avoids relying on localStorage (which may be empty on fresh login).
      if (profileMode === 'choice') {
        const resRestaurant = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, 'restaurant');
        if (resRestaurant?.data) {
          const data = resRestaurant.data;
          setGeneralProfile(data);
          updateGeneralStep('home');
          setGeneralForm({
            username: data.username || '',
            name: data.name || '',
            title: data.title || '',
            bio: data.bio || '',
            photo: data.photo || '',
            theme: data.theme || 'mint',
            font: data.font || 'outfit',
            links: (data.links && data.links.length) ? data.links.map(parseLinkFromUrl) : [{ title: '', url: '', platform: 'website', order: 0 }]
          });
          return;
        }

        const resGeneral = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, 'general');
        const data = resGeneral?.data;
        if (data) {
          setGeneralProfile(data);
          updateGeneralStep('home');
          setGeneralForm({
            username: data.username || '',
            name: data.name || '',
            title: data.title || '',
            bio: data.bio || '',
            photo: data.photo || '',
            theme: data.theme || 'mint',
            font: data.font || 'outfit',
            links: (data.links && data.links.length) ? data.links.map(parseLinkFromUrl) : [{ title: '', url: '', platform: 'website', order: 0 }]
          });
          return;
        }

        updateGeneralStep('theme');
        return;
      }

      const requestedType = profileMode === 'restaurant' ? 'restaurant' : 'general';
      const res = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, requestedType);
      const data = res.data;
      if (data) {
        setGeneralProfile(data);
        updateGeneralStep('home');
        setGeneralForm({
          username: data.username || '',
          name: data.name || '',
          title: data.title || '',
          bio: data.bio || '',
          photo: data.photo || '',
          theme: data.theme || 'mint',
          font: data.font || 'outfit',
          links: (data.links && data.links.length) ? data.links.map(parseLinkFromUrl) : [{ title: '', url: '', platform: 'website', order: 0 }]
        });
      } else {
        updateGeneralStep('theme');
      }
    } catch (err) {
      console.warn('General profile load:', err.message);
      updateGeneralStep('theme');
    } finally {
      setGeneralProfileLoading(false);
    }
  }, [user, otpUser, getFirebaseUser, profileMode]);

  useEffect(() => {
    localStorage.setItem('dash_theme', dashTheme);
  }, [dashTheme]);

  useEffect(() => {
    localStorage.setItem('dash_font', dashFont);
  }, [dashFont]);

  useEffect(() => {
    if (!myArtists || myArtists.length === 0) return;
    const artist = myArtists[0];

    const isNonEmpty = (v) => {
      if (v === undefined || v === null) return false;
      if (typeof v === 'string') return v.trim() !== '';
      return true;
    };

    // Make preview feel instant: include local (unsaved) inputs too.
    const active = ALL_PLATFORMS
      .filter((p) => isNonEmpty(artist[p.id]) || isNonEmpty(pendingLinks[p.id]))
      .map((p) => p.id);

    setVisiblePlatforms(active);
  }, [myArtists, pendingLinks]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobileViewport(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener('change', update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', update);
      else mq.removeListener(update);
    };
  }, []);

  useEffect(() => {
    if (isMobileViewport) {
      // Avoid rendering inline edit rows on mobile when we want a popup
      if (editingHeroField === 'name' || editingHeroField === 'specialization') setEditingHeroField(null);
    } else {
      setMobileHeroEditField(null);
    }
  }, [isMobileViewport, editingHeroField]);

  useEffect(() => {
    if (activeTab === 'design' && isMobileViewport && designSubTab == null) {
      setDesignSubTab('theme');
    }
  }, [activeTab, isMobileViewport, designSubTab]);

  const isLoggedIn = !!(user || otpUser);
  const isArtistMode = profileMode === 'artist';
  const isGeneralMode = profileMode === 'general';
  const isRestaurantMode = profileMode === 'restaurant';


  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getGoogleRedirectResult();
        if (result?.user) setUser(result.user);
      } catch (err) {
        console.error('Redirect error:', err);
      }
    };
    checkRedirect();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user || otpUser) {
      // Always load artist profiles for any logged-in session (Firebase or OTP)
      if (profileMode !== 'general') {
        loadMyProfiles();
      }
      // Load general profile for both Firebase and OTP users (used to restore restaurant/general dashboards).
      if ((user || otpUser) && (profileMode === 'choice' || profileMode === 'general' || profileMode === 'restaurant')) {
        loadGeneralProfile();
      }
    }
  }, [user, otpUser, loadMyProfiles, loadGeneralProfile, profileMode]);

  useEffect(() => {
    if (!generalProfile || restaurantProfile) return;
    if (profileLock !== 'general_restaurant') return;
    const fallbackEmail = user?.email || otpUser?.email || '';
    const likelyRestaurant = !!(generalProfile.menuPdf && String(generalProfile.menuPdf).trim());
    let preferredGeneralMode = 'general';
    try { preferredGeneralMode = localStorage.getItem(GENERAL_FLOW_MODE_KEY) || 'general'; } catch (e) { }
    if (preferredGeneralMode !== 'restaurant' && !likelyRestaurant) return;

    const mappedLinks = {};
    (generalProfile.links || []).forEach((link) => {
      const raw = (link?.platform || link?.title || '').toString().toLowerCase().trim();
      const normalized = raw.replace(/\s+/g, '_');
      const known = ALL_PLATFORMS.find((p) => p.id === normalized)?.id
        || (raw.includes('google') && raw.includes('map') ? 'google_maps' : null)
        || (raw.includes('linked') ? 'linkedin' : null)
        || (raw.includes('whats') ? 'whatsapp' : null)
        || (raw.includes('insta') ? 'instagram' : null)
        || (raw.includes('face') ? 'facebook' : null)
        || (raw.includes('x') || raw.includes('twitter') ? 'twitter' : null)
        || (raw.includes('site') || raw.includes('web') ? 'website' : null);
      if (known && link?.url) mappedLinks[known] = link.url;
    });

    const hydratedRestaurant = {
      name: generalProfile.name || '',
      tagline: generalProfile.title || '',
      bio: generalProfile.bio || '',
      phone: '',
      email: fallbackEmail,
      username: generalProfile.username || '',
      menuPdf: generalProfile.menuPdf || null,
      banner: generalProfile.photo || '',
      gallery: [],
      links: mappedLinks,
      theme: generalProfile.theme || 'mint',
      font: generalProfile.font || 'outfit',
      titleFont: generalProfile.font || 'outfit',
      bodyFont: generalProfile.bioFont || generalProfile.font || 'outfit'
    };
    setRestaurantProfile(hydratedRestaurant);
    persistRestaurant(hydratedRestaurant);
    try { lastRestaurantSyncSigRef.current = JSON.stringify(hydratedRestaurant); } catch (e) { }
    setProfileMode('restaurant');
    try { localStorage.setItem(PROFILE_MODE_KEY, 'restaurant'); } catch (e) { }
  }, [generalProfile, restaurantProfile, profileLock, user, otpUser]);

  useEffect(() => {
    if (!isLoggedIn || !isRestaurantMode || !restaurantProfile) return undefined;
    if (restaurantOnboardingStep !== 0 || !restaurantProfile.username) return undefined;

    let signature = '';
    try { signature = JSON.stringify(restaurantProfile); } catch (e) { return undefined; }
    if (!signature || signature === lastRestaurantSyncSigRef.current) return undefined;

    if (restaurantSyncTimerRef.current) clearTimeout(restaurantSyncTimerRef.current);
    restaurantSyncTimerRef.current = setTimeout(async () => {
      const ok = await handleRestaurantPublish(restaurantProfile, { silent: true });
      if (ok) lastRestaurantSyncSigRef.current = signature;
    }, 900);

    return () => {
      if (restaurantSyncTimerRef.current) clearTimeout(restaurantSyncTimerRef.current);
    };
  }, [isLoggedIn, isRestaurantMode, restaurantProfile, restaurantOnboardingStep, handleRestaurantPublish]);

  useEffect(() => {
    if (myArtists.length > 0 && myArtists[0].isSetup === false && onboardingStep === 0 && profileMode === 'artist') {
      updateOnboardingStep(1);
      // Pre-fill name and email only; leave username (artistId) empty so user can enter their own nickname
      setFormData(prev => ({
        ...prev,
        name: myArtists[0].name || '',
        email: myArtists[0].email || ''
      }));
    }
  }, [myArtists, onboardingStep, profileMode]);

  useEffect(() => {
    if (artistsLoading || generalProfileLoading) return;

    const hasSetupArtist = myArtists.length > 0 && myArtists[0].isSetup === true;
    const hasGeneral = !!generalProfile;

    // 1) Brand new user: no artist, no general, and still on choice screen
    //    -> force choice and clear any stale localStorage.
    if (!hasSetupArtist && !hasGeneral && profileMode === 'choice') {
      if (profileMode !== 'choice') {
        setProfileMode('choice');
      }
      if (profileLock) {
        setProfileLock(null);
      }
      try {
        localStorage.removeItem(PROFILE_MODE_KEY);
        localStorage.removeItem(PROFILE_LOCK_KEY);
      } catch (e) { }
      return;
    }

    // 2) Existing profiles: only auto-switch when we're currently on the choice screen.
    if (profileMode === 'choice') {
      const lock = profileLock;
      if (lock === 'artist') {
        handleSelectArtistMode();
        return;
      }
      if (lock === 'general_restaurant') {
        let preferredGeneralMode = 'general';
        try { preferredGeneralMode = localStorage.getItem(GENERAL_FLOW_MODE_KEY) || 'general'; } catch (e) { }
        const likelyRestaurant =
          generalProfile?.profileType === 'restaurant' ||
          !!(generalProfile?.menuPdf && String(generalProfile.menuPdf).trim());
        if (restaurantProfile || preferredGeneralMode === 'restaurant' || likelyRestaurant) {
          handleSelectRestaurantMode();
        } else if (hasGeneral) {
          handleSelectGeneralMode();
        }
        return;
      }

      // 3) No lock yet (fresh login): infer mode from backend saved profile.
      // This prevents the "choice screen" from showing again when a restaurant profile already exists.
      if (!lock && hasGeneral) {
        const likelyRestaurant =
          generalProfile?.profileType === 'restaurant' ||
          !!(generalProfile?.menuPdf && String(generalProfile.menuPdf).trim());
        if (likelyRestaurant) {
          handleSelectRestaurantMode();
        } else {
          handleSelectGeneralMode();
        }
        return;
      }

      if (hasSetupArtist && !hasGeneral) {
        handleSelectArtistMode();
      } else if (hasGeneral && !hasSetupArtist) {
        handleSelectGeneralMode();
      }
    }
  }, [
    myArtists,
    artistsLoading,
    generalProfile,
    otpUser,
    generalProfileLoading,
    profileMode,
    profileLock,
    handleSelectArtistMode,
    handleSelectGeneralMode,
    handleSelectRestaurantMode,
    restaurantProfile
  ]);


  const handleGeneralThemeSelect = (themeId) => {
    setGeneralForm(prev => ({ ...prev, theme: themeId }));
    updateGeneralStep('create');
  };

  const handleGeneralCreate = async (e) => {
    e.preventDefault();
    if (!generalForm.username.trim()) {
      setError('Username is required.');
      return;
    }
    setGeneralSaving(true);
    setError('');
    setGeneralSuccess('');
    try {
      const getIdTokenFn = user ? () => getIdToken() : (otpUser ? () => Promise.resolve(otpUser.token) : () => Promise.resolve(null));
      const getFirebaseUserFn = user ? getFirebaseUser : (otpUser ? () => (otpUser?.email ? { uid: otpUser.email, email: otpUser.email } : null) : () => null);
      let photoUrl = generalForm.photo;
      if (generalPhotoFile) {
        const up = await generalProfileAPI.uploadPhoto(generalPhotoFile, getIdTokenFn);
        photoUrl = up?.url || photoUrl;
      }
      const links = generalForm.links.map(l => ({ ...l, url: buildLinkUrl(l.platform, l) || l.url || '' })).filter(l => (l.url || '').trim());
      const payload = { ...generalForm, photo: photoUrl, links, profileType: 'general' };

      // If a general profile already exists for this account, use update; otherwise create.
      let res;
      try {
        const existing = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, 'general');
        if (existing && existing.data) {
          res = await generalProfileAPI.update(payload, getIdTokenFn, getFirebaseUserFn);
        } else {
          res = await generalProfileAPI.create(payload, getIdTokenFn, getFirebaseUserFn);
        }
      } catch (innerErr) {
        // If backend says "You already have a general profile. Use update instead.", retry with update.
        if ((innerErr.message || '').toLowerCase().includes('already have a general profile')) {
          res = await generalProfileAPI.update(payload, getIdTokenFn, getFirebaseUserFn);
        } else {
          throw innerErr;
        }
      }

      setGeneralProfile(res.data);
      updateGeneralStep('home');
      setGeneralOnboardingStep(1);
      localStorage.removeItem('general_onboarding_step');
      setGeneralPhotoFile(null);
      setGeneralSuccess('Profile saved successfully!');
      setTimeout(() => setGeneralSuccess(''), 2500);
    } catch (err) {
      setError(err.message || 'Failed to create profile.');
    } finally {
      setGeneralSaving(false);
    }
  };

  const addLink = () => {
    setGeneralForm(prev => ({
      ...prev,
      links: [...prev.links, { title: '', url: '', platform: 'website', order: prev.links.length }]
    }));
  };

  const updateLink = (idx, field, value) => {
    setGeneralForm(prev => ({
      ...prev,
      links: prev.links.map((l, i) => i === idx ? { ...l, [field]: value } : l)
    }));
  };

  const removeLink = (idx) => {
    setGeneralForm(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== idx)
    }));
  };

  const getProfileLink = () => {
    const base = window.location.origin;
    return `${base}/link/${generalProfile?.username || generalForm.username}`;
  };

  const handleGeneralFieldSave = async (field, value) => {
    if (!generalProfile) return;
    const getIdTokenFn = user ? () => getIdToken() : (otpUser ? () => Promise.resolve(otpUser.token) : () => Promise.resolve(null));
    const getFirebaseUserFn = user ? getFirebaseUser : (otpUser ? () => (otpUser?.email ? { uid: null, email: otpUser.email } : null) : () => null);
    setGeneralSaving(true);
    setError('');
    try {
      const payload = { [field]: value };
      const res = await generalProfileAPI.update(payload, getIdTokenFn, getFirebaseUserFn);
      setGeneralProfile(res.data);
      setGeneralForm(prev => ({ ...prev, [field]: value }));
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setGeneralSaving(false);
    }
  };

  const handleGeneralPhotoSave = async (file) => {
    if (!file || !generalProfile) return;
    const getIdTokenFn = user ? () => getIdToken() : (otpUser ? () => Promise.resolve(otpUser.token) : () => Promise.resolve(null));
    const getFirebaseUserFn = user ? getFirebaseUser : (otpUser ? () => (otpUser?.email ? { uid: null, email: otpUser.email } : null) : () => null);
    setGeneralSaving(true);
    setError('');
    try {
      const up = await generalProfileAPI.uploadPhoto(file, getIdTokenFn);
      const photoUrl = up?.url || '';
      const res = await generalProfileAPI.update({ photo: photoUrl }, getIdTokenFn, getFirebaseUserFn);
      setGeneralProfile(res.data);
      setGeneralForm(prev => ({ ...prev, photo: photoUrl }));
      setGeneralPhotoFile(null);
      setGeneralSuccess('Photo updated!');
      setTimeout(() => setGeneralSuccess(''), 2000);
    } catch (err) {
      setError(err.message || 'Failed to upload photo.');
    } finally {
      setGeneralSaving(false);
    }
  };

  const handleGeneralSaveAll = async () => {
    if (!generalProfile) return;
    const getIdTokenFn = user ? () => getIdToken() : (otpUser ? () => Promise.resolve(otpUser.token) : () => Promise.resolve(null));
    const getFirebaseUserFn = user ? getFirebaseUser : (otpUser ? () => (otpUser?.email ? { uid: null, email: otpUser.email } : null) : () => null);
    setGeneralSaving(true);
    setError('');
    try {
      let photoUrl = generalForm.photo;
      if (generalPhotoFile) {
        const up = await generalProfileAPI.uploadPhoto(generalPhotoFile, getIdTokenFn);
        photoUrl = up?.url || photoUrl;
      }
      const links = generalForm.links.map(l => ({ ...l, url: buildLinkUrl(l.platform, l) || l.url || '' })).filter(l => (l.url || '').trim());
      const res = await generalProfileAPI.update(
        { ...generalForm, photo: photoUrl, links },
        getIdTokenFn,
        getFirebaseUserFn
      );
      setGeneralProfile(res.data);
      setGeneralPhotoFile(null);
      setGeneralSuccess('Profile saved!');
      setTimeout(() => setGeneralSuccess(''), 2500);
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setGeneralSaving(false);
    }
  };

  // General Google login handler (currently only used in legacy flows)
  // eslint-disable-next-line no-unused-vars
  const handleGoogleLogin = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (err) {
      setError('Google Sign-In failed. Please try again.');
    }
  };

  // Legacy OTP handlers (kept for future use)
  // eslint-disable-next-line no-unused-vars
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const email = otpEmail.trim();
    if (!email) {
      setError('Please enter your profile email.');
      return;
    }
    setError('');
    setOtpSendLoading(true);
    try {
      await landingArtistAPI.sendOtp(email);
      setOtpStep('sent');
      setOtpCode('');
    } catch (err) {
      setError(err.message || 'Failed to send code.');
    } finally {
      setOtpSendLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const email = otpEmail.trim();
    const code = otpCode.trim();
    if (!email || !code) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setError('');
    setOtpVerifyLoading(true);
    try {
      const data = await landingArtistAPI.verifyOtp(email, code);
      const auth = { email: data.email, token: data.token };
      setOtpUser(auth);
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(auth));
      // New OTP login: always start from profile choice (artist/general/restaurant).
      // Lock will be set after the user explicitly picks a profile type.
      setProfileMode('choice');
      setProfileLock(null);
      try {
        localStorage.removeItem(PROFILE_MODE_KEY);
        localStorage.removeItem(PROFILE_LOCK_KEY);
      } catch (e) { }
      setOtpStep('verified');
      setOtpEmail('');
      setOtpCode('');
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setOtpVerifyLoading(false);
    }
  };

  const handleLogout = () => {
    if (user) logout();
    setOtpUser(null);
    localStorage.removeItem(OTP_STORAGE_KEY);
    localStorage.removeItem('onboarding_step');
    localStorage.removeItem('general_step');
    localStorage.removeItem('general_onboarding_step');
    localStorage.removeItem(RESTAURANT_STORAGE_KEY);
    localStorage.removeItem(RESTAURANT_ONBOARDING_KEY);
    localStorage.removeItem(GENERAL_FLOW_MODE_KEY);
    localStorage.removeItem(PROFILE_MODE_KEY);
    localStorage.removeItem(PROFILE_LOCK_KEY);
    setMyArtists([]);
    setEditingArtist(null);
    setProfileMode('choice');
    setChoiceSource(null);
    setProfileLock(null);
    setOnboardingStep(0);
    setGeneralStep('theme');
    setGeneralOnboardingStep(1);
    navigate('/login');
  };

  // Open artist edit drawer
  // eslint-disable-next-line no-unused-vars
  const openEdit = (artist) => {
    setEditingArtist(artist);
    const gallery = Array.isArray(artist.gallery) ? artist.gallery : [];
    setFormData({
      name: artist.name || '',
      bio: artist.bio || '',
      specialization: artist.specialization || '',
      photo: artist.photo || '',
      backgroundPhoto: artist.backgroundPhoto || '',
      email: artist.email || '',
      phone: artist.phone || '',
      website: artist.website || '',
      instagram: artist.instagram || '',
      facebook: artist.facebook || '',
      twitter: artist.twitter || '',
      linkedin: artist.linkedin || '',
      whatsapp: artist.whatsapp || '',
      gallery: gallery.map((g) => (typeof g === 'string' ? { url: g, name: '' } : { url: g.url || '', name: g.name || '' })),
      instagramName: artist.instagramName || '',
      instagramCategory: artist.instagramCategory || '',
      instagramPosts: artist.instagramPosts || '',
      instagramFollowers: artist.instagramFollowers || '',
      instagramFollowing: artist.instagramFollowing || '',
      instagramAccountBio: artist.instagramAccountBio || '',
      artworkCount: artist.artworkCount != null ? artist.artworkCount : '',
      profileTheme: artist.profileTheme || 'mono'
    });
    setPhotoFile(null);
    setBgFile(null);
    setNewGalleryFile(null);
    setNewGalleryName('');
  };

  const closeEdit = () => {
    setEditingArtist(null);
    setFormData(defaultForm);
    setPhotoFile(null);
    setBgFile(null);
    setNewGalleryFile(null);
    setNewGalleryName('');
  };

  const removeGalleryItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const addGalleryItem = async () => {
    if (!newGalleryFile) return;
    setGalleryUploading(true);
    try {
      const tokenForUpload = otpUser ? otpUser.token : (await getIdToken());
      const up = await landingArtistAPI.uploadPhoto(newGalleryFile, tokenForUpload);
      const url = up && up.url ? up.url : null;
      if (url) {
        setFormData((prev) => ({
          ...prev,
          gallery: [...prev.gallery, { url, name: newGalleryName.trim() || 'Slide' }]
        }));
        setNewGalleryFile(null);
        setNewGalleryName('');
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setGalleryUploading(false);
    }
  };

  const setGalleryItemName = (index, name) => {
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.map((item, i) => (i === index ? { ...item, name } : item))
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingArtist) return;
    setSaving(true);
    setError('');
    try {
      const tokenForUpload = otpUser ? otpUser.token : (await getIdToken());
      let photoUrl = formData.photo;
      let bgUrl = formData.backgroundPhoto;
      if (photoFile) {
        const up = await landingArtistAPI.uploadPhoto(photoFile, tokenForUpload);
        photoUrl = (up && up.url) ? up.url : photoUrl;
      }
      if (bgFile) {
        const up = await landingArtistAPI.uploadPhoto(bgFile, tokenForUpload);
        bgUrl = (up && up.url) ? up.url : bgUrl;
      }
      const payload = {
        ...formData,
        photo: photoUrl,
        backgroundPhoto: bgUrl,
        artworkCount: formData.artworkCount === '' ? undefined : Number(formData.artworkCount)
      };
      if (otpUser) {
        await landingArtistAPI.updateMyProfileWithOtpToken(editingArtist.artistId || editingArtist._id, payload, otpUser.token);
      } else {
        await landingArtistAPI.updateMyProfile(
          editingArtist.artistId || editingArtist._id,
          payload,
          () => getIdToken(),
          getFirebaseUser
        );
      }
      await loadMyProfiles();
      closeEdit();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLink = async (platform, value) => {
    const artist = myArtists[0];
    if (!artist) return;
    setSavingLink(platform);
    try {
      let finalValue = value;
      if (platform === 'whatsapp' && value && !value.includes('http')) {
        // Clean the number and prepend wa.me
        const cleanNumber = value.replace('+', '').replace(/\s/g, '');
        finalValue = `https://wa.me/${cleanNumber}`;
      }
      const payload = { [platform]: finalValue }; // value could be null
      // Support both Firebase-authenticated sessions and OTP sessions.
      if (otpUser && otpUser.token) {
        await landingArtistAPI.updateMyProfileWithOtpToken(
          artist.artistId || artist._id,
          payload,
          otpUser.token
        );
      } else {
        await landingArtistAPI.updateMyProfile(
          artist.artistId || artist._id,
          payload,
          () => getIdToken(),
          getFirebaseUser
        );
      }
      // Update server-side source of truth
      setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, [platform]: finalValue } : a));
      // Clear local pending state after successful save
      setPendingLinks(prev => {
        const next = { ...prev };
        delete next[platform];
        return next;
      });
      // Auto-refresh preview
      setPreviewKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to update link:', err);
    } finally {
      setSavingLink(null);
    }
  };

  const handleUpdateHeroField = async (field, value, extraPayload = {}) => {
    const artist = myArtists[0];
    if (!artist) return;
    setSavingLink(field); // reuse savingLink state for spinner
    try {
      const payload = { [field]: value, ...extraPayload };
      if (otpUser) {
        await landingArtistAPI.updateMyProfileWithOtpToken(artist.artistId || artist._id, payload, otpUser.token);
      } else {
        await landingArtistAPI.updateMyProfile(artist.artistId || artist._id, payload, () => getIdToken(), getFirebaseUser);
      }
      setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, ...payload } : a));
      setEditingHeroField(null);
      setHeroUpdates(prev => {
        const next = { ...prev };
        Object.keys(payload).forEach(k => delete next[k]);
        return next;
      });
      // Auto-refresh preview
      setPreviewKey(prev => prev + 1);
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
    } finally {
      setSavingLink(null);
    }
  };

  const openHeroEditor = (field, artist) => {
    if (isMobileViewport && (field === 'name' || field === 'specialization')) {
      const current = heroUpdates[field] !== undefined ? heroUpdates[field] : (artist?.[field] || '');
      setMobileHeroEditField(field);
      setMobileHeroDraft(current);
      return;
    }
    setEditingHeroField(field);
  };

  const saveMobileHeroField = async () => {
    const artist = myArtists[0];
    if (!artist || !mobileHeroEditField) return;
    await handleUpdateHeroField(mobileHeroEditField, mobileHeroDraft);
    setMobileHeroEditField(null);
  };

  const handleUploadField = async (field, file) => {
    const artist = myArtists[0];
    if (!artist || !file) return;
    setIsUploading(field);
    try {
      const token = otpUser ? otpUser.token : (await getIdToken());
      const up = await landingArtistAPI.uploadPhoto(file, token);
      if (up && up.url) {
        const payload = { [field]: up.url };
        if (otpUser) {
          await landingArtistAPI.updateMyProfileWithOtpToken(artist.artistId || artist._id, payload, otpUser.token);
        } else {
          await landingArtistAPI.updateMyProfile(artist.artistId || artist._id, payload, () => getIdToken(), getFirebaseUser);
        }
        setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, [field]: up.url } : a));
        // Auto-refresh preview
        setPreviewKey(prev => prev + 1);
      }
    } catch (err) {
      console.error(`Failed to upload ${field}:`, err);
    } finally {
      setIsUploading(null);
    }
  };

  const handleAddGalleryItem = async (file, name = '') => {
    const artist = myArtists[0];
    if (!artist || !file) return;
    setGalleryUploading(true);
    try {
      const token = otpUser ? otpUser.token : (await getIdToken());
      const up = await landingArtistAPI.uploadPhoto(file, token);
      if (up && up.url) {
        const newItem = { url: up.url, name: name || 'New Event' };
        const newGallery = [...(artist.gallery || []), newItem];
        const payload = { gallery: newGallery };
        if (otpUser) {
          await landingArtistAPI.updateMyProfileWithOtpToken(artist.artistId || artist._id, payload, otpUser.token);
        } else {
          await landingArtistAPI.updateMyProfile(artist.artistId || artist._id, payload, () => getIdToken(), getFirebaseUser);
        }
        setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, gallery: newGallery } : a));
        setPreviewKey(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to add gallery item:', err);
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleRemoveGalleryItem = async (idx) => {
    const artist = myArtists[0];
    if (!artist) return;
    try {
      const newGallery = (artist.gallery || []).filter((_, i) => i !== idx);
      const payload = { gallery: newGallery };
      if (otpUser) {
        await landingArtistAPI.updateMyProfileWithOtpToken(artist.artistId || artist._id, payload, otpUser.token);
      } else {
        await landingArtistAPI.updateMyProfile(artist.artistId || artist._id, payload, () => getIdToken(), getFirebaseUser);
      }
      setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, gallery: newGallery } : a));
      setPreviewKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to remove gallery item:', err);
    }
  };

  const togglePlatformInSelector = (id) => {
    setTempPlatforms((prev) => {
      // If already selected in this session, toggle off
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id);
      }

      // Compute how many unique platforms would be visible after this selection
      const base = new Set(visiblePlatforms || []);
      const nextTemp = [...prev, id];
      const combined = new Set([...base, ...nextTemp]);

      if (combined.size > MAX_PLATFORM_LINKS) {
        // Hard cap: only allow up to MAX_PLATFORM_LINKS platforms in total
        window.alert(`You can add up to ${MAX_PLATFORM_LINKS} platforms only.`);
        return prev;
      }

      return nextTemp;
    });
  };

  const handlePlatformDone = async () => {
    const artist = myArtists[0];
    if (!artist) return;

    // Make selection additive-only: never remove existing platforms here,
    // only add newly selected ones.
    const previous = visiblePlatforms || [];
    const toAdd = tempPlatforms.filter(id => !previous.includes(id));

    const updates = {};
    toAdd.forEach(id => {
      if (artist[id] === undefined || artist[id] === null) {
        updates[id] = '';
      }
    });

    const nextVisible = Array.from(new Set([...previous, ...tempPlatforms]));
    setVisiblePlatforms(nextVisible);

    if (Object.keys(updates).length > 0) {
      try {
        if (otpUser) {
          await landingArtistAPI.updateMyProfileWithOtpToken(artist.artistId || artist._id, updates, otpUser.token);
        } else {
          await landingArtistAPI.updateMyProfile(artist.artistId || artist._id, updates, () => getIdToken(), getFirebaseUser);
        }
        setMyArtists(prev => prev.map((a, i) => i === 0 ? { ...a, ...updates } : a));
      } catch (err) {
        console.error('Failed to sync platforms:', err);
      }
    }
    setIsSelectorOpen(false);
  };

  const handleOnboardingNext = () => updateOnboardingStep(onboardingStep + 1);
  const handleOnboardingBack = () => updateOnboardingStep(onboardingStep - 1);
  const handleOnboardingComplete = async () => {
    try {
      setSaving(true);
      setError('');
      
      let artist = myArtists[0];
      
      // If we don't have an artist profile yet, we need to create one first
      if (!artist) {
        try {
          // If no artist profile, create a barebones one first
          const createPayload = { 
            artistId: formData.artistId || `user-${Date.now()}`,
            name: formData.name || 'New Artist'
          };
          
          let createRes;
          if (otpUser) {
            createRes = await landingArtistAPI.createMyProfileWithOtpToken(createPayload, otpUser.token);
          } else {
            createRes = await landingArtistAPI.createMyProfile(createPayload, () => getIdToken(), getFirebaseUser);
          }
          
          if (!createRes.success) {
            throw new Error(createRes.message || 'Failed to initialize profile');
          }
          artist = createRes.data;
        } catch (createErr) {
          console.error("Profile auto-creation error:", createErr);
          throw new Error('No profile to save, and auto-creation failed: ' + createErr.message);
        }
      }

      const { _wa_phone, _wa_msg, _tg_user, _ig_user, _tw_user, _tt_user, _sc_user, _th_user, ...cleanFormData } = formData;
      const payload = {
        ...cleanFormData,
        isSetup: true,
        updatedAt: Date.now()
      };

      // Upload images if selected
      if (photoFile) {
        const up = await landingArtistAPI.uploadPhoto(photoFile, () => getIdToken());
        payload.photo = up?.url || payload.photo;
      }
      if (bgFile) {
        const up = await landingArtistAPI.uploadPhoto(bgFile, () => getIdToken());
        payload.backgroundPhoto = up?.url || payload.backgroundPhoto;
      }

      // Upload gallery files
      if (onboardingGalleryFiles && onboardingGalleryFiles.length > 0) {
        const galleryUrls = [];
        for (let i = 0; i < onboardingGalleryFiles.length; i++) {
          const up = await landingArtistAPI.uploadPhoto(onboardingGalleryFiles[i], () => getIdToken());
          if (up?.url) {
            galleryUrls.push({ url: up.url, name: `Gallery Image ${i + 1}` });
          }
        }
        payload.gallery = [...(payload.gallery || []), ...galleryUrls];
      }
      if (otpUser) {
        await landingArtistAPI.updateMyProfileWithOtpToken(artist.artistId || artist._id, payload, otpUser.token);
      } else {
        await landingArtistAPI.updateMyProfile(artist.artistId || artist._id, payload, () => getIdToken(), getFirebaseUser);
      }

      // Refresh data
      await loadMyProfiles();
      updateOnboardingStep(0);
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to complete setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Global display variables moved up to fix ReferenceError
  const displayName = user?.displayName || user?.email || otpUser?.email || 'Profile';
  const displayEmail = user?.email || otpUser?.email || '';
  const avatarLetter = user?.displayName?.charAt(0) || user?.email?.charAt(0) || otpUser?.email?.charAt(0) || '?';

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate('/login');
    }
  }, [loading, isLoggedIn, navigate]);

  if (loading) {
    return (
      <div className="profile-page profile-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  // Onboarding Wizard
  if (isLoggedIn && isArtistMode && onboardingStep > 0) {
    return (
      <ProfileArtistOnboardingWizard
        onboardingStep={onboardingStep}
        handleOnboardingBack={handleOnboardingBack}
        handleOnboardingNext={handleOnboardingNext}
        handleOnboardingComplete={handleOnboardingComplete}
        formData={formData}
        setFormData={setFormData}
        isOnboardingSelectorOpen={isOnboardingSelectorOpen}
        setIsOnboardingSelectorOpen={setIsOnboardingSelectorOpen}
        onboardingPlatforms={onboardingPlatforms}
        setOnboardingPlatforms={setOnboardingPlatforms}
        ALL_PLATFORMS={ALL_PLATFORMS}
        photoFile={photoFile}
        setPhotoFile={setPhotoFile}
        bgFile={bgFile}
        setBgFile={setBgFile}
        onboardingGalleryFiles={onboardingGalleryFiles}
        setOnboardingGalleryFiles={setOnboardingGalleryFiles}
        error={error}
        saving={saving}
        handleLogout={handleLogout}
      />
    );
  }

  // Mode selection screen (Artist vs General)
  if (isLoggedIn && profileMode === 'choice') {
    return (
      <ProfileChoiceScreen
        displayName={displayName}
        displayEmail={displayEmail}
        profileLock={profileLock}
        choiceSource={choiceSource}
        generalProfile={generalProfile}
        restaurantProfile={restaurantProfile}
        handleSelectArtistMode={handleSelectArtistMode}
        handleSelectGeneralMode={handleSelectGeneralMode}
        handleSelectRestaurantMode={handleSelectRestaurantMode}
      />
    );
  }
  // Restaurant profile: home (profile already created) — same layout as artist dashboard
  if (isLoggedIn && isRestaurantMode && restaurantProfile) {
    return (
      <div className={`dash-root dash-theme-aura dash-font-outfit`}>
        {/* Sidebar */}
        <aside className="dash-sidebar">
          <div className="dash-sidebar-brand">
            <div className="dash-sidebar-top-avatar">
              {user?.photoURL
                ? <img src={user.photoURL} alt={displayName} />
                : <span>{avatarLetter}</span>
              }
            </div>
            <span className="dash-brand-email-main">{displayEmail}</span>
          </div>

          <nav className="dash-nav">
            <div className="dash-nav-section">
              <span className="dash-nav-label">Restaurant</span>
              <button
                className={`dash-nav-item ${restaurantActiveTab === 'info' ? 'dash-nav-active' : ''}`}
                onClick={() => setRestaurantActiveTab('info')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                Profile &amp; Menu
              </button>
              <button
                className={`dash-nav-item ${restaurantActiveTab === 'design' ? 'dash-nav-active' : ''}`}
                onClick={() => setRestaurantActiveTab('design')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                Design
              </button>
              <button
                className={`dash-nav-item ${restaurantActiveTab === 'menu' ? 'dash-nav-active' : ''}`}
                onClick={() => setRestaurantActiveTab('menu')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Menu
              </button>
            </div>
          </nav>

          <div className="dash-sidebar-bottom" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="dash-sidebar-signout-btn dash-sidebar-home-btn"
              onClick={() => navigate('/')}
            >
              ← Back to Home
            </button>
            <button className="dash-sidebar-signout-btn" onClick={handleLogout}>Sign out</button>
          </div>
        </aside>

        {/* Main */}
        <main className="dash-main">
          <header className="dash-main-header">
            <div>
              <h1 className="dash-main-title">{restaurantActiveTab === 'design' ? 'Design' : restaurantActiveTab === 'menu' ? 'Menu' : 'Restaurant Dashboard'}</h1>
              <p className="dash-main-subtitle">{restaurantActiveTab === 'design' ? 'Customize your restaurant profile theme and font' : restaurantActiveTab === 'menu' ? 'Upload and manage your restaurant menu PDF' : 'Manage your restaurant profile and contact info'}</p>
            </div>
          </header>

          <div className="dash-content">
            {/* ── PROFILE & MENU TAB ── */}
            {restaurantActiveTab === 'info' && (
              <div className="dash-profile-layout">
                {/* Left: profile info */}
                <div className="dash-single-profile" style={{ padding: '2.5rem', overflowY: 'auto' }}>
                  {/* Hero banner — with inline edit button */}
                  <div className="dash-profile-hero">
                    {restaurantProfile.banner
                      ? <img src={restaurantProfile.banner} alt="" className="dash-profile-hero-bg" />
                      : <div className="dash-profile-hero-bg" style={{ background: 'linear-gradient(135deg,#fceabb,#f8b500)' }} />
                    }
                    <div className="dash-profile-hero-overlay" />

                    <button
                      type="button"
                      className="dash-hero-bg-trigger"
                      style={{ cursor: 'pointer' }}
                      onClick={() => { setRestaurantForm({ ...restaurantProfile, menuPdf: restaurantProfile.menuPdf || null, banner: restaurantProfile.banner || null, gallery: restaurantProfile.gallery || [], links: restaurantProfile.links || {} }); setRestaurantProfile(null); updateRestaurantOnboardingStep(1); }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span>Edit Profile</span>
                    </button>

                    <div className="dash-profile-hero-content">
                      <div className="dash-hero-text">
                        <h2 className="dash-hero-name">{restaurantProfile.name}</h2>
                        <p className="dash-hero-spec">@{restaurantProfile.username}</p>
                        <p className="dash-hero-bio">{restaurantProfile.tagline}</p>
                      </div>
                    </div>
                  </div>

                  {/* Copy Profile Link */}
                  <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'var(--dash-bg-card)', border: '1px solid var(--dash-border)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dash-subtext)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Profile Link</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--dash-text)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{`${window.location.origin}/link/${restaurantProfile.username || ''}`}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/link/${restaurantProfile.username || ''}`;
                          navigator.clipboard.writeText(url);
                          alert('Profile URL copied to clipboard!');
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '6px 12px', background: '#111827', color: '#f9fafb', border: '1px solid rgba(255,255,255,0.28)', borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                        Copy Link
                      </button>
                      <a href={`${window.location.origin}/link/${restaurantProfile.username || ''}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '6px 12px', background: '#0f172a', color: '#ffffff', border: '1px solid rgba(255,255,255,0.24)', borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>Open</a>
                    </div>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--dash-subtext)' }}>
                      Link goes live automatically after creating your restaurant profile.
                    </p>
                  </div>

                  {/* Bio — always editable inline */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--dash-subtext)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>About / Bio</span>
                      {!rBioEditing && <button type="button" onClick={() => { setRBioDraft(restaurantProfile.bio || ''); setRBioEditing(true); }} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Edit</button>}
                    </div>
                    {rBioEditing ? (
                      <div>
                        <textarea
                          rows={3}
                          value={rBioDraft}
                          onChange={e => setRBioDraft(e.target.value)}
                          placeholder="Tell customers about your restaurant..."
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--dash-accent)', background: 'var(--dash-bg-card)', color: 'var(--dash-text)', fontSize: '0.95rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button type="button" onClick={() => { const updated = { ...restaurantProfile, bio: rBioDraft }; setRestaurantProfile(updated); persistRestaurant(updated); setRBioEditing(false); }} style={{ padding: '0.5rem 1.2rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Save</button>
                          <button type="button" onClick={() => setRBioEditing(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--dash-subtext)', border: '1px solid var(--dash-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => { setRBioDraft(restaurantProfile.bio || ''); setRBioEditing(true); }} style={{ padding: '0.85rem 1rem', background: 'var(--dash-bg-card)', border: '1px solid var(--dash-border)', borderRadius: '12px', color: restaurantProfile.bio ? 'var(--dash-text)' : 'var(--dash-subtext)', fontSize: '0.95rem', lineHeight: 1.6, cursor: 'text', minHeight: '3rem' }}>
                        {restaurantProfile.bio || 'Click to add a bio…'}
                      </div>
                    )}
                  </div>

                  {/* Contact */}
                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {restaurantProfile.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: 'var(--dash-bg-card)', border: '1px solid var(--dash-border)', borderRadius: '12px' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ color: 'var(--dash-subtext)', flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.72 16z"/></svg>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--dash-subtext)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</div>
                          <div style={{ fontSize: '0.95rem', color: 'var(--dash-text)', fontWeight: 600 }}>{restaurantProfile.phone}</div>
                        </div>
                      </div>
                    )}
                    {(restaurantProfile.email || displayEmail) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: 'var(--dash-bg-card)', border: '1px solid var(--dash-border)', borderRadius: '12px' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ color: 'var(--dash-subtext)', flexShrink: 0 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--dash-subtext)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
                          <div style={{ fontSize: '0.95rem', color: 'var(--dash-text)', fontWeight: 600 }}>{restaurantProfile.email || displayEmail}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Gallery Images — up to 3, inline upload */}
                  <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--dash-text)', margin: 0 }}>Gallery Images</h3>
                      {(restaurantProfile.gallery || []).length < 3 && (
                        <>
                          <input type="file" accept="image/*" multiple id="r-gallery-upload" style={{ display: 'none' }} onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (!files.length) return;
                            const existing = restaurantProfile.gallery || [];
                            const slots = 3 - existing.length;
                            const toRead = files.slice(0, slots);
                            let loaded = [];
                            toRead.forEach((file, i) => {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                loaded.push({ url: ev.target.result, name: '' });
                                if (loaded.length === toRead.length) {
                                  const updated = { ...restaurantProfile, gallery: [...existing, ...loaded] };
                                  setRestaurantProfile(updated);
                                  persistRestaurant(updated);
                                }
                              };
                              reader.readAsDataURL(file);
                            });
                          }} />
                          <label htmlFor="r-gallery-upload" style={{ cursor: 'pointer', color: '#6366f1', fontWeight: 600, fontSize: '0.85rem' }}>+ Add Image</label>
                        </>
                      )}
                    </div>
                    {(restaurantProfile.gallery || []).length === 0 ? (
                      <div style={{ padding: '2rem', border: '2px dashed var(--dash-border)', borderRadius: '16px', textAlign: 'center', color: 'var(--dash-subtext)', fontSize: '0.9rem' }}>
                        No gallery images yet. Add up to 3.
                      </div>
                    ) : (
                      <div className="dash-gallery-grid">
                        {(restaurantProfile.gallery || []).map((item, idx) => (
                          <div className="dash-gallery-item" key={idx}>
                            <img src={item.url} alt={item.name || ''} />
                            <div className="dash-gallery-item-overlay">
                              <input
                                className="dash-gallery-item-name-input"
                                value={item.name || ''}
                                placeholder="Caption"
                                onChange={(e) => {
                                  const newGal = [...(restaurantProfile.gallery || [])];
                                  newGal[idx] = { ...newGal[idx], name: e.target.value };
                                  const updated = { ...restaurantProfile, gallery: newGal };
                                  setRestaurantProfile(updated);
                                  persistRestaurant(updated);
                                }}
                              />
                              <button
                                className="dash-gallery-remove-btn"
                                onClick={() => {
                                  const newGal = (restaurantProfile.gallery || []).filter((_, i) => i !== idx);
                                  const updated = { ...restaurantProfile, gallery: newGal };
                                  setRestaurantProfile(updated);
                                  persistRestaurant(updated);
                                }}
                              >✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Social / Platform Links */}
                  <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--dash-text)', margin: 0 }}>Links</h3>
                      <button
                        type="button"
                        className="dash-add-platform-btn"
                        onClick={() => { setRTempPlatforms(Object.keys(restaurantProfile.links || {})); setRLinkSelectorOpen(true); }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Platforms
                      </button>
                    </div>
                    <div className="dash-links-section">
                      {ALL_PLATFORMS.filter(p => p.id in (restaurantProfile.links || {})).map(p => (
                        <div className="dash-link-card" key={p.id}>
                          <div className="dash-link-card-main">
                            <div className="dash-link-icon-circle">
                              {getLinkIcon({ platform: p.id })}
                            </div>
                            <div className="dash-link-content">
                              <div className="dash-link-title-row">
                                <span className="dash-link-title">{p.label}</span>
                              </div>
                              <div className="dash-link-url">
                                <input
                                  className="dash-link-inline-input"
                                  placeholder="Enter URL / handle"
                                  value={(restaurantProfile.links || {})[p.id] || ''}
                                  onChange={(e) => {
                                    const updated = { ...restaurantProfile, links: { ...(restaurantProfile.links || {}), [p.id]: e.target.value } };
                                    setRestaurantProfile(updated);
                                    persistRestaurant(updated);
                                  }}
                                />
                              </div>
                            </div>
                            <div className="dash-link-controls">
                              <button
                                className="dash-link-remove-icon-btn"
                                onClick={() => {
                                  const newLinks = { ...(restaurantProfile.links || {}) };
                                  delete newLinks[p.id];
                                  const updated = { ...restaurantProfile, links: newLinks };
                                  setRestaurantProfile(updated);
                                  persistRestaurant(updated);
                                }}
                                title="Remove this platform"
                              >✕</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: live preview panel */}
                <div className="dash-preview-panel">
                  <div className="dash-full-preview-container">
                    {(() => {
                      const t = GENERAL_THEMES.find(th => th.id === restaurantProfile.theme) || GENERAL_THEMES[0];
                      const titleFontFamily = resolveFontFamily(restaurantProfile.titleFont || restaurantProfile.font || 'outfit');
                      const bodyFontFamily = resolveFontFamily(restaurantProfile.bodyFont || restaurantProfile.font || 'outfit');
                      return (
                        <div style={{ width: '100%', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: t.bg, fontFamily: bodyFontFamily }}>
                          {restaurantProfile.banner && (
                            <img src={restaurantProfile.banner} alt="Banner" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                          )}
                          <div style={{ padding: '20px', textAlign: 'center', color: t.text }}>
                            <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 6px', color: t.text, fontFamily: titleFontFamily }}>{restaurantProfile.name}</h2>
                            <p style={{ margin: '0 0 10px', fontSize: '17px', color: t.text, opacity: 0.75, fontFamily: titleFontFamily }}>{restaurantProfile.tagline}</p>
                            {restaurantProfile.bio && <p style={{ margin: '0 0 18px', fontSize: '15px', lineHeight: 1.6, color: t.text, opacity: 0.7, fontFamily: bodyFontFamily }}>{restaurantProfile.bio}</p>}
                            {restaurantProfile.phone && (
                              <div style={{ display: 'inline-block', padding: '8px 20px', background: t.linkBg || 'rgba(255,255,255,0.15)', borderRadius: '20px', color: t.text, fontSize: '16px', marginBottom: '10px' }}>📞 {restaurantProfile.phone}</div>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                              {restaurantProfile.menuPdf && (
                                <span style={{ padding: '6px 14px', background: t.linkBg || 'rgba(255,255,255,0.15)', borderRadius: '16px', color: t.text, fontSize: '14px' }}>📄 View Menu</span>
                              )}
                              {Object.entries(restaurantProfile.links || {}).filter(([, v]) => v).map(([k, v]) => (
                                <a key={k} href={v} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 14px', background: t.linkBg || 'rgba(255,255,255,0.15)', borderRadius: '16px', color: t.text, fontSize: '14px', textDecoration: 'none' }}>{k}</a>
                              ))}
                            </div>
                          </div>
                          {(restaurantProfile.gallery || []).length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '0 12px 16px' }}>
                              {(restaurantProfile.gallery || []).map((item, i) => (
                                <div key={i} style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}>
                                  <img src={item.url} alt={item.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* ── DESIGN TAB ── */}
            {restaurantActiveTab === 'design' && (
              <div className="dash-profile-layout">
                <div className="dash-single-profile" style={{ padding: '2.5rem', overflowY: 'auto' }}>

                  {/* Profile Theme — applies to public page */}
                  <section className="dash-design-section" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--dash-text)' }}>Profile Theme</h2>
                    <p style={{ color: 'var(--dash-subtext)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Choose a look for your public restaurant page</p>
                    <div className="dash-design-grid dash-themes-grid">
                      {GENERAL_THEMES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => {
                            const updated = { ...restaurantProfile, theme: t.id };
                            setRestaurantProfile(updated);
                            persistRestaurant(updated);
                          }}
                          className={`dash-design-card ${restaurantProfile.theme === t.id ? 'active' : ''}`}
                          style={{
                            border: '2px solid ' + (restaurantProfile.theme === t.id ? 'var(--dash-accent)' : 'var(--dash-border)'),
                            boxShadow: restaurantProfile.theme === t.id ? '0 10px 25px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          <div className={`dash-theme-indicator ${t.isAnimated ? t.className : ''}`} style={{ background: t.isAnimated ? undefined : t.bg }} />
                          <h3 className="dash-design-card-label">{t.label}</h3>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Font — applies to public page */}
                  <section className="dash-design-section">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--dash-text)' }}>Font</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--dash-subtext)' }}>
                        <input
                          type="checkbox"
                          checked={rSyncFonts}
                          onChange={e => {
                            setRSyncFonts(e.target.checked);
                            if (e.target.checked) {
                              const tf = restaurantProfile.titleFont || 'outfit';
                              const updated = { ...restaurantProfile, bodyFont: tf };
                              setRestaurantProfile(updated);
                              persistRestaurant(updated);
                            }
                          }}
                          style={{ width: 16, height: 16, accentColor: 'var(--dash-accent)' }}
                        />
                        Use same font for all
                      </label>
                    </div>
                    <p style={{ color: 'var(--dash-subtext)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select fonts that match your restaurant brand</p>

                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--dash-text)' }}>Heading Font (Name &amp; Tagline)</h3>
                      <div className="dash-design-grid dash-fonts-grid">
                        {AVAILABLE_FONTS.map(f => (
                          <button
                            key={`rtitle-${f.id}`}
                            onClick={() => {
                              const update = rSyncFonts
                                ? { ...restaurantProfile, titleFont: f.id, bodyFont: f.id }
                                : { ...restaurantProfile, titleFont: f.id };
                              setRestaurantProfile(update);
                              persistRestaurant(update);
                            }}
                            className={`dash-design-card ${(restaurantProfile.titleFont || 'outfit') === f.id ? 'active' : ''}`}
                            style={{ border: '2px solid ' + ((restaurantProfile.titleFont || 'outfit') === f.id ? 'var(--dash-accent)' : 'var(--dash-border)') }}
                          >
                            <p style={{ fontSize: '1.5rem', margin: '0 0 0.75rem 0', color: 'var(--dash-text)', fontFamily: resolveFontFamily(f.id) }}>{f.sample}</p>
                            <h3 className="dash-design-card-label">{f.label}</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--dash-subtext)', margin: 0 }}>{f.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {!rSyncFonts && (
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--dash-text)' }}>Body Font (Bio &amp; Descriptions)</h3>
                        <div className="dash-design-grid dash-fonts-grid">
                          {AVAILABLE_FONTS.map(f => (
                            <button
                              key={`rbody-${f.id}`}
                              onClick={() => {
                                const update = { ...restaurantProfile, bodyFont: f.id };
                                setRestaurantProfile(update);
                                persistRestaurant(update);
                              }}
                              className={`dash-design-card ${(restaurantProfile.bodyFont || 'outfit') === f.id ? 'active' : ''}`}
                              style={{ border: '2px solid ' + ((restaurantProfile.bodyFont || 'outfit') === f.id ? 'var(--dash-accent)' : 'var(--dash-border)') }}
                            >
                              <p style={{ fontSize: '1.5rem', margin: '0 0 0.75rem 0', color: 'var(--dash-text)', fontFamily: resolveFontFamily(f.id) }}>{f.sample}</p>
                              <h3 className="dash-design-card-label">{f.label}</h3>
                              <p style={{ fontSize: '0.75rem', color: 'var(--dash-subtext)', margin: 0 }}>{f.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                {/* Right: live preview showing the theme + font applied to the public page */}
                <div className="dash-preview-panel">
                  <div className="dash-full-preview-container">
                    {(() => {
                      const t = GENERAL_THEMES.find(th => th.id === restaurantProfile.theme) || GENERAL_THEMES[0];
                      const titleFontFamily = resolveFontFamily(restaurantProfile.titleFont || restaurantProfile.font || 'outfit');
                      const bodyFontFamily = resolveFontFamily(restaurantProfile.bodyFont || restaurantProfile.font || 'outfit');
                      const isGradient = t.bg && t.bg.includes('gradient');
                      return (
                        <div style={{ width: '100%', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: isGradient ? t.bg : t.bg, fontFamily: bodyFontFamily }}>
                          {restaurantProfile.banner && (
                            <img src={restaurantProfile.banner} alt="Banner" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                          )}
                          <div style={{ padding: '20px', textAlign: 'center', color: t.text }}>
                            <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 6px', fontFamily: titleFontFamily, color: t.text }}>{restaurantProfile.name}</h2>
                            <p style={{ margin: '0 0 10px', fontSize: '17px', color: t.text, opacity: 0.75, fontFamily: titleFontFamily }}>{restaurantProfile.tagline}</p>
                            {restaurantProfile.bio && <p style={{ margin: '0 0 18px', fontSize: '15px', lineHeight: 1.6, color: t.text, opacity: 0.7, fontFamily: bodyFontFamily }}>{restaurantProfile.bio}</p>}
                            {restaurantProfile.phone && (
                              <div style={{ display: 'inline-block', padding: '8px 20px', background: t.linkBg || 'rgba(255,255,255,0.15)', borderRadius: '20px', color: t.text, fontSize: '16px', marginBottom: '10px' }}>📞 {restaurantProfile.phone}</div>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                              {restaurantProfile.menuPdf && (
                                <span style={{ padding: '6px 14px', background: t.linkBg || 'rgba(255,255,255,0.15)', borderRadius: '16px', color: t.text, fontSize: '14px' }}>📄 View Menu</span>
                              )}
                              {Object.entries(restaurantProfile.links || {}).filter(([, v]) => v).map(([k, v]) => (
                                <a key={k} href={v} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 14px', background: t.linkBg || 'rgba(255,255,255,0.15)', borderRadius: '16px', color: t.text, fontSize: '14px', textDecoration: 'none' }}>{k}</a>
                              ))}
                            </div>
                          </div>
                          {(restaurantProfile.gallery || []).length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '0 12px 16px' }}>
                              {(restaurantProfile.gallery || []).map((item, i) => (
                                <div key={i} style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}>
                                  <img src={item.url} alt={item.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* ── MENU TAB ── */}
            {restaurantActiveTab === 'menu' && (
              <div className="dash-profile-layout">
                {/* Left: PDF upload & viewer */}
                <div className="dash-single-profile" style={{ padding: '2.5rem', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dash-text)', margin: 0 }}>Menu PDF</h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--dash-subtext)', margin: '4px 0 0' }}>Customers can view this on your public profile</p>
                    </div>
                    {restaurantProfile.menuPdf && (
                      <>
                        <input type="file" accept="application/pdf" id="dash-menu-replace" style={{ display: 'none' }} onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const updated = { ...restaurantProfile, menuPdf: ev.target.result };
                            setRestaurantProfile(updated);
                            persistRestaurant(updated);
                            setPdfNumPages(null);
                          };
                          reader.readAsDataURL(file);
                        }} />
                        <label htmlFor="dash-menu-replace" style={{ cursor: 'pointer', color: '#6366f1', fontWeight: 600, fontSize: '0.85rem', padding: '0.5rem 1rem', border: '1px solid #6366f1', borderRadius: '10px' }}>Replace PDF</label>
                      </>
                    )}
                  </div>

                  {restaurantProfile.menuPdf ? (
                    <div style={{ border: '1px solid var(--dash-border)', borderRadius: '16px', overflow: 'hidden' }}>
                      <div style={{ maxHeight: 600, overflowY: 'auto', background: '#f1f5f9', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Document
                          file={restaurantProfile.menuPdf}
                          onLoadSuccess={onPdfLoadSuccess}
                          loading={<div style={{ padding: '3rem', color: '#64748b' }}>Loading menu...</div>}
                          error={<div style={{ padding: '3rem', color: '#ef4444' }}>Failed to load PDF.</div>}
                        >
                          {pdfNumPages && Array.from(new Array(pdfNumPages), (el, index) => (
                            <div key={`page_${index + 1}`} style={{ marginBottom: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
                              <Page pageNumber={index + 1} renderTextLayer={false} renderAnnotationLayer={false} width={380} />
                            </div>
                          ))}
                        </Document>
                      </div>
                      <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--dash-border)' }}>
                        <button onClick={() => {
                          const updated = { ...restaurantProfile, menuPdf: null };
                          setRestaurantProfile(updated);
                          persistRestaurant(updated);
                          setPdfNumPages(null);
                        }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Remove PDF</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '4rem 2rem', border: '2px dashed var(--dash-border)', borderRadius: '20px', textAlign: 'center', color: 'var(--dash-subtext)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ marginBottom: '1rem', opacity: 0.4 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      <p style={{ margin: '0 0 1.5rem', fontSize: '0.95rem' }}>No menu uploaded yet</p>
                      <input type="file" accept="application/pdf" id="dash-menu-upload" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const updated = { ...restaurantProfile, menuPdf: ev.target.result };
                          setRestaurantProfile(updated);
                          persistRestaurant(updated);
                        };
                        reader.readAsDataURL(file);
                      }} />
                      <label htmlFor="dash-menu-upload" style={{ cursor: 'pointer', color: '#fff', fontWeight: 600, display: 'inline-block', padding: '0.65rem 1.5rem', background: '#6366f1', borderRadius: '12px', fontSize: '0.9rem' }}>
                        Upload Menu PDF
                      </label>
                    </div>
                  )}
                </div>

                {/* Right: preview showing "View Menu" pill */}
                <div className="dash-preview-panel">
                  <div className="dash-full-preview-container">
                    {(() => {
                      const t = GENERAL_THEMES.find(th => th.id === restaurantProfile.theme) || GENERAL_THEMES[0];
                      const titleFontFamily = resolveFontFamily(restaurantProfile.titleFont || restaurantProfile.font || 'outfit');
                      const bodyFontFamily = resolveFontFamily(restaurantProfile.bodyFont || restaurantProfile.font || 'outfit');
                      return (
                        <div style={{ width: '100%', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: t.bg, fontFamily: bodyFontFamily, padding: '2rem' }}>
                          {restaurantProfile.menuPdf ? (
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ width: 64, height: 64, borderRadius: '18px', background: t.linkBg || 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '28px' }}>📄</div>
                              <p style={{ color: t.text, fontWeight: 600, margin: '0 0 0.5rem', fontFamily: titleFontFamily }}>Menu available</p>
                              <p style={{ color: t.text, opacity: 0.6, fontSize: '0.8rem', margin: 0, fontFamily: bodyFontFamily }}>Customers can tap to view your menu</p>
                              <div style={{ marginTop: '1.5rem', padding: '10px 24px', background: t.linkBg || 'rgba(255,255,255,0.15)', borderRadius: '20px', display: 'inline-block', color: t.text, fontSize: '14px', fontFamily: bodyFontFamily }}>📄 View Menu</div>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', opacity: 0.5 }}>
                              <div style={{ fontSize: '48px', marginBottom: '0.75rem' }}>📋</div>
                              <p style={{ color: t.text, fontSize: '0.85rem', margin: 0 }}>Upload a menu PDF to show it here</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Restaurant Platform Selector Modal — same as artist */}
        {rLinkSelectorOpen && (
          <div className="dash-selector-overlay">
            <div className="dash-selector-modal">
              <div className="dash-selector-header">
                <h3>Add Platforms</h3>
                <p>Select platforms to add to your restaurant profile</p>
              </div>
              <div className="dash-selector-grid">
                {ALL_PLATFORMS.map((p) => {
                  const isActive = rTempPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`dash-selector-item ${isActive ? 'is-active' : ''}`}
                      onClick={() => setRTempPlatforms(prev => isActive ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    >
                      <div className="dash-selector-icon">
                        {getLinkIcon({ platform: p.id })}
                      </div>
                      <span className="dash-selector-label">{p.label}</span>
                      {isActive && <div className="dash-selector-check">✓</div>}
                    </button>
                  );
                })}
              </div>
              <div className="dash-selector-actions">
                <button type="button" className="dash-selector-btn-cancel" onClick={() => setRLinkSelectorOpen(false)}>Cancel</button>
                <button type="button" className="dash-selector-btn-done" onClick={() => {
                  const currentLinks = restaurantProfile.links || {};
                  const newLinks = { ...currentLinks };
                  rTempPlatforms.forEach(id => { if (!(id in newLinks)) newLinks[id] = ''; });
                  Object.keys(newLinks).forEach(id => { if (!rTempPlatforms.includes(id)) delete newLinks[id]; });
                  const updated = { ...restaurantProfile, links: newLinks };
                  setRestaurantProfile(updated);
                  persistRestaurant(updated);
                  setRLinkSelectorOpen(false);
                }}>Done</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (isLoggedIn && isRestaurantMode && !restaurantProfile) {
    const rStep = restaurantOnboardingStep;
    return (
      <div className="profile-page profile-login-wrap onboarding-screen">
        <div className="profile-login-card profile-choice-card general-onboarding-card">
          {rStep > 1 && (
            <button type="button" className="profile-back-btn" onClick={() => updateRestaurantOnboardingStep(rStep - 1)}>← Back</button>
          )}
          <div className="general-onboarding-progress">
            <div className="general-onboarding-progress-bar" style={{ width: `${(rStep / 4) * 100}%` }} />
          </div>

          {rStep === 1 && (
            <div className="onboarding-step fade-in">
              <h2>Step 1 – Identity</h2>
              <p className="onboarding-subtitle">Restaurant name and details</p>
              <div className="onboarding-fields">
                <div className="onboarding-field">
                  <label>Restaurant name</label>
                  <input type="text" className="onboarding-input" value={restaurantForm.name} onChange={e => setRestaurantForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. My Cafe" required autoFocus />
                </div>
                <div className="onboarding-field">
                  <label>Tagline</label>
                  <input type="text" className="onboarding-input" value={restaurantForm.tagline} onChange={e => setRestaurantForm(prev => ({ ...prev, tagline: e.target.value }))} placeholder="e.g. Fresh food, fast" />
                </div>
                <div className="onboarding-field">
                  <label>Bio / Description</label>
                  <textarea className="onboarding-textarea" rows={3} value={restaurantForm.bio} onChange={e => setRestaurantForm(prev => ({ ...prev, bio: e.target.value }))} placeholder="Tell customers about your restaurant..." />
                </div>
                <div className="onboarding-field" style={{ marginTop: '1.5rem' }}>
                  <label>Banner Image</label>
                  <div className="upload-preview-banner" onClick={() => document.getElementById('restaurant-banner-input').click()}>
                    {restaurantForm.banner ? <img src={restaurantForm.banner} alt="Preview" /> : <span>+ Click to upload banner</span>}
                  </div>
                  <input id="restaurant-banner-input" type="file" hidden onChange={handleRestaurantBannerUpload} accept="image/*" />
                </div>
              </div>
              <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="onboarding-btn-primary" onClick={() => {
                  setRestaurantForm(prev => ({ ...prev, email: prev.email || displayEmail }));
                  updateRestaurantOnboardingStep(2);
                }} disabled={!restaurantForm.name.trim()}>Next Step →</button>
              </div>
            </div>
          )}

          {rStep === 2 && (
            <div className="onboarding-step fade-in">
              <h2>Step 2 – Contact info</h2>
              <p className="onboarding-subtitle">Phone and email contact</p>
              <div className="onboarding-fields">
                <div className="onboarding-field">
                  <label>Phone</label>
                  <input type="tel" className="onboarding-input" value={restaurantForm.phone} onChange={e => setRestaurantForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+91 98765 43210" autoFocus />
                </div>
                <div className="onboarding-field">
                  <label>Email</label>
                  <input type="email" className="onboarding-input" value={displayEmail || restaurantForm.email} readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                </div>
              </div>
              <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="onboarding-btn-primary" onClick={() => updateRestaurantOnboardingStep(3)}>Next Step →</button>
              </div>
            </div>
          )}

          {rStep === 3 && (
            <div className="onboarding-step fade-in">
              <h2>Step 3 – Look</h2>
              <p className="onboarding-subtitle">Theme</p>
              <div className="onboarding-fields">
                <div className="onboarding-field onboarding-theme-field">
                  <label>Theme</label>
                  <div className="onboarding-theme-selector-wrap">
                    <div className="onboarding-theme-selector onboarding-theme-grid">
                      {GENERAL_THEMES.map((t) => (
                        <button 
                          key={t.id} 
                          type="button" 
                          className={`theme-pick-btn ${restaurantForm.theme === t.id ? 'active' : ''}`} 
                          onClick={() => setRestaurantForm(prev => ({ ...prev, theme: t.id }))}
                          style={{
                            background: t.bg,
                            color: t.text,
                            opacity: restaurantForm.theme === t.id ? 1 : 0.65,
                            borderWidth: restaurantForm.theme === t.id ? 2 : 1,
                            borderColor: restaurantForm.theme === t.id ? '#6366f1' : 'rgba(0,0,0,0.1)'
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="onboarding-btn-primary" onClick={() => updateRestaurantOnboardingStep(4)}>Next Step →</button>
              </div>
            </div>
          )}

          {rStep === 4 && (
            <div className="onboarding-step fade-in">
              <h2>Step 4 – Menu</h2>
              <p className="onboarding-subtitle">Upload your menu PDF</p>
              <div className="onboarding-fields">
                <div className="onboarding-field">
                  <label style={{ color: '#1a1b2e' }}>Menu PDF</label>
                  {!restaurantForm.menuPdf ? (
                    <div style={{ padding: '2rem', border: '2px dashed rgba(0,0,0,0.15)', borderRadius: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.02)' }}>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        style={{ display: 'none' }}
                        id="menu-pdf-upload"
                      />
                      <label htmlFor="menu-pdf-upload" style={{ cursor: 'pointer', color: '#6366f1', fontWeight: 600, display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(99,102,241,0.1)', borderRadius: '8px' }}>
                        Click to upload PDF
                      </label>
                      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>Max file size: 5MB</p>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                      <button 
                        type="button" 
                        onClick={removePdf} 
                        style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color: '#ef4444' }}
                      >
                        ✕
                      </button>
                      <div style={{ maxHeight: 400, overflowY: 'auto', background: '#f1f5f9', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Document
                          file={restaurantForm.menuPdf}
                          onLoadSuccess={onPdfLoadSuccess}
                          loading={<div style={{ padding: '2rem', color: '#64748b' }}>Loading PDF...</div>}
                          error={<div style={{ padding: '2rem', color: '#ef4444' }}>Failed to load PDF. Try another.</div>}
                        >
                          {pdfNumPages && Array.from(new Array(pdfNumPages), (el, index) => (
                            <div key={`page_${index + 1}`} style={{ marginBottom: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                              <Page 
                                pageNumber={index + 1} 
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                width={280}
                              />
                            </div>
                          ))}
                        </Document>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="onboarding-btn-complete" onClick={saveRestaurantProfile}>Save Restaurant ✓</button>
              </div>
            </div>
          )}

          <button type="button" onClick={handleLogout} className="profile-logout-btn-link" style={{ marginTop: 16 }}>Sign out</button>
        </div>
      </div>
    );
  }

  // General Profile: 4-step onboarding (no profile yet)
  if (isLoggedIn && isGeneralMode && !generalProfile && !generalProfileLoading) {
    const genStep = generalOnboardingStep;
    return (
      <div className="profile-page profile-login-wrap onboarding-screen">
        <div className="profile-login-card profile-choice-card general-onboarding-card">
          {genStep > 1 && (
            <button type="button" className="profile-back-btn" onClick={() => updateGeneralOnboardingStep(genStep - 1)}>← Back</button>
          )}
          <div className="general-onboarding-progress">
            <div className="general-onboarding-progress-bar" style={{ width: `${(genStep / 4) * 100}%` }} />
          </div>

          {genStep === 1 && (
            <div className="onboarding-step fade-in">
              <h2>Step 1 – Identity</h2>
              <p className="onboarding-subtitle">Your name and profile link</p>
              <div className="onboarding-fields">
                <div className="onboarding-field">
                  <label>Name</label>
                  <input type="text" className="onboarding-input" value={generalForm.name} onChange={e => setGeneralForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Your name" required autoFocus />
                </div>
                <div className="onboarding-field">
                  <label>Username (for your link)</label>
                  <div className="artist-id-input-wrapper" style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="onboarding-input-id"
                      style={{
                        paddingLeft: '1.25rem',
                        paddingRight: '2.5rem',
                        borderColor: usernameCheck.status === 'available' ? '#10b981' : usernameCheck.status === 'taken' || usernameCheck.status === 'invalid' ? '#ef4444' : undefined
                      }}
                      autoComplete="off"
                      value={generalForm.username}
                      onChange={e => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                        setGeneralForm(prev => ({ ...prev, username: val }));
                        clearTimeout(usernameCheckTimer.current);
                        if (!val || val.length < 3) {
                          setUsernameCheck(val ? { status: 'invalid', msg: 'At least 3 characters' } : { status: 'idle', msg: '' });
                          return;
                        }
                        setUsernameCheck({ status: 'checking', msg: '' });
                        usernameCheckTimer.current = setTimeout(async () => {
                          try {
                            await generalProfileAPI.getByUsername(val);
                            setUsernameCheck({ status: 'taken', msg: 'Username already taken' });
                          } catch {
                            setUsernameCheck({ status: 'available', msg: 'Available!' });
                          }
                        }, 500);
                      }}
                      placeholder="myprofile"
                      required
                    />
                    {usernameCheck.status === 'checking' && (
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: '#94a3b8' }}>...</span>
                    )}
                    {usernameCheck.status === 'available' && (
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#10b981' }}>✓</span>
                    )}
                    {(usernameCheck.status === 'taken' || usernameCheck.status === 'invalid') && (
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#ef4444' }}>✕</span>
                    )}
                  </div>
                  {usernameCheck.status === 'taken' && (
                    <small style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block', paddingLeft: '0.5rem' }}>{usernameCheck.msg}</small>
                  )}
                  {usernameCheck.status === 'invalid' && (
                    <small style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block', paddingLeft: '0.5rem' }}>{usernameCheck.msg}</small>
                  )}
                  {usernameCheck.status === 'available' && (
                    <small style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block', paddingLeft: '0.5rem' }}>{usernameCheck.msg}</small>
                  )}
                  <small className="onboarding-tip">Your link: <b>nanoprofile.com/link/{generalForm.username || 'username'}</b></small>
                </div>
                <div className="onboarding-field">
                  <label>Title / tagline (optional)</label>
                  <input type="text" className="onboarding-input" value={generalForm.title} onChange={e => setGeneralForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Creator, Founder" />
                </div>
              </div>
              <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="onboarding-btn-primary" onClick={() => updateGeneralOnboardingStep(2)} disabled={!generalForm.name.trim() || !generalForm.username.trim() || usernameCheck.status !== 'available'}>Next Step →</button>
              </div>
            </div>
          )}

          {genStep === 2 && (
            <div className="onboarding-step fade-in">
              <h2>Step 2 – Look</h2>
              <p className="onboarding-subtitle">Choose theme and font</p>
              <div className="onboarding-fields">
                <div className="onboarding-field onboarding-theme-field">
                  <label>Theme</label>
                  <div className="onboarding-theme-selector-wrap">
                    <div className="onboarding-theme-selector onboarding-theme-grid">
                      {GENERAL_THEMES.slice(0, 8).map((t) => (
                        <button 
                          key={t.id} 
                          type="button" 
                          className={`theme-pick-btn ${generalForm.theme === t.id ? 'active' : ''}`} 
                          onClick={() => setGeneralForm(prev => ({ ...prev, theme: t.id }))}
                          style={{
                            background: t.bg,
                            color: t.text,
                            opacity: generalForm.theme === t.id ? 1 : 0.65,
                            borderWidth: generalForm.theme === t.id ? 2 : 1,
                            borderColor: generalForm.theme === t.id ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)'
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="onboarding-field onboarding-theme-field" style={{ marginTop: '1rem' }}>
                  <label>Font</label>
                  <div className="onboarding-theme-selector-wrap">
                    <div className="onboarding-theme-selector onboarding-theme-grid">
                      {[{ id: 'outfit', label: 'Outfit' }, { id: 'playfair', label: 'Playfair' }, { id: 'caveat', label: 'Caveat' }, { id: 'mono-font', label: 'Mono' }].map((f) => (
                        <button 
                          key={f.id} 
                          type="button" 
                          className={`theme-pick-btn ${generalForm.font === f.id ? 'active' : ''}`} 
                          onClick={() => setGeneralForm(prev => ({ ...prev, font: f.id }))}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: '#fff',
                            borderWidth: generalForm.font === f.id ? 2 : 1,
                            borderColor: generalForm.font === f.id ? '#6366f1' : 'transparent',
                            fontFamily: f.id === 'playfair' ? 'Playfair Display, serif' : f.id === 'caveat' ? 'Caveat, cursive' : f.id === 'mono-font' ? 'monospace' : 'Outfit, sans-serif'
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="onboarding-btn-primary" onClick={() => updateGeneralOnboardingStep(3)}>Next Step →</button>
              </div>
            </div>
          )}

          {genStep === 3 && (
            <div className="onboarding-step fade-in">
              <h2>Step 3 – Photo & bio</h2>
              <p className="onboarding-subtitle">Profile photo and short bio</p>
              <div className="onboarding-fields">
                <div className="onboarding-field">
                  <label>Profile photo (optional)</label>
                  <div className="image-upload-box">
                    <div className="upload-preview-circle" onClick={() => document.getElementById('gen-photo-input').click()}>
                      {(generalForm.photo || generalPhotoFile) ? <img src={generalPhotoFile ? URL.createObjectURL(generalPhotoFile) : generalForm.photo} alt="Preview" /> : <span>+</span>}
                    </div>
                    <input id="gen-photo-input" type="file" hidden accept="image/*" onChange={e => e.target.files?.[0] && setGeneralPhotoFile(e.target.files[0])} />
                  </div>
                </div>
                <div className="onboarding-field">
                  <label>Short bio (optional)</label>
                  <textarea className="onboarding-textarea" value={generalForm.bio} onChange={e => setGeneralForm(prev => ({ ...prev, bio: e.target.value }))} rows={3} placeholder="A few words about you" />
                </div>
              </div>
              <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="onboarding-btn-primary" onClick={() => updateGeneralOnboardingStep(4)}>Next Step →</button>
              </div>
            </div>
          )}

          {genStep === 4 && (
            <form className="onboarding-step fade-in" onSubmit={handleGeneralCreate}>
              <h2>Step 4 – Links</h2>
              <p className="onboarding-subtitle">Add links for your page</p>
              {error && <div className="profile-error-msg">{error}</div>}
              <div className="onboarding-fields">
                {generalForm.links.map((link, idx) => (
                  <div key={idx} className="profile-edit-link-block fade-in" style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '16px', background: 'rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '0.8rem' }}>
                      <select className="onboarding-input" value={link.platform} onChange={e => updateLink(idx, 'platform', e.target.value)} style={{ flex: 1, padding: '0.8rem', background: 'rgba(0,0,0,0.03)', color: '#1a1b2e', border: '1px solid rgba(0,0,0,0.1)' }}>
                        <option value="website" style={{ color: '#000' }}>Website</option>
                        <option value="whatsapp" style={{ color: '#000' }}>WhatsApp</option>
                        <option value="telegram" style={{ color: '#000' }}>Telegram</option>
                        <option value="instagram" style={{ color: '#000' }}>Instagram</option>
                        <option value="twitter" style={{ color: '#000' }}>Twitter / X</option>
                        <option value="tiktok" style={{ color: '#000' }}>TikTok</option>
                        <option value="snapchat" style={{ color: '#000' }}>Snapchat</option>
                        <option value="threads" style={{ color: '#000' }}>Threads</option>
                        <option value="linkedin" style={{ color: '#000' }}>LinkedIn</option>
                        <option value="youtube" style={{ color: '#000' }}>YouTube</option>
                        <option value="custom" style={{ color: '#000' }}>Custom</option>
                      </select>
                      <input className="onboarding-input" style={{ flex: 2 }} placeholder="Link title (e.g. Chat on WhatsApp)" value={link.title} onChange={e => updateLink(idx, 'title', e.target.value)} />
                    </div>
                    {link.platform === 'whatsapp' && (
                      <div style={{ marginBottom: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input className="onboarding-input" placeholder="Phone number (e.g. 919876543210)" value={link.waPhone || ''} onChange={e => updateLink(idx, 'waPhone', e.target.value)} />
                        <input className="onboarding-input" placeholder="Pre-filled message (optional)" value={link.waMessage || ''} onChange={e => updateLink(idx, 'waMessage', e.target.value)} />
                      </div>
                    )}
                    {(link.platform === 'instagram' || link.platform === 'twitter' || link.platform === 'tiktok' || link.platform === 'snapchat' || link.platform === 'threads') && (
                      <div style={{ marginBottom: '0.8rem' }}>
                        <input className="onboarding-input" placeholder={link.platform === 'instagram' ? 'Username only (no @ or link)' : 'Username only'} value={link.platformUsername || ''} onChange={e => { updateLink(idx, 'platformUsername', e.target.value); }} />
                      </div>
                    )}
                    {link.platform === 'telegram' && (
                      <div style={{ marginBottom: '0.8rem' }}>
                        <input className="onboarding-input" placeholder="Username or phone (e.g. johndoe or 919876543210)" value={link.platformUsername || ''} onChange={e => updateLink(idx, 'platformUsername', e.target.value)} />
                      </div>
                    )}
                    {!SMART_PLATFORMS.includes(link.platform) && (
                      <div style={{ marginBottom: '0.8rem' }}>
                        <input className="onboarding-input" placeholder="https://" value={link.url} onChange={e => updateLink(idx, 'url', e.target.value)} />
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => removeLink(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>Remove Link</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addLink} style={{ width: '100%', padding: '1rem', borderRadius: '16px', background: 'rgba(0,0,0,0.03)', border: '2px dashed rgba(0,0,0,0.15)', color: '#1a1b2e', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s ease', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 400 }}>+</span> Add Another Link
                </button>
              </div>
              <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
                <button type="submit" className="onboarding-btn-complete" disabled={generalSaving}>
                  {generalSaving ? 'Creating...' : 'Create General Profile ✓'}
                </button>
              </div>
            </form>
          )}

          <button type="button" onClick={handleLogout} className="profile-logout-btn-link" style={{ marginTop: 16 }}>Sign out</button>
        </div>
      </div>
    );
  }

  // General Profile: theme selection (when resuming or changing theme)
  if (isLoggedIn && isGeneralMode && generalStep === 'theme' && !generalProfileLoading) {
    return (
      <div className="profile-page profile-login-wrap">
        <div className="profile-login-card profile-theme-card">
          <button type="button" onClick={handleLogout} className="profile-back-btn">← Sign out</button>
          <div className="profile-login-header">
            <h1>Select a theme</h1>
            <p>Pick the style that feels right - you can add your content later</p>
          </div>
          <div className="profile-theme-grid">
            {GENERAL_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`profile-theme-preview ${generalForm.theme === t.id ? 'selected' : ''} ${t.isAnimated ? t.className : ''}`}
                onClick={() => handleGeneralThemeSelect(t.id)}
                style={{ background: t.isAnimated ? undefined : t.bg, color: t.text }}
              >
                <div className="profile-theme-avatar" />
                <span className="profile-theme-name">{t.name}</span>
                <span className="profile-theme-desc">{t.desc}</span>
                <div className="profile-theme-icons">📷 ▶️ 🎵 📷</div>
                <div className="profile-theme-links">
                  <div className="profile-theme-link" />
                  <div className="profile-theme-link" />
                  <div className="profile-theme-link" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // General Profile: home dashboard (full sidebar layout like artist)
  if (isLoggedIn && isGeneralMode && generalStep === 'home' && !generalProfileLoading && generalProfile) {
    const gProfileLink = getProfileLink();
    return (
      <div className={`dash-root dash-theme-${dashTheme} dash-font-${dashFont} dash-tab-${generalActiveTab}`}>
        {generalSuccess && (
          <div className="profile-success-overlay" role="dialog" aria-live="polite" onClick={() => setGeneralSuccess('')}>
            <div className="profile-success-modal" onClick={(e) => e.stopPropagation()}>
              <div className="profile-success-icon-wrap">
                <svg className="profile-success-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 className="profile-success-title">Saved</h2>
              <p className="profile-success-message">{generalSuccess}</p>
              <button type="button" className="profile-success-ok" onClick={() => setGeneralSuccess('')}>OK</button>
            </div>
          </div>
        )}

        <aside className="dash-sidebar">
          <div className="dash-sidebar-brand">
            <div className="dash-sidebar-top-avatar">
              {generalProfile.photo
                ? <img src={generalProfile.photo} alt={generalProfile.name} />
                : user?.photoURL
                  ? <img src={user.photoURL} alt={displayName} />
                  : <span>{(generalProfile.name || displayName || '?')[0].toUpperCase()}</span>
              }
            </div>
            <span className="dash-brand-email-main">{displayEmail}</span>
          </div>

          <nav className="dash-nav">
            <div className="dash-nav-section">
              <span className="dash-nav-label">Management</span>
              <button className={`dash-nav-item ${generalActiveTab === 'profile' ? 'dash-nav-active' : ''}`} onClick={() => setGeneralActiveTab('profile')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                My Profile
              </button>
              <button className={`dash-nav-item ${generalActiveTab === 'design' ? 'dash-nav-active' : ''}`} onClick={() => setGeneralActiveTab('design')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                Design
              </button>
              <button className={`dash-nav-item ${generalActiveTab === 'links' ? 'dash-nav-active' : ''}`} onClick={() => setGeneralActiveTab('links')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                Links
              </button>
              <button className={`dash-nav-item ${generalActiveTab === 'preview' ? 'dash-nav-active' : ''}`} onClick={() => setGeneralActiveTab('preview')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></svg>
                Preview
              </button>
            </div>
          </nav>

          <div className="dash-sidebar-bottom" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="dash-sidebar-signout-btn dash-sidebar-home-btn"
              onClick={() => navigate('/')}
            >
              ← Back to Home
            </button>
            <button className="dash-sidebar-signout-btn" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </aside>

        <main className="dash-main">
          <header className="dash-main-header">
            <div>
              <h1 className="dash-main-title">
                {generalActiveTab === 'profile' ? 'My Profile' : generalActiveTab === 'design' ? 'Profile Design' : generalActiveTab === 'links' ? 'Manage Links' : 'Preview'}
              </h1>
              <p className="dash-main-subtitle">
                {generalActiveTab === 'profile'
                  ? 'Edit your personal information and profile details'
                  : generalActiveTab === 'design'
                    ? 'Customize the visual theme and typography of your public page'
                    : generalActiveTab === 'links'
                      ? 'Add and manage your links, social media, and more'
                      : 'See a live preview of your public profile page'}
              </p>
              {generalActiveTab === 'profile' && (
                <div className="dash-profile-link-actions">
                  <button
                    type="button"
                    className="dash-link-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(gProfileLink);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                  >
                    {linkCopied ? 'Copied' : 'Copy your link'}
                  </button>
                  <a
                    className="dash-link-btn"
                    href={gProfileLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open your link
                  </a>
                </div>
              )}
            </div>
          </header>

          <div className="dash-content">
            {/* Profile Tab */}
            {generalActiveTab === 'profile' && (
              <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden' }}>
                <div className="dash-single-profile" style={{ padding: '2.5rem', overflowY: 'auto' }}>
                  {error && <div className="profile-error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: isMobileViewport ? 'flex-start' : 'center',
                      gap: '1.5rem',
                      marginBottom: '2.5rem',
                      padding: '1.5rem',
                      background: 'var(--dash-bg-card)',
                      borderRadius: '16px',
                      border: '1px solid var(--dash-border)'
                    }}
                  >
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--dash-bg)', border: '3px solid var(--dash-border)' }}>
                      {(generalForm.photo || generalPhotoFile) ? (
                        <img src={generalPhotoFile ? URL.createObjectURL(generalPhotoFile) : generalForm.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'var(--dash-subtext)' }}>
                          {(generalProfile.name || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem', fontWeight: 700, color: 'var(--dash-text)' }}>{generalProfile.name || 'Unnamed'}</h2>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dash-accent)' }}>@{generalProfile.username}</p>
                      {/* Mobile: hide tagline in the top header box (keeps UI clean). */}
                      {generalProfile.title && !isMobileViewport && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--dash-subtext)' }}>
                          {generalProfile.title}
                        </p>
                      )}

                      {/* Mobile: move "Change Photo" under username for better alignment */}
                      {isMobileViewport && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <label
                            style={{
                              cursor: 'pointer',
                              padding: '8px 16px',
                              borderRadius: '10px',
                              border: '1.5px solid var(--dash-border)',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: 'var(--dash-text)',
                              background: 'var(--dash-bg)',
                              transition: 'all 0.2s',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap',
                              lineHeight: 1
                            }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              width="16"
                              height="16"
                              style={{ display: 'block' }}
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Change Photo
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setGeneralPhotoFile(e.target.files[0]);
                                  handleGeneralPhotoSave(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    {/* Desktop: keep Change Photo on the right */}
                    {!isMobileViewport && (
                      <label
                        style={{
                          cursor: 'pointer',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: '1.5px solid var(--dash-border)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: 'var(--dash-text)',
                          background: 'var(--dash-bg)',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          alignSelf: 'center',
                          marginLeft: 'auto',
                          whiteSpace: 'nowrap',
                          lineHeight: 1
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          width="16"
                          height="16"
                          style={{ display: 'block' }}
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setGeneralPhotoFile(e.target.files[0]);
                              handleGeneralPhotoSave(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {[
                      { key: 'name', label: 'Display Name', placeholder: 'Your full name', type: 'text' },
                      { key: 'username', label: 'Username', placeholder: 'your_username', type: 'text', disabled: true },
                      { key: 'title', label: 'Title / Tagline', placeholder: 'e.g. Company Owner, Digital Creator', type: 'text' },
                      { key: 'bio', label: 'Bio', placeholder: 'Tell people about yourself...', type: 'textarea' }
                    ].map(field => (
                      <div key={field.key} style={{ background: 'var(--dash-bg-card)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--dash-border)' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--dash-subtext)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{field.label}</label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={generalForm[field.key] || ''}
                            onChange={(e) => setGeneralForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            rows={3}
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid var(--dash-border)', fontSize: '0.95rem', background: 'var(--dash-bg)', color: 'var(--dash-text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                          />
                        ) : (
                          <input
                            type="text"
                            value={generalForm[field.key] || ''}
                            onChange={(e) => !field.disabled && setGeneralForm(prev => ({ ...prev, [field.key]: field.key === 'username' ? e.target.value.toLowerCase().replace(/\s+/g, '_') : e.target.value }))}
                            placeholder={field.placeholder}
                            disabled={field.disabled}
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid var(--dash-border)', fontSize: '0.95rem', background: field.disabled ? 'var(--dash-border)' : 'var(--dash-bg)', color: 'var(--dash-text)', outline: 'none', boxSizing: 'border-box', opacity: field.disabled ? 0.6 : 1 }}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={handleGeneralSaveAll}
                      disabled={generalSaving}
                      style={{
                        padding: '0.85rem 2.5rem',
                        borderRadius: '18px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        background: '#ffffff',
                        color: '#000000',
                        border: '1px solid #ffffff',
                        cursor: generalSaving ? 'wait' : 'pointer',
                        opacity: generalSaving ? 0.7 : 1,
                        transition: 'all 0.2s',
                        maxWidth: '380px',
                        width: '100%'
                      }}
                    >
                      {generalSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                {!isMobileViewport && (
                  <div className="dash-preview-panel">
                    <div className="dash-full-preview-container">
                      <iframe
                        key={`gp-${generalProfile.username}-${generalProfile.theme}`}
                        title="General Profile Preview"
                        src={gProfileLink}
                        className="dash-preview-iframe"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Design Tab */}
            {generalActiveTab === 'design' && (
              <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden' }}>
                <div className="dash-single-profile" style={{ padding: '2.5rem', overflowY: 'auto' }}>
                  {/* Toggle between Theme / Font for General profile */}
                  <div className="dash-design-subnav">
                    <button
                      type="button"
                      className={`dash-design-subnav-btn ${generalDesignSubTab === 'theme' ? 'active' : ''}`}
                      onClick={() => setGeneralDesignSubTab('theme')}
                    >
                      <span className="dash-design-subnav-icon">🎨</span>
                      <span>Theme</span>
                    </button>
                    <button
                      type="button"
                      className={`dash-design-subnav-btn ${generalDesignSubTab === 'font' ? 'active' : ''}`}
                      onClick={() => setGeneralDesignSubTab('font')}
                    >
                      <span className="dash-design-subnav-icon">Aa</span>
                      <span>Font</span>
                    </button>
                  </div>

                  {generalDesignSubTab === 'theme' && (
                    <section className="dash-design-section" style={{ marginBottom: '3rem' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--dash-text)' }}>Profile Theme</h2>
                      <p style={{ color: 'var(--dash-subtext)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Choose a look for your public page</p>
                      <div className="dash-design-grid dash-themes-grid">
                        {GENERAL_THEMES.map(t => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setGeneralForm(prev => ({ ...prev, theme: t.id }));
                              handleGeneralFieldSave('theme', t.id);
                            }}
                            className={`dash-design-card ${generalProfile.theme === t.id ? 'active' : ''}`}
                            style={{
                              border: '2px solid ' + (generalProfile.theme === t.id ? 'var(--dash-accent)' : 'var(--dash-border)'),
                              boxShadow: generalProfile.theme === t.id ? '0 10px 25px rgba(0,0,0,0.1)' : 'none'
                            }}
                          >
                            <div className={`dash-theme-indicator ${t.isAnimated ? t.className : ''}`} style={{ background: t.isAnimated ? undefined : t.bg }} />
                            <h3 className="dash-design-card-label">{t.label}</h3>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {generalDesignSubTab === 'font' && (
                    <section className="dash-design-section">
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--dash-text)' }}>Typography</h2>
                      <p style={{ color: 'var(--dash-subtext)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select a font that matches your style</p>
                      <div className="dash-design-grid dash-fonts-grid">
                        {AVAILABLE_FONTS.map(f => (
                          <button
                            key={`gf-${f.id}`}
                            onClick={() => {
                              setGeneralForm(prev => ({ ...prev, font: f.id }));
                              handleGeneralFieldSave('font', f.id);
                            }}
                            className={`dash-design-card ${generalProfile.font === f.id ? 'active' : ''}`}
                            style={{ border: '2px solid ' + (generalProfile.font === f.id ? 'var(--dash-accent)' : 'var(--dash-border)') }}
                          >
                            <p style={{ fontSize: '1.5rem', margin: '0 0 0.75rem 0', color: 'var(--dash-text)', fontFamily: resolveFontFamily(f.id) }}>{f.sample}</p>
                            <h3 className="dash-design-card-label">{f.label}</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--dash-subtext)', margin: 0 }}>{f.desc}</p>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {!isMobileViewport && (
                  <div className="dash-preview-panel">
                    <div className="dash-full-preview-container">
                      <iframe
                        key={`gp-design-${generalProfile.theme}-${generalProfile.font}`}
                        title="General Profile Preview"
                        src={gProfileLink}
                        className="dash-preview-iframe"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Links Tab */}
            {generalActiveTab === 'links' && (
              <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden' }}>
                <div className="dash-single-profile" style={{ padding: '2.5rem', overflowY: 'auto' }}>
                  {error && <div className="profile-error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}

                  <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--dash-text)' }}>Your Links</h2>
                    <p style={{ color: 'var(--dash-subtext)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Add links to your website, social media, portfolios, and more</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      {generalForm.links.map((link, idx) => (
                        <div
                          key={idx}
                          className="profile-general-link-card"
                          style={{
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'flex-start',
                            padding: '1rem 1.25rem',
                            background: 'var(--dash-bg-card)',
                            borderRadius: '14px',
                            border: '1px solid var(--dash-border)',
                            position: 'relative'
                          }}
                        >
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <PlatformIconSelect value={link.platform || 'website'} onChange={(val) => updateLink(idx, 'platform', val)} />
                              <input
                                placeholder="Title (e.g. My Website)"
                                value={link.title || ''}
                                onChange={(e) => updateLink(idx, 'title', e.target.value)}
                                style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1.5px solid var(--dash-border)', fontSize: '0.9rem', background: 'var(--dash-bg)', color: 'var(--dash-text)', outline: 'none', boxSizing: 'border-box' }}
                              />
                            </div>
                            <input
                              placeholder="https://..."
                              value={link.url || ''}
                              onChange={(e) => updateLink(idx, 'url', e.target.value)}
                              style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1.5px solid var(--dash-border)', fontSize: '0.9rem', background: 'var(--dash-bg)', color: 'var(--dash-text)', outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                          <button
                            type="button"
                            className="profile-general-link-remove"
                            onClick={() => removeLink(idx)}
                            style={{
                              position: 'absolute',
                              top: '-10px',
                              right: '-10px',
                              background: 'transparent',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '999px',
                              width: '30px',
                              height: '30px',
                              cursor: 'pointer',
                              fontSize: '1.05rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              fontWeight: 700,
                              lineHeight: 1,
                              boxShadow: 'none',
                              outline: 'none'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addLink}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        border: '2px dashed var(--dash-border)',
                        background: 'transparent',
                        color: 'var(--dash-accent)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        width: '100%',
                        maxWidth: '380px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                      }}
                    >
                      + Add Link
                    </button>
                  </section>

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={handleGeneralSaveAll}
                      disabled={generalSaving}
                      style={{
                        padding: '0.85rem 2.5rem',
                        borderRadius: '18px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        background: '#ffffff',
                        color: '#000000',
                        border: '1px solid #ffffff',
                        cursor: generalSaving ? 'wait' : 'pointer',
                        opacity: generalSaving ? 0.7 : 1,
                        transition: 'all 0.2s',
                        maxWidth: '380px',
                        width: '100%'
                      }}
                    >
                      {generalSaving ? 'Saving...' : 'Save Links'}
                    </button>
                  </div>
                </div>

                {!isMobileViewport && (
                  <div className="dash-preview-panel">
                    <div className="dash-full-preview-container">
                      <iframe
                        key={`gp-links-${generalProfile.username}`}
                        title="General Profile Preview"
                        src={gProfileLink}
                        className="dash-preview-iframe"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preview Tab */}
            {generalActiveTab === 'preview' && (
              <div className="dash-mobile-preview-page">
                <div className="dash-mobile-preview-frame-wrap">
                  <iframe
                    key={`gp-preview-${generalProfile.username}-${generalProfile.theme}`}
                    title="General Profile Preview"
                    src={gProfileLink}
                    className="dash-mobile-preview-iframe"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Mobile bottom nav — same style as Artist dashboard (centered pill) */}
        {isMobileViewport && (
          <div className="dash-mobile-bottom-nav">
            <div className="dash-mobile-bottom-nav-inner">
              <button
                type="button"
                className={`dash-mobile-bottom-btn ${generalActiveTab === 'profile' ? 'dash-mobile-bottom-btn-active' : ''}`}
                onClick={() => setGeneralActiveTab('profile')}
              >
                <div className="dash-mobile-bottom-btn-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 20c0-3.2 2.4-5.5 7-5.5s7 2.3 7 5.5" />
                  </svg>
                </div>
                <span>Profile</span>
              </button>
              <button
                type="button"
                className={`dash-mobile-bottom-btn ${generalActiveTab === 'design' ? 'dash-mobile-bottom-btn-active' : ''}`}
                onClick={() => setGeneralActiveTab('design')}
              >
                <div className="dash-mobile-bottom-btn-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </div>
                <span>Design</span>
              </button>
              <button
                type="button"
                className={`dash-mobile-bottom-btn ${generalActiveTab === 'links' ? 'dash-mobile-bottom-btn-active' : ''}`}
                onClick={() => setGeneralActiveTab('links')}
              >
                <div className="dash-mobile-bottom-btn-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <span>Links</span>
              </button>
              <button
                type="button"
                className={`dash-mobile-bottom-btn ${generalActiveTab === 'preview' ? 'dash-mobile-bottom-btn-active' : ''}`}
                onClick={() => setGeneralActiveTab('preview')}
              >
                <div className="dash-mobile-bottom-btn-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
                  </svg>
                </div>
                <span>Preview</span>
              </button>
              <button
                type="button"
                className="dash-mobile-bottom-btn"
                onClick={handleLogout}
              >
                <div className="dash-mobile-bottom-btn-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 17l5-5-5-5" />
                    <path d="M21 12H9" />
                    <path d="M12 19a7 7 0 1 1 0-14" />
                  </svg>
                </div>
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // General Profile: create form (first-time setup only)
  if (isLoggedIn && isGeneralMode && (generalStep === 'create') && !generalProfileLoading) {
    return (
      <div className="profile-page profile-view-wrap">
        <div className="profile-view-card profile-view-card-wide profile-general-card">
          <div className="profile-view-header profile-edit-view-header">
            <div className="profile-edit-header-row">
              <button type="button" onClick={() => updateGeneralStep('theme')} className="profile-back-btn">← Back</button>
            </div>
            <h1 className="profile-edit-main-title">Create your profile</h1>
          </div>
          {generalSuccess && (
            <div className="profile-success-overlay" role="dialog" aria-labelledby="profile-success-title" aria-live="polite" onClick={() => setGeneralSuccess('')}>
              <div className="profile-success-modal" onClick={(e) => e.stopPropagation()}>
                <div className="profile-success-icon-wrap">
                  <svg className="profile-success-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 id="profile-success-title" className="profile-success-title">Success</h2>
                <p className="profile-success-message">Your profile has been created successfully.</p>
                <button type="button" className="profile-success-ok" onClick={() => setGeneralSuccess('')}>OK</button>
              </div>
            </div>
          )}
          <form onSubmit={handleGeneralCreate} className="profile-edit-form">
            {error && <div className="profile-error-msg">{error}</div>}
            <div className="profile-edit-body">
              <div className="profile-edit-section">
                <h4 className="profile-edit-section-title">Theme</h4>
                <div className="profile-edit-theme-grid">
                  {GENERAL_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`profile-edit-theme-btn ${generalForm.theme === t.id ? 'selected' : ''}`}
                      onClick={() => setGeneralForm(prev => ({ ...prev, theme: t.id }))}
                      style={{ background: t.bg, color: t.text }}
                      title={t.label}
                    >
                      <span className="profile-edit-theme-label">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="profile-edit-section">
                <h4 className="profile-edit-section-title">Font</h4>
                <div className="theme-choices-row" style={{ marginTop: '0.5rem' }}>
                  {AVAILABLE_FONTS.slice(0, 4).map((fnt) => (
                    <button
                      key={fnt.id}
                      type="button"
                      className={`theme-pill ${generalForm.font === fnt.id ? 'selected' : ''}`}
                      onClick={() => setGeneralForm(prev => ({ ...prev, font: fnt.id }))}
                    >
                      <span className="theme-pill-label" style={{ fontFamily: resolveFontFamily(fnt.id) }}>{fnt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="profile-edit-field">
                <label>Username (for your link)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    name="username"
                    value={generalForm.username}
                    style={{
                      paddingRight: '2.5rem',
                      borderColor: usernameCheck.status === 'available' ? '#10b981' : usernameCheck.status === 'taken' || usernameCheck.status === 'invalid' ? '#ef4444' : undefined
                    }}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                      setGeneralForm(prev => ({ ...prev, username: val }));
                      clearTimeout(usernameCheckTimer.current);
                      if (!val || val.length < 3) {
                        setUsernameCheck(val ? { status: 'invalid', msg: 'At least 3 characters' } : { status: 'idle', msg: '' });
                        return;
                      }
                      if (val === generalProfile?.username) {
                        setUsernameCheck({ status: 'available', msg: 'Current username' });
                        return;
                      }
                      setUsernameCheck({ status: 'checking', msg: '' });
                      usernameCheckTimer.current = setTimeout(async () => {
                        try {
                          await generalProfileAPI.getByUsername(val);
                          setUsernameCheck({ status: 'taken', msg: 'Username already taken' });
                        } catch {
                          setUsernameCheck({ status: 'available', msg: 'Available!' });
                        }
                      }, 500);
                    }}
                    placeholder="myprofile"
                    required
                  />
                  {usernameCheck.status === 'checking' && (
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: '#94a3b8' }}>...</span>
                  )}
                  {usernameCheck.status === 'available' && (
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#10b981' }}>✓</span>
                  )}
                  {(usernameCheck.status === 'taken' || usernameCheck.status === 'invalid') && (
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#ef4444' }}>✕</span>
                  )}
                </div>
                {usernameCheck.msg && usernameCheck.status !== 'idle' && usernameCheck.status !== 'checking' && (
                  <small style={{ color: usernameCheck.status === 'available' ? '#10b981' : '#ef4444', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block' }}>{usernameCheck.msg}</small>
                )}
              </div>
              <div className="profile-edit-field">
                <label>Name</label>
                <input name="name" value={generalForm.name} onChange={(e) => setGeneralForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Your name" />
              </div>
              <div className="profile-edit-field">
                <label>Title / Tagline</label>
                <input name="title" value={generalForm.title} onChange={(e) => setGeneralForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Company owner" />
              </div>
              <div className="profile-edit-field">
                <label>Bio</label>
                <textarea name="bio" value={generalForm.bio} onChange={(e) => setGeneralForm(prev => ({ ...prev, bio: e.target.value }))} rows={2} placeholder="Short bio" />
              </div>
              <div className="profile-edit-field">
                <label>Profile photo</label>
                <div className="profile-edit-photo-row">
                  <label className="profile-edit-file-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>{generalPhotoFile ? 'Change photo' : 'Upload photo'}</span>
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setGeneralPhotoFile(e.target.files[0])} />
                  </label>
                  {(generalForm.photo || generalPhotoFile) && (
                    <div className="profile-edit-photo-preview">
                      <img src={generalPhotoFile ? URL.createObjectURL(generalPhotoFile) : generalForm.photo} alt="" />
                    </div>
                  )}
                </div>
              </div>
              <div className="profile-edit-section">
                <h4 className="profile-edit-section-title">Links</h4>
                {generalForm.links.map((link, idx) => (
                  <div key={idx} className="profile-edit-field profile-edit-link-block">
                    <div className="profile-edit-link-header">
                      <PlatformIconSelect value={link.platform || 'website'} onChange={(val) => updateLink(idx, 'platform', val)} />
                      <button
                        type="button"
                        onClick={() => removeLink(idx)}
                        className="profile-edit-remove"
                        title="Remove link"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          boxShadow: 'none',
                          outline: 'none',
                          color: '#ffffff',
                          width: 22,
                          height: 22,
                          padding: 0,
                          borderRadius: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.outline = 'none';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="profile-edit-link-fields">
                      <input placeholder="Title (e.g. My Website)" value={link.title || ''} onChange={(e) => updateLink(idx, 'title', e.target.value)} className="profile-edit-link-title" />
                      {link.platform === 'whatsapp' && (
                        <>
                          <input placeholder="Phone number (e.g. 919876543210)" value={link.waPhone || ''} onChange={(e) => updateLink(idx, 'waPhone', e.target.value)} className="profile-edit-link-url" />
                          <input placeholder="Pre-filled message (optional)" value={link.waMessage || ''} onChange={(e) => updateLink(idx, 'waMessage', e.target.value)} className="profile-edit-link-url" />
                        </>
                      )}
                      {(link.platform === 'instagram' || link.platform === 'twitter' || link.platform === 'tiktok' || link.platform === 'snapchat' || link.platform === 'threads') && (
                        <input placeholder="Username only (no @ or link)" value={link.platformUsername || ''} onChange={(e) => updateLink(idx, 'platformUsername', e.target.value)} className="profile-edit-link-url" />
                      )}
                      {link.platform === 'telegram' && (
                        <input placeholder="Username or phone (e.g. johndoe or 919876543210)" value={link.platformUsername || ''} onChange={(e) => updateLink(idx, 'platformUsername', e.target.value)} className="profile-edit-link-url" />
                      )}
                      {!SMART_PLATFORMS.includes(link.platform || '') && (
                        <input placeholder="https://..." value={link.url || ''} onChange={(e) => updateLink(idx, 'url', e.target.value)} className="profile-edit-link-url" />
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addLink} className="profile-edit-add-link">+ Add link</button>
              </div>
            </div>
            <div className="profile-edit-footer">
              <button type="submit" disabled={generalSaving}>{generalSaving ? 'Saving…' : 'Create profile'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // General Profile loading
  if (isLoggedIn && isGeneralMode && generalProfileLoading) {
    return (
      <div className="profile-page profile-loading">
        <p>Loading your profile...</p>
      </div>
    );
  }

  // Artist Profile (existing flow - logged in)

  return (
    <div className={`dash-root dash-theme-${dashTheme} dash-font-${dashFont} dash-tab-${activeTab}`}>
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-brand">
          <div className="dash-sidebar-top-avatar">
            {user?.photoURL
              ? <img src={user.photoURL} alt={displayName} />
              : <span>{avatarLetter}</span>
            }
          </div>
          <span className="dash-brand-email-main">{displayEmail}</span>
        </div>

        <nav className="dash-nav">
          <div className="dash-nav-section">
            <span className="dash-nav-label">Management</span>
            <button
              className={`dash-nav-item ${activeTab === 'profiles' ? 'dash-nav-active' : ''}`}
              onClick={() => setActiveTab('profiles')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Artist Profiles
            </button>
            <button
              className={`dash-nav-item ${activeTab === 'design' ? 'dash-nav-active' : ''}`}
              onClick={() => setActiveTab('design')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              Profile Design
            </button>
            <button
              className={`dash-nav-item ${activeTab === 'link-art' ? 'dash-nav-active' : ''}`}
              onClick={() => setActiveTab('link-art')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              Link Your Art
            </button>
          </div>
        </nav>

        <div className="dash-sidebar-bottom">
          <button className="dash-sidebar-signout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        {!(isMobileViewport && activeTab === 'design') && (
          <header className="dash-main-header">
            <div>
              <h1 className="dash-main-title">
                {activeTab === 'profiles'
                  ? 'Artist Profiles'
                  : activeTab === 'design'
                    ? 'Profile Design'
                    : activeTab === 'preview'
                      ? 'Preview'
                      : 'Link Your Art'}
              </h1>
              <p className="dash-main-subtitle">
                {activeTab === 'profiles'
                  ? 'Manage your NFC artist profiles and portfolio'
                  : activeTab === 'design'
                    ? 'Customize the visual theme and typography of your public artist profile'
                    : activeTab === 'preview'
                      ? 'See a live preview of your public artist profile'
                      : 'Connect your external portfolios, galleries, and art marketplaces'}
              </p>
              {activeTab === 'profiles' && myArtists && myArtists[0] && (() => {
                const nfcBaseUrl = process.env.REACT_APP_NFC_FRONTEND_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? `http://${window.location.hostname}:5173` : window.location.origin);
                const profileUrl = `${nfcBaseUrl}/artist?id=${myArtists[0].artistId}`;
                return (
                  <div className="dash-profile-link-actions">
                    <button
                      type="button"
                      className="dash-link-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(profileUrl);
                        alert('Profile link copied!');
                      }}
                    >
                      Copy your link
                    </button>
                    <a
                      className="dash-link-btn"
                      href={profileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open your link
                    </a>
                  </div>
                );
              })()}
            </div>
          </header>
        )}

        <div className="dash-content">
          {/* Preview-only page (used mainly for mobile bottom nav "Preview") */}
          {activeTab === 'preview' && myArtists[0] && (
            <div className="dash-mobile-preview-page">
              <div className="dash-mobile-preview-frame-wrap">
                <iframe
                  key={previewKey}
                  title="Artist Preview"
                  src={`${process.env.REACT_APP_NFC_FRONTEND_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? `http://${window.location.hostname}:5173` : window.location.origin)}/artist?id=${myArtists[0].artistId}`}
                  className="dash-mobile-preview-iframe"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          )}

          {activeTab === 'design' && myArtists[0] && (
            isMobileViewport ? (
              <div className="dash-design-mobile-page">
                <div className="dash-design-mobile-header">
                  <button
                    type="button"
                    className="dash-design-mobile-back"
                    onClick={() => setActiveTab('profiles')}
                    aria-label="Back"
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="dash-design-mobile-title">Design</span>
                </div>
                <div className="dash-design-mobile-preview-wrap">
                  {designSubTab && (
                    <button
                      type="button"
                      className="dash-design-mobile-preview-dismiss"
                      aria-label="Close design options"
                      onClick={() => setDesignSubTab(null)}
                    />
                  )}
                  <iframe
                    key={previewKey}
                    title="Profile Design Preview"
                    src={`${process.env.REACT_APP_NFC_FRONTEND_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? `http://${window.location.hostname}:5173` : window.location.origin)}/artist?id=${myArtists[0].artistId}`}
                    className="dash-design-mobile-preview-iframe"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>

                <div className="dash-design-mobile-sheet">
                  <div className="dash-design-subnav">
                    <button
                      type="button"
                      className={`dash-design-subnav-btn ${designSubTab === 'theme' ? 'active' : ''}`}
                      onClick={() => setDesignSubTab(prev => (prev === 'theme' ? null : 'theme'))}
                    >
                      <span className="dash-design-subnav-icon">🎨</span>
                      <span>Themes</span>
                    </button>
                    <button
                      type="button"
                      className={`dash-design-subnav-btn ${designSubTab === 'font' ? 'active' : ''}`}
                      onClick={() => setDesignSubTab(prev => (prev === 'font' ? null : 'font'))}
                    >
                      <span className="dash-design-subnav-icon">Aa</span>
                      <span>Fonts</span>
                    </button>
                  </div>
                  {designSubTab && (
                    <div className="dash-design-mobile-body">
                      {designSubTab === 'theme' && (
                        <section className="dash-design-section" style={{ marginBottom: '3rem' }}>
                          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--dash-text)' }}>Profile Theme</h2>
                          <p style={{ color: 'var(--dash-subtext)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Choose a professional look for your public page</p>
                          <div className="dash-design-grid dash-themes-grid">
                            {GENERAL_THEMES.map(t => (
                              <button
                                key={t.id}
                                onClick={() => handleUpdateHeroField('profileTheme', t.id)}
                                className={`dash-design-card ${myArtists[0].profileTheme === t.id ? 'active' : ''}`}
                                style={{
                                  border: '2px solid ' + (myArtists[0].profileTheme === t.id ? 'var(--dash-accent)' : 'var(--dash-border)'),
                                  boxShadow: myArtists[0].profileTheme === t.id ? '0 10px 25px rgba(0,0,0,0.1)' : 'none'
                                }}
                              >
                                <div className={`dash-theme-indicator ${t.isAnimated ? t.className : ''}`} style={{ background: t.isAnimated ? undefined : t.bg }} />
                                <h3 className="dash-design-card-label">{t.label}</h3>
                              </button>
                            ))}
                          </div>
                        </section>
                      )}

                      {designSubTab === 'font' && (
                        <section className="dash-design-section">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--dash-text)' }}>Typography</h2>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--dash-subtext)', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={syncFonts}
                                onChange={e => {
                                  setSyncFonts(e.target.checked);
                                  if (e.target.checked && myArtists[0]) {
                                    handleUpdateHeroField('bioFont', myArtists[0].profileFont || 'outfit');
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              Use same font for all
                            </label>
                          </div>
                          <p style={{ color: 'var(--dash-subtext)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select fonts that suit your artist brand</p>

                          <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--dash-text)' }}>Heading Font (Username & Titles)</h3>
                            <div className="dash-design-grid dash-fonts-grid">
                              {AVAILABLE_FONTS.map(f => (
                                <button
                                  key={`head-${f.id}`}
                                  onClick={() => {
                                    if (syncFonts) {
                                      handleUpdateHeroField('profileFont', f.id, { bioFont: f.id });
                                    } else {
                                      handleUpdateHeroField('profileFont', f.id);
                                    }
                                  }}
                                  className={`dash-design-card ${myArtists[0].profileFont === f.id ? 'active' : ''}`}
                                  style={{ border: '2px solid ' + (myArtists[0].profileFont === f.id ? 'var(--dash-accent)' : 'var(--dash-border)') }}
                                >
                                  <p style={{
                                    fontSize: '1.5rem', margin: '0 0 0.75rem 0', color: 'var(--dash-text)',
                                    fontFamily: resolveFontFamily(f.id)
                                  }}>{f.sample}</p>
                                  <h3 className="dash-design-card-label">{f.label}</h3>
                                  <p style={{ fontSize: '0.75rem', color: 'var(--dash-subtext)', margin: 0 }}>{f.desc}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {!syncFonts && (
                            <div>
                              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--dash-text)' }}>Body Font (Bio & Descriptions)</h3>
                              <div className="dash-design-grid dash-fonts-grid">
                                {AVAILABLE_FONTS.map(f => (
                                  <button
                                    key={`body-${f.id}`}
                                    onClick={() => handleUpdateHeroField('bioFont', f.id)}
                                    className={`dash-design-card ${myArtists[0].bioFont === f.id ? 'active' : ''}`}
                                    style={{ border: '2px solid ' + (myArtists[0].bioFont === f.id ? 'var(--dash-accent)' : 'var(--dash-border)') }}
                                  >
                                    <p style={{
                                      fontSize: '1.5rem', margin: '0 0 0.75rem 0', color: 'var(--dash-text)',
                                      fontFamily: resolveFontFamily(f.id)
                                    }}>{f.sample}</p>
                                    <h3 className="dash-design-card-label">{f.label}</h3>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--dash-subtext)', margin: 0 }}>{f.desc}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </section>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden' }}>
                <div className="dash-single-profile" style={{ padding: '2.5rem', overflowY: 'auto' }}>
                  {/* Desktop sub‑toggle: Theme / Font */}
                  <div className="dash-design-subnav">
                    <button
                      type="button"
                      className={`dash-design-subnav-btn ${(!designSubTab || designSubTab === 'theme') ? 'active' : ''}`}
                      onClick={() => setDesignSubTab('theme')}
                    >
                      <span className="dash-design-subnav-icon">🎨</span>
                      <span>Theme</span>
                    </button>
                    <button
                      type="button"
                      className={`dash-design-subnav-btn ${designSubTab === 'font' ? 'active' : ''}`}
                      onClick={() => setDesignSubTab('font')}
                    >
                      <span className="dash-design-subnav-icon">Aa</span>
                      <span>Font</span>
                    </button>
                  </div>

                  {(!designSubTab || designSubTab === 'theme') && (
                    <section className="dash-design-section" style={{ marginBottom: '3rem' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--dash-text)' }}>Profile Theme</h2>
                      <p style={{ color: 'var(--dash-subtext)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Choose a professional look for your public page</p>
                      <div className="dash-design-grid dash-themes-grid">
                        {GENERAL_THEMES.map(t => (
                          <button
                            key={t.id}
                            onClick={() => handleUpdateHeroField('profileTheme', t.id)}
                            className={`dash-design-card ${myArtists[0].profileTheme === t.id ? 'active' : ''}`}
                            style={{
                              border: '2px solid ' + (myArtists[0].profileTheme === t.id ? 'var(--dash-accent)' : 'var(--dash-border)'),
                              boxShadow: myArtists[0].profileTheme === t.id ? '0 10px 25px rgba(0,0,0,0.1)' : 'none'
                            }}
                          >
                            <div className={`dash-theme-indicator ${t.isAnimated ? t.className : ''}`} style={{ background: t.isAnimated ? undefined : t.bg }} />
                            <h3 className="dash-design-card-label">{t.label}</h3>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {designSubTab === 'font' && (
                    <section className="dash-design-section">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--dash-text)' }}>Typography</h2>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--dash-subtext)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={syncFonts}
                            onChange={e => {
                              setSyncFonts(e.target.checked);
                              if (e.target.checked && myArtists[0]) {
                                handleUpdateHeroField('bioFont', myArtists[0].profileFont || 'outfit');
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          Use same font for all
                        </label>
                      </div>
                      <p style={{ color: 'var(--dash-subtext)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select fonts that suit your artist brand</p>

                      <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--dash-text)' }}>Heading Font (Username & Titles)</h3>
                        <div className="dash-design-grid dash-fonts-grid">
                          {AVAILABLE_FONTS.map(f => (
                            <button
                              key={`head-${f.id}`}
                              onClick={() => {
                                if (syncFonts) {
                                  handleUpdateHeroField('profileFont', f.id, { bioFont: f.id });
                                } else {
                                  handleUpdateHeroField('profileFont', f.id);
                                }
                              }}
                              className={`dash-design-card ${myArtists[0].profileFont === f.id ? 'active' : ''}`}
                              style={{ border: '2px solid ' + (myArtists[0].profileFont === f.id ? 'var(--dash-accent)' : 'var(--dash-border)') }}
                            >
                              <p style={{
                                fontSize: '1.5rem', margin: '0 0 0.75rem 0', color: 'var(--dash-text)',
                                fontFamily: resolveFontFamily(f.id)
                              }}>{f.sample}</p>
                              <h3 className="dash-design-card-label">{f.label}</h3>
                              <p style={{ fontSize: '0.75rem', color: 'var(--dash-subtext)', margin: 0 }}>{f.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {!syncFonts && (
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--dash-text)' }}>Body Font (Bio & Descriptions)</h3>
                          <div className="dash-design-grid dash-fonts-grid">
                            {AVAILABLE_FONTS.map(f => (
                              <button
                                key={`body-${f.id}`}
                                onClick={() => handleUpdateHeroField('bioFont', f.id)}
                                className={`dash-design-card ${myArtists[0].bioFont === f.id ? 'active' : ''}`}
                                style={{ border: '2px solid ' + (myArtists[0].bioFont === f.id ? 'var(--dash-accent)' : 'var(--dash-border)') }}
                              >
                                <p style={{
                                  fontSize: '1.5rem', margin: '0 0 0.75rem 0', color: 'var(--dash-text)',
                                  fontFamily: resolveFontFamily(f.id)
                                }}>{f.sample}</p>
                                <h3 className="dash-design-card-label">{f.label}</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--dash-subtext)', margin: 0 }}>{f.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  )}
                </div>

                {/* Preview on the right (desktop / laptop only) */}
                <div className="dash-preview-panel">
                  <div className="dash-full-preview-container">
                    <iframe
                      key={previewKey}
                      title="Profile Design Preview"
                      src={`${process.env.REACT_APP_NFC_FRONTEND_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? `http://${window.location.hostname}:5173` : window.location.origin)}/artist?id=${myArtists[0].artistId}`}
                      className="dash-preview-iframe"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            )
          )}

          {
            activeTab === 'link-art' && myArtists[0] && (() => {
              const ART_THEMES = [
                { id: 'painting', label: 'Painting', icon: '🖼️', color: '#e67e22' },
                { id: 'digital', label: 'Digital Art', icon: '💻', color: '#3498db' },
                { id: 'sculpture', label: 'Sculpture', icon: '🗿', color: '#95a5a6' },
                { id: 'photography', label: 'Photography', icon: '📷', color: '#2c3e50' },
                { id: 'illustration', label: 'Illustration', icon: '✏️', color: '#9b59b6' },
                { id: 'abstract', label: 'Abstract', icon: '🌀', color: '#e74c3c' },
                { id: 'portrait', label: 'Portrait', icon: '👤', color: '#1abc9c' },
                { id: 'landscape', label: 'Landscape', icon: '🏞️', color: '#27ae60' },
                { id: 'miniature', label: 'Miniature', icon: '🔬', color: '#f39c12' },
                { id: 'street', label: 'Street Art', icon: '🏙️', color: '#e91e63' },
                { id: 'mixed', label: 'Mixed Media', icon: '🎭', color: '#673ab7' },
                { id: 'other', label: 'Other', icon: '🎨', color: '#607d8b' },
              ];
              const artShowcase = myArtists[0].artLinks || [];
              const items = Array.isArray(artShowcase) ? artShowcase : [];
              const artistToken = myArtists[0].artistId || myArtists[0]._id;
              const nfcBaseUrl = process.env.REACT_APP_NFC_FRONTEND_URL ||
                (['localhost', '127.0.0.1'].includes(window.location.hostname) ? `http://${window.location.hostname}:5173` : window.location.origin);
              const getArtUrl = (artId) => `${nfcBaseUrl}/artist?id=${artistToken}&art=${artId}`;
              const getQrUrl = (artUrl) => `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(artUrl)}&bgcolor=ffffff&color=1a1a2e&qzone=2`;

              const handleArtImagePick = (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                files.forEach(file => {
                  const reader = new FileReader();
                  reader.onload = (ev) => setArtImagePreview(prev => [...prev, { file, url: ev.target.result }]);
                  reader.readAsDataURL(file);
                });
                // reset input so same files can be re-added if needed
                e.target.value = '';
              };

              const handleAddArt = async () => {
                const title = document.getElementById('art-title-input')?.value?.trim();
                const desc = document.getElementById('art-desc-input')?.value?.trim();
                if (!title) return alert('Please enter an art title.');
                setArtSaving(true);
                try {
                  const uploadedUrls = [];
                  for (const img of artImagePreview) {
                    const uploaded = await landingArtistAPI.uploadPhoto(img.file, () => getIdToken());
                    uploadedUrls.push(uploaded.url || uploaded.photo || '');
                  }
                  const artId = Date.now();
                  const newItem = { id: artId, title, description: desc || '', theme: newArtTheme, images: uploadedUrls };
                  await handleUpdateHeroField('artLinks', [...items, newItem]);
                  document.getElementById('art-title-input').value = '';
                  document.getElementById('art-desc-input').value = '';
                  setArtImagePreview([]);
                  setNewArtTheme('painting');
                  // Automatically focus preview on the newly added artwork
                  setArtPreviewId(artId);
                } finally {
                  setArtSaving(false);
                }
              };

              const handleRemoveArt = async (itemId) => {
                await handleUpdateHeroField('artLinks', items.filter(i => i.id !== itemId));
              };

              // Pick first item for preview by default
              const previewArtId = artPreviewId || (items[0]?.id ?? null);
              const nfcFrontend = process.env.REACT_APP_NFC_FRONTEND_URL ||
                (window.location.hostname === 'localhost' ? 'http://localhost:5173' : window.location.origin);
              const artPreviewSrc = previewArtId
                ? `${nfcFrontend}/artist?id=${artistToken}&art=${previewArtId}`
                : `${nfcFrontend}/artist?id=${artistToken}`;

              return (
                <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden' }}>
                  {/* ── LEFT: Form + cards ── */}
                  <div className="dash-single-profile" style={{ padding: '2rem 2.5rem', overflowY: 'auto' }}>

                    {/* ── Add New Art Form ── */}
                    <div className="dash-art-add-card">
                      <h3 className="dash-art-form-title">
                        ✨ Add New Artwork
                      </h3>

                      {/* Multi-image upload */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--dash-subtext)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Artwork Images {artImagePreview.length > 0 && <span style={{ color: 'var(--dash-accent)' }}>({artImagePreview.length} added)</span>}
                        </label>

                        {/* Thumbnail strip if images picked */}
                        {artImagePreview.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                            {artImagePreview.map((img, idx) => (
                              <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', border: '2px solid var(--dash-accent)' }}>
                                <img src={img.url} alt={`art-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button onClick={() => setArtImagePreview(prev => prev.filter((_, i) => i !== idx))}
                                  style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, padding: 0 }}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Upload zone */}
                        <label htmlFor="art-image-file" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', border: '2px dashed var(--dash-accent)', borderRadius: '14px', padding: '1.25rem', cursor: 'pointer', background: 'var(--dash-bg)', transition: 'all 0.2s' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28" style={{ color: 'var(--dash-accent)', opacity: 0.7 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                          <span style={{ fontSize: '0.82rem', color: 'var(--dash-subtext)' }}>{artImagePreview.length > 0 ? '+ Add more images' : 'Click to upload artwork photos'}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--dash-subtext)', opacity: 0.55 }}>Multiple images supported — they'll appear as a slideshow</span>
                          <input id="art-image-file" type="file" accept="image/*" multiple onChange={handleArtImagePick} style={{ display: 'none' }} />
                        </label>
                      </div>

                      {/* Title + Description */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--dash-subtext)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Art Title *</label>
                        <input id="art-title-input" type="text" placeholder="e.g. Ocean Blue – Abstract Series No. 4" style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.9rem', border: '1.5px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--dash-subtext)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brief Description</label>
                        <textarea id="art-desc-input" rows={3} placeholder="Tell viewers what makes this artwork special — materials, inspiration, story behind it..." style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.9rem', border: '1.5px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                      </div>

                      <button
                        onClick={handleAddArt}
                        disabled={artSaving}
                        style={{
                          padding: '0.85rem 2.25rem',
                          borderRadius: '14px',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          background: '#ffffff',
                          color: '#000000',
                          border: '1px solid #ffffff',
                          cursor: artSaving ? 'wait' : 'pointer',
                          opacity: artSaving ? 0.7 : 1,
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {artSaving ? (<><span>Uploading...</span></>) : (<><span>✦</span><span>Add to Showcase</span></>)}
                      </button>
                    </div>

                    {/* ── Art Cards ── */}
                    {items.length > 0 ? (
                      <div>
                        <div className="dash-art-header">
                          <h3 className="dash-art-title">Your Art Showcase ({items.length})</h3>
                          <span className="dash-art-subtitle">Each card has its own NFC/QR URL</span>
                        </div>
                        <div className="dash-art-grid">
                          {items.map(item => {
                            const theme = ART_THEMES.find(t => t.id === item.theme) || ART_THEMES[ART_THEMES.length - 1];
                            const artUrl = getArtUrl(item.id);
                            const qrUrl = getQrUrl(artUrl);
                            const coverImage = item.image || (Array.isArray(item.images) ? item.images[0] : '');
                            return (
                              <div key={item.id} className="dash-art-card">
                                {/* Artwork image */}
                                {coverImage ? (
                                  <div style={{ width: '100%', height: '180px', overflow: 'hidden' }}>
                                    <img src={coverImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                ) : (
                                  <div className="dash-art-placeholder" style={{ background: `linear-gradient(90deg, ${theme.color}, ${theme.color}88)` }} />
                                )}

                                <div style={{ padding: '1.25rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                                    <h4 style={{ margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: 700, color: 'var(--dash-text)', lineHeight: 1.3 }}>{item.title}</h4>
                                    <button onClick={() => handleRemoveArt(item.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>Remove</button>
                                  </div>
                                  {item.description && <p style={{ fontSize: '0.82rem', color: 'var(--dash-subtext)', lineHeight: 1.55, margin: '0 0 1rem' }}>{item.description}</p>}

                                  {/* QR + URL Section */}
                                  <div className="dash-art-qr-section">
                                    <div style={{ flexShrink: 0 }}>
                                      <img src={qrUrl} alt="QR Code" width={80} height={80} style={{ borderRadius: '8px', display: 'block' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div className="dash-art-qr-actions">
                                        <button
                                          onClick={() => { navigator.clipboard.writeText(artUrl); }}
                                          className="dash-art-btn-copy"
                                        >
                                          Copy URL
                                        </button>
                                        <a
                                          href={qrUrl}
                                          download={`qr-${item.title}.png`}
                                          className="dash-art-btn-secondary"
                                        >
                                          ⬇ QR
                                        </a>
                                        <a
                                          href={artUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="dash-art-btn-secondary"
                                        >
                                          ↗ Preview
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--dash-subtext)', border: '2px dashed var(--dash-border)', borderRadius: '20px' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎨</div>
                        <h3 style={{ fontWeight: 700, color: 'var(--dash-text)', marginBottom: '0.5rem' }}>No artworks added yet</h3>
                        <p style={{ fontSize: '0.9rem' }}>Upload your first artwork above — you'll get a unique URL + QR code to place on the physical art!</p>
                      </div>
                    )}
                  </div>

                  {/* ── RIGHT: Phone Preview (desktop / laptop only) ── */}
                  {!isMobileViewport && (
                    <div className="dash-preview-panel">
                      <div className="dash-full-preview-container">
                        {items.length > 0 ? (
                          <iframe
                            key={artPreviewSrc}
                            title="Art Preview"
                            src={artPreviewSrc}
                            className="dash-preview-iframe"
                            sandbox="allow-scripts allow-same-origin"
                          />
                        ) : (
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--dash-subtext)', gap: '0.75rem', padding: '2rem' }}>
                            <span style={{ fontSize: '3rem' }}>📱</span>
                            <p style={{ fontSize: '0.82rem', textAlign: 'center', margin: 0 }}>Add an artwork to see the live NFC/QR preview here</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          }

          {
            activeTab === 'profiles' && (
              <>
                {error && <div className="profile-error-msg" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                {artistsLoading ? (
                  <div className="dash-loading">
                    <div className="dash-loading-spinner" />
                    <span>Loading your profile…</span>
                  </div>
                ) : myArtists.length === 0 ? (
                  <div className="dash-empty-state" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64" style={{ opacity: 0.4, marginBottom: '1.5rem' }}>
                      <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                    </svg>
                    <h3 style={{ marginBottom: '0.75rem', fontSize: '1.3rem' }}>Create Your Artist Profile</h3>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--dash-subtext)', maxWidth: '380px', margin: '0 auto 1.5rem' }}>Set up your portfolio, connect social links, and get your unique NFC-ready profile link.</p>
                    <button
                      onClick={async () => {
                        try {
                          setSaving(true);
                          if (user) {
                            await landingArtistAPI.createMyProfile({ name: user.displayName || 'New Artist' }, () => getIdToken(), getFirebaseUser);
                          } else if (otpUser) {
                            await landingArtistAPI.createMyProfileWithOtpToken({ name: 'New Artist' }, otpUser.token);
                          }
                          await loadMyProfiles();
                        } catch (err) {
                          setError(err.message || 'Failed to create profile');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                      style={{ padding: '0.9rem 2.5rem', borderRadius: '14px', fontSize: '1rem', fontWeight: 700, background: '#ffffff', color: '#000000', border: 'none', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.45)' }}
                    >
                      {saving ? 'Creating...' : 'Get Started'}
                    </button>
                  </div>
                ) : (() => {
                  // Only use the first (primary) profile — 1 per email rule
                  const artist = myArtists[0];
                  return (
                    <div className="dash-profile-layout">

                      {/* ── LEFT: Profile Info ── */}
                      <div className="dash-single-profile">
                        {/* Profile Hero */}
                        <div className="dash-profile-hero">
                          {artist.backgroundPhoto && (
                            <img src={artist.backgroundPhoto} alt="" className="dash-profile-hero-bg" />
                          )}
                          <div className="dash-profile-hero-overlay" />

                          {/* Background Change Trigger */}
                          <label className="dash-hero-bg-trigger">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleUploadField('backgroundPhoto', e.target.files[0])}
                              style={{ display: 'none' }}
                            />
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                            <span>{isUploading === 'backgroundPhoto' ? 'Uploading...' : 'Change Cover'}</span>
                          </label>

                          <div className="dash-profile-hero-content">
                            <div className="dash-profile-hero-avatar">
                              <label className="dash-avatar-trigger">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && handleUploadField('photo', e.target.files[0])}
                                  style={{ display: 'none' }}
                                />
                                {artist.photo
                                  ? <img src={artist.photo} alt={artist.name} />
                                  : <span>{artist.name?.charAt(0) || '?'}</span>
                                }
                                <div className="dash-avatar-overlay">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                  </svg>
                                </div>
                                {isUploading === 'photo' && <div className="dash-avatar-uploading-spinner" />}
                              </label>
                            </div>
                            <div className="dash-profile-hero-info">
                              <div className="dash-hero-editable-wrapper">
                                {editingHeroField === 'name' ? (
                                  <div className="dash-hero-edit-row">
                                    <input
                                      className="dash-hero-inline-input name"
                                      autoFocus
                                      value={heroUpdates.name !== undefined ? heroUpdates.name : (artist.name || '')}
                                      onChange={(e) => setHeroUpdates(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                    <button onClick={() => handleUpdateHeroField('name', heroUpdates.name)}>Save</button>
                                    <button className="cancel" onClick={() => setEditingHeroField(null)}>✕</button>
                                  </div>
                                ) : (
                                  <h2
                                    className="dash-profile-hero-name clickable"
                                    onClick={() => openHeroEditor('name', artist)}
                                  >
                                    <span>{artist.name || 'Unnamed Artist'}</span>
                                  </h2>
                                )}
                              </div>

                              <div className="dash-hero-editable-wrapper">
                                {editingHeroField === 'specialization' ? (
                                  <div className="dash-hero-edit-row">
                                    <input
                                      className="dash-hero-inline-input spec"
                                      autoFocus
                                      value={heroUpdates.specialization !== undefined ? heroUpdates.specialization : (artist.specialization || '')}
                                      onChange={(e) => setHeroUpdates(prev => ({ ...prev, specialization: e.target.value }))}
                                    />
                                    <button onClick={() => handleUpdateHeroField('specialization', heroUpdates.specialization)}>Save</button>
                                    <button className="cancel" onClick={() => setEditingHeroField(null)}>✕</button>
                                  </div>
                                ) : (
                                  <p
                                    className="dash-profile-hero-spec clickable"
                                    onClick={() => openHeroEditor('specialization', artist)}
                                  >
                                    <span>{artist.specialization || 'Add specialization'}</span>
                                  </p>
                                )}
                              </div>
                              <span className="dash-profile-hero-id">ID: {artist.artistId}</span>
                            </div>
                          </div>
                        </div>

                        {isMobileViewport && mobileHeroEditField && (
                          <div
                            className="dash-mobile-edit-overlay"
                            onClick={() => setMobileHeroEditField(null)}
                          >
                            <div
                              className="dash-mobile-edit-modal"
                              role="dialog"
                              aria-modal="true"
                              aria-label={mobileHeroEditField === 'name' ? 'Edit name' : 'Edit artist tag'}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="dash-mobile-edit-header">
                                <div className="dash-mobile-edit-title">
                                  {mobileHeroEditField === 'name' ? 'Edit name' : 'Edit artist tag'}
                                </div>
                                <button
                                  type="button"
                                  className="dash-mobile-edit-close"
                                  onClick={() => setMobileHeroEditField(null)}
                                  aria-label="Close"
                                >
                                  ×
                                </button>
                              </div>
                              <div className="dash-mobile-edit-body">
                                <input
                                  className="dash-mobile-edit-input"
                                  autoFocus
                                  value={mobileHeroDraft}
                                  placeholder={mobileHeroEditField === 'name' ? 'Enter your name' : 'Enter your artist tag'}
                                  onChange={(e) => setMobileHeroDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') setMobileHeroEditField(null);
                                    if (e.key === 'Enter') saveMobileHeroField();
                                  }}
                                />
                                <div className="dash-mobile-edit-actions">
                                  <button
                                    type="button"
                                    className="dash-mobile-edit-btn ghost"
                                    onClick={() => setMobileHeroEditField(null)}
                                    disabled={savingLink === mobileHeroEditField}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="dash-mobile-edit-btn primary"
                                    onClick={saveMobileHeroField}
                                    disabled={savingLink === mobileHeroEditField}
                                  >
                                    {savingLink === mobileHeroEditField ? 'Saving…' : 'Save'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bio Section */}
                        <div className="dash-profile-bio-section">
                          <h3 className="dash-section-label">About</h3>
                          <div className="dash-hero-editable-wrapper">
                            {editingHeroField === 'bio' ? (
                              <div className="dash-hero-edit-row bio">
                                <textarea
                                  className="dash-hero-inline-textarea"
                                  autoFocus
                                  rows={3}
                                  value={heroUpdates.bio !== undefined ? heroUpdates.bio : (artist.bio || '')}
                                  onChange={(e) => setHeroUpdates(prev => ({ ...prev, bio: e.target.value }))}
                                />
                                <div className="dash-bio-actions">
                                  <button onClick={() => handleUpdateHeroField('bio', heroUpdates.bio)}>Save Biography</button>
                                  <button className="cancel" onClick={() => setEditingHeroField(null)}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <p
                                className="dash-profile-bio clickable"
                                onClick={() => setEditingHeroField('bio')}
                              >
                                <span>{artist.bio || 'Add a bio describing your art...'}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Links Section Header */}
                        <div className="dash-section-header">
                          <h3 className="dash-section-label">Links</h3>
                          <button
                            type="button"
                            className="dash-add-platform-btn"
                            onClick={() => {
                              setTempPlatforms([...visiblePlatforms]);
                              setIsSelectorOpen(true);
                            }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Platforms
                          </button>
                        </div>

                        {/* Link Cards Section */}
                        <div className="dash-links-section">
                          {ALL_PLATFORMS.filter(p => visiblePlatforms.includes(p.id)).map(platform => {
                            let serverValue = artist[platform.id] || '';
                            // Simplify WhatsApp for display
                            if (platform.id === 'whatsapp' && serverValue.includes('wa.me/')) {
                              serverValue = serverValue.split('wa.me/')[1];
                            }

                            const localValue = pendingLinks[platform.id];
                            const currentValue = localValue !== undefined ? localValue : serverValue;
                            const isModified = localValue !== undefined && localValue !== serverValue;

                            return (
                              <div className="dash-link-card" key={platform.id}>
                                <div className="dash-link-card-main">
                                  <div className="dash-link-icon-circle">
                                    {getLinkIcon({ platform: platform.id })}
                                  </div>
                                  <div className="dash-link-content">
                                    <div className="dash-link-title-row">
                                      <span className="dash-link-title">{platform.label}</span>
                                    </div>
                                    <div className="dash-link-url">
                                      <input
                                        className="dash-link-inline-input"
                                        placeholder={
                                          platform.id === 'instagram' ? '@handle' :
                                            platform.id === 'whatsapp' ? 'Phone number (e.g. 91834...)' :
                                              'Enter URL / handle'
                                        }
                                        value={currentValue}
                                        onChange={(e) => {
                                          const newVal = e.target.value;
                                          setPendingLinks(prev => ({ ...prev, [platform.id]: newVal }));
                                        }}
                                      />
                                      {savingLink === platform.id && <span className="dash-link-saving">Saving…</span>}
                                    </div>
                                  </div>
                                  <div className="dash-link-controls">
                                    <button
                                      className="dash-link-remove-icon-btn"
                                      onClick={() => handleUpdateLink(platform.id, null)}
                                      title="Remove this platform"
                                    >
                                      ✕
                                    </button>

                                    <button
                                      className={`dash-link-save-btn ${isModified ? 'active' : ''}`}
                                      disabled={!isModified || savingLink === platform.id}
                                      onClick={() => handleUpdateLink(platform.id, currentValue)}
                                    >
                                      {savingLink === platform.id ? '...' : 'Save'}
                                    </button>

                                    <label className="dash-link-toggle">
                                      <input type="checkbox" defaultChecked />
                                      <span className="dash-link-toggle-slider"></span>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Get in Touch Section */}
                        <div className="dash-profile-bio-section">
                          <h3 className="dash-section-label">Get in Touch</h3>
                          <div className="dash-contact-grid">
                            <div className="dash-contact-item">
                              <div className="dash-contact-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                              </div>
                              <div className="dash-contact-content">
                                <span className="dash-contact-label">Email</span>
                                {editingHeroField === 'email' ? (
                                  <div className="dash-hero-edit-row">
                                    <input
                                      className="dash-hero-inline-input"
                                      value={heroUpdates.email !== undefined ? heroUpdates.email : (artist.email || '')}
                                      onChange={(e) => setHeroUpdates(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                    <button onClick={() => handleUpdateHeroField('email', heroUpdates.email)}>Save</button>
                                    <button className="cancel" onClick={() => setEditingHeroField(null)}>✕</button>
                                  </div>
                                ) : (
                                  <p className="dash-contact-value clickable" onClick={() => setEditingHeroField('email')}>{artist.email || 'Add email'}</p>
                                )}
                              </div>
                            </div>

                            <div className="dash-contact-item">
                              <div className="dash-contact-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                              </div>
                              <div className="dash-contact-content">
                                <span className="dash-contact-label">Phone</span>
                                {editingHeroField === 'phone' ? (
                                  <div className="dash-hero-edit-row">
                                    <input
                                      className="dash-hero-inline-input"
                                      value={heroUpdates.phone !== undefined ? heroUpdates.phone : (artist.phone || '')}
                                      onChange={(e) => setHeroUpdates(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                    <button onClick={() => handleUpdateHeroField('phone', heroUpdates.phone)}>Save</button>
                                    <button className="cancel" onClick={() => setEditingHeroField(null)}>✕</button>
                                  </div>
                                ) : (
                                  <p className="dash-contact-value clickable" onClick={() => setEditingHeroField('phone')}>{artist.phone || 'Add phone'}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Show My Art Button */}
                        <div className="dash-profile-bio-section">
                          <button
                            className="show-my-art-btn"
                            onClick={() => {
                              if ((artist.artLinks || []).length > 0) {
                                setShowArtGallery(true);
                              } else {
                                setActiveTab('link-art');
                              }
                            }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <span>{(artist.artLinks || []).length > 0 ? 'Show My Art' : 'Add Your Art'}</span>
                            {(artist.artLinks || []).length > 0 && (
                              <span className="show-my-art-count">{(artist.artLinks || []).length}</span>
                            )}
                          </button>
                        </div>

                        {/* Events / Gallery Section */}
                        <div className="dash-profile-bio-section">
                          <div className="dash-section-header">
                            <h3 className="dash-section-label">Events</h3>
                            <label className="dash-add-platform-btn">
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => e.target.files?.[0] && handleAddGalleryItem(e.target.files[0])}
                              />
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              {galleryUploading ? 'Uploading...' : 'Add Event Image'}
                            </label>
                          </div>

                          <div className="dash-gallery-grid">
                            {(artist.gallery || []).map((item, idx) => (
                              <div className="dash-gallery-item" key={idx}>
                                <img src={item.url} alt={item.name} />
                                <div className="dash-gallery-item-overlay">
                                  <input
                                    className="dash-gallery-item-name-input"
                                    value={item.name}
                                    placeholder="Event title"
                                    onChange={(e) => {
                                      const newGal = [...artist.gallery];
                                      newGal[idx].name = e.target.value;
                                      setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, gallery: newGal } : a));
                                    }}
                                    onBlur={() => {
                                      const payload = { gallery: artist.gallery };
                                      landingArtistAPI.updateMyProfile(artist.artistId || artist._id, payload, () => getIdToken(), getFirebaseUser);
                                    }}
                                  />
                                  <button
                                    className="dash-gallery-remove-btn"
                                    onClick={() => handleRemoveGalleryItem(idx)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                            {(!artist.gallery || artist.gallery.length === 0) && (
                              <div className="dash-gallery-empty">
                                <p>No events added yet. Start by adding images from your recent exhibitions or workshops.</p>
                              </div>
                            )}
                          </div>
                        </div>


                        {myArtists.length > 1 && (
                          <p className="dash-multi-profile-note">
                            ⚠️ Your account has {myArtists.length} profiles linked. Only one profile per email is allowed. Please contact support to resolve this.
                          </p>
                        )}
                      </div>

                      {/* ── RIGHT: Live iframe Preview (desktop / laptop only) ── */}
                      {!isMobileViewport && (
                        <div className="dash-preview-panel">
                          <div className="dash-full-preview-container">
                            <iframe
                              key={previewKey}
                              title="Profile Preview"
                              src={`${process.env.REACT_APP_NFC_FRONTEND_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? `http://${window.location.hostname}:5173` : window.location.origin)}/artist?id=${artist.artistId}`}
                              className="dash-preview-iframe"
                              sandbox="allow-scripts allow-same-origin"
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })()}
              </>
            )
          }
        </div >
      </main >


      {editingArtist && (
        <div className="profile-edit-overlay" onClick={closeEdit}>
          <div className="profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-edit-header">
              <h3>Edit artist: {editingArtist.artistId}</h3>
              <button type="button" className="profile-edit-close" onClick={closeEdit} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSave} className="profile-edit-form">
              <div className="profile-edit-body">
                <section className="profile-edit-section">
                  <h4 className="profile-edit-section-title">Basic info</h4>
                  <div className="profile-edit-field">
                    <label>Name</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} required placeholder="Artist name" />
                  </div>
                  <div className="profile-edit-field">
                    <label>Specialization</label>
                    <input name="specialization" value={formData.specialization} onChange={handleInputChange} placeholder="e.g. Visual Artist" />
                  </div>
                  <div className="profile-edit-field">
                    <label>Bio</label>
                    <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={3} placeholder="Short bio" />
                  </div>
                  <div className="profile-edit-field">
                    <label>Profile theme</label>
                    <div className="theme-choices-row">
                      {GENERAL_THEMES.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          className={`theme-pill ${formData.profileTheme === theme.id ? 'selected' : ''}`}
                          onClick={() => setFormData((prev) => ({ ...prev, profileTheme: theme.id }))}
                          style={formData.profileTheme === theme.id ? { background: theme.bg, color: theme.text } : {}}
                        >
                          <span className="theme-pill-label">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="profile-edit-field">
                    <label>Profile font</label>
                    <div className="theme-choices-row">
                      {[
                        { id: 'outfit', label: 'Outfit' },
                        { id: 'playfair', label: 'Playfair Display' },
                        { id: 'caveat', label: 'Caveat' },
                        { id: 'mono-font', label: 'Roboto Mono' }
                      ].map((fnt) => (
                        <button
                          key={fnt.id}
                          type="button"
                          className={`theme-pill ${formData.profileFont === fnt.id ? 'selected' : ''}`}
                          onClick={() => setFormData((prev) => ({ ...prev, profileFont: fnt.id }))}
                        >
                          <style>{`
                            .font-preview-${fnt.id} { font-family: ${fnt.id === 'playfair' ? "'Playfair Display', serif" :
                              fnt.id === 'caveat' ? "'Caveat', cursive" :
                                fnt.id === 'mono-font' ? "'Roboto Mono', monospace" :
                                  "'Outfit', sans-serif"
                            }; }
                          `}</style>
                          <span className={`theme-pill-label font-preview-${fnt.id}`}>{fnt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="profile-edit-section">
                  <h4 className="profile-edit-section-title">Photos</h4>
                  <div className="profile-edit-field profile-edit-photo-field">
                    <label>Profile photo</label>
                    <div className="profile-edit-photo-box">
                      {(formData.photo && !photoFile) && (
                        <div className="profile-edit-photo-current">
                          <img src={formData.photo} alt="" className="profile-edit-photo-preview" />
                          <span className="profile-edit-photo-caption">Current</span>
                        </div>
                      )}
                      <label className="profile-edit-file-btn">
                        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setPhotoFile(e.target.files[0])} />
                        {photoFile ? 'New image chosen' : 'Choose photo'}
                      </label>
                    </div>
                  </div>
                  <div className="profile-edit-field profile-edit-photo-field">
                    <label>Background photo</label>
                    <div className="profile-edit-photo-box">
                      {(formData.backgroundPhoto && !bgFile) && (
                        <div className="profile-edit-photo-current">
                          <img src={formData.backgroundPhoto} alt="" className="profile-edit-photo-preview profile-edit-bg-preview" />
                          <span className="profile-edit-photo-caption">Current</span>
                        </div>
                      )}
                      <label className="profile-edit-file-btn">
                        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setBgFile(e.target.files[0])} />
                        {bgFile ? 'New image chosen' : 'Choose photo'}
                      </label>
                    </div>
                  </div>
                </section>

                <section className="profile-edit-section">
                  <h4 className="profile-edit-section-title">Contact</h4>
                  <div className="profile-edit-field">
                    <label>Email</label>
                    <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="email@example.com" />
                  </div>
                  <div className="profile-edit-field">
                    <label>Phone</label>
                    <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="+1 234 567 8900" />
                  </div>
                  <div className="profile-edit-field">
                    <label>Website</label>
                    <input name="website" type="url" value={formData.website} onChange={handleInputChange} placeholder="https://" />
                  </div>
                  <div className="profile-edit-field">
                    <label>WhatsApp</label>
                    <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="With country code" />
                  </div>
                </section>

                <section className="profile-edit-section">
                  <h4 className="profile-edit-section-title">Social links</h4>
                  <div className="profile-edit-field">
                    <label>Instagram</label>
                    <input name="instagram" value={formData.instagram} onChange={handleInputChange} placeholder="@handle" />
                  </div>
                  <div className="profile-edit-field">
                    <label>Facebook</label>
                    <input name="facebook" value={formData.facebook} onChange={handleInputChange} />
                  </div>
                  <div className="profile-edit-field">
                    <label>Twitter</label>
                    <input name="twitter" value={formData.twitter} onChange={handleInputChange} placeholder="@handle" />
                  </div>
                  <div className="profile-edit-field">
                    <label>LinkedIn</label>
                    <input name="linkedin" value={formData.linkedin} onChange={handleInputChange} />
                  </div>
                </section>

                <section className="profile-edit-section">
                  <h4 className="profile-edit-section-title">Details</h4>
                  <div className="profile-edit-field">
                    <label>Artwork count</label>
                    <input name="artworkCount" type="number" min={0} value={formData.artworkCount} onChange={handleInputChange} placeholder="0" />
                  </div>
                  <div className="profile-edit-field">
                    <label>Instagram name</label>
                    <input name="instagramName" value={formData.instagramName} onChange={handleInputChange} />
                  </div>
                  <div className="profile-edit-field">
                    <label>Instagram category</label>
                    <input name="instagramCategory" value={formData.instagramCategory} onChange={handleInputChange} />
                  </div>
                  <div className="profile-edit-field profile-edit-field-row">
                    <div className="profile-edit-field">
                      <label>Instagram posts</label>
                      <input name="instagramPosts" value={formData.instagramPosts} onChange={handleInputChange} />
                    </div>
                    <div className="profile-edit-field">
                      <label>Followers</label>
                      <input name="instagramFollowers" value={formData.instagramFollowers} onChange={handleInputChange} />
                    </div>
                    <div className="profile-edit-field">
                      <label>Following</label>
                      <input name="instagramFollowing" value={formData.instagramFollowing} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="profile-edit-field">
                    <label>Instagram bio</label>
                    <textarea name="instagramAccountBio" value={formData.instagramAccountBio} onChange={handleInputChange} rows={2} placeholder="Account bio" />
                  </div>
                </section>

                <section className="profile-edit-section">
                  <h4 className="profile-edit-section-title">Slideshow / Gallery</h4>
                  <div className="profile-edit-gallery-wrap">
                    {formData.gallery.length > 0 && (
                      <ul className="profile-edit-gallery-list">
                        {formData.gallery.map((item, idx) => (
                          <li key={idx} className="profile-edit-gallery-item">
                            <img src={item.url} alt="" className="profile-edit-gallery-thumb" />
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => setGalleryItemName(idx, e.target.value)}
                              placeholder="Title"
                              className="profile-edit-gallery-name"
                            />
                            <button type="button" onClick={() => removeGalleryItem(idx)} className="profile-edit-gallery-remove" aria-label="Remove">×</button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="profile-edit-gallery-add">
                      <input
                        type="text"
                        value={newGalleryName}
                        onChange={(e) => setNewGalleryName(e.target.value)}
                        placeholder="Slide title (optional)"
                        className="profile-edit-gallery-name-in"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && setNewGalleryFile(e.target.files[0])}
                      />
                      <button type="button" onClick={addGalleryItem} disabled={!newGalleryFile || galleryUploading} className="profile-edit-gallery-add-btn">
                        {galleryUploading ? 'Uploading…' : 'Add to slideshow'}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
              <div className="profile-edit-footer">
                <button type="button" onClick={closeEdit}>Cancel</button>
                <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Art Gallery Popup */}
      {showArtGallery && myArtists[0] && (() => {
        const artItems = myArtists[0].artLinks || [];
        const selected = artGallerySelectedItem;
        return (
          <div className="art-gallery-overlay" onClick={() => { setShowArtGallery(false); setArtGallerySelectedItem(null); }}>
            <div className="art-gallery-modal" onClick={e => e.stopPropagation()}>
              <div className="art-gallery-header">
                <h2>My Art Collection</h2>
                <span className="art-gallery-count">{artItems.length} pieces</span>
                <button className="art-gallery-close" onClick={() => { setShowArtGallery(false); setArtGallerySelectedItem(null); }}>✕</button>
              </div>
              <div className="art-gallery-scroll">
                <div className="art-gallery-masonry">
                  {artItems.map((item) => (
                    <div
                      key={item.id}
                      className="art-gallery-card"
                      onClick={() => setArtGallerySelectedItem(item)}
                    >
                      {item.images && item.images[0] ? (
                        <img src={item.images[0]} alt={item.title} className="art-gallery-card-img" loading="lazy" />
                      ) : (
                        <div className="art-gallery-card-placeholder">
                          <span>{item.theme === 'painting' ? '🖼️' : item.theme === 'digital' ? '💻' : item.theme === 'sculpture' ? '🗿' : item.theme === 'photography' ? '📷' : '🎨'}</span>
                        </div>
                      )}
                      <div className="art-gallery-card-info">
                        <h4>{item.title}</h4>
                        {item.description && <p>{item.description}</p>}
                        <span className="art-gallery-card-theme">{item.theme}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selected && (
              <div className="art-lightbox-overlay" onClick={(e) => { e.stopPropagation(); setArtGallerySelectedItem(null); }}>
                <div className="art-lightbox" onClick={e => e.stopPropagation()}>
                  <button className="art-lightbox-close" onClick={() => setArtGallerySelectedItem(null)}>✕</button>
                  <div className="art-lightbox-images">
                    {(selected.images || []).map((img, i) => (
                      <img key={i} src={img} alt={`${selected.title} ${i + 1}`} className="art-lightbox-img" />
                    ))}
                  </div>
                  <div className="art-lightbox-info">
                    <h3>{selected.title}</h3>
                    {selected.description && <p>{selected.description}</p>}
                    <span className="art-lightbox-theme">{selected.theme}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Platform Selector Modal */}
      {
        isSelectorOpen && (
          <div className="dash-selector-overlay">
            <div className="dash-selector-modal">
              <div className="dash-selector-header">
                <h3>Add Platforms</h3>
                <p>Select multiple platforms to add them to your profile</p>
              </div>
              <div className="dash-selector-grid">
                {ALL_PLATFORMS.map((p) => {
                  const isActive = tempPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`dash-selector-item ${isActive ? 'is-active' : ''}`}
                      onClick={() => togglePlatformInSelector(p.id)}
                    >
                      <div className="dash-selector-icon">
                        {getLinkIcon({ platform: p.id })}
                      </div>
                      <span className="dash-selector-label">{p.label}</span>
                      {isActive && <div className="dash-selector-check">✓</div>}
                    </button>
                  );
                })}
              </div>
              <div className="dash-selector-actions">
                <button
                  type="button"
                  className="dash-selector-btn-cancel"
                  onClick={() => setIsSelectorOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="dash-selector-btn-done"
                  onClick={handlePlatformDone}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Mobile-only bottom nav: Profile, Preview, Design — show on all tabs including Design */}
      {isMobileViewport && (
        <div className="dash-mobile-bottom-nav">
          <div className="dash-mobile-bottom-nav-inner">
            <button
              type="button"
              className={`dash-mobile-bottom-btn ${activeTab === 'profiles' ? 'dash-mobile-bottom-btn-active' : ''}`}
              onClick={() => setActiveTab('profiles')}
            >
              <div className="dash-mobile-bottom-btn-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c0-3.2 2.4-5.5 7-5.5s7 2.3 7 5.5" />
                </svg>
              </div>
              <span>Profile</span>
            </button>

            <button
              type="button"
              className={`dash-mobile-bottom-btn ${activeTab === 'preview' ? 'dash-mobile-bottom-btn-active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <div className="dash-mobile-bottom-btn-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
                </svg>
              </div>
              <span>Preview</span>
            </button>

            <button
              type="button"
              className={`dash-mobile-bottom-btn ${activeTab === 'design' ? 'dash-mobile-bottom-btn-active' : ''}`}
              onClick={() => setActiveTab('design')}
            >
              <div className="dash-mobile-bottom-btn-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </div>
              <span>Design</span>
            </button>
          </div>
        </div>
      )}
    </div >
  );
}

export default Profile;

