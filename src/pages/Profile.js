import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
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
import getCroppedImg from '../utils/cropImage';
import ImageCropperModal from '../components/profile/ImageCropperModal';
import ProfileChoiceScreen from '../components/profile/ProfileChoiceScreen';
import ProfileArtistOnboardingWizard from '../components/profile/ProfileArtistOnboardingWizard';
import PhoneINInput from '../components/PhoneINInput';
import {
  getINDisplayDigits,
  toINFullPhone,
  getINDisplayDigitsFromWhatsAppStored,
  toWhatsAppUrlFromINPhone
} from '../utils/indianPhone';
import { assertGalleryFileKind, assertVideoMaxDuration } from '../utils/galleryMedia';

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

const RESTAURANT_STORAGE_KEY = 'restaurant_profile';
const RESTAURANT_ONBOARDING_KEY = 'restaurant_onboarding_step';
const GENERAL_FLOW_MODE_KEY = 'general_flow_mode';
const PROFILE_PREF_BY_EMAIL_KEY = 'profile_pref_by_email_v1';

const ALL_PLATFORMS = [
  { id: 'google_maps', label: 'Google Maps' },
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

/** Link title sent to API / shown on public page — avoids e.g. Google_maps from raw keys. */
function titleForRestaurantLinkPlatform(platformKey) {
  const k = String(platformKey || '');
  const meta = ALL_PLATFORMS.find((p) => p.id === k);
  if (meta) return meta.label;
  return k
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

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

function extractPhoneFromBioString(bioString) {
  if (!bioString) return '';
  const m = bioString.match(/📞\s*([+\d][\d\s()-]{8,})/i) || bioString.match(/([+\d][\d\s()-]{10,})/);
  return m?.[1]?.trim() || '';
}

function extractEmailFromBioString(bioString) {
  if (!bioString) return '';
  const m = bioString.match(/✉\s*([^\s]+)/i) || bioString.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
  return m?.[1]?.trim() || '';
}

function stripPhoneEmailLinesFromBioString(bioString) {
  if (!bioString) return '';
  const lines = bioString.split('\n').map(l => l.trim());
  const cleaned = lines.filter(l => {
    if (!l) return false;
    if (l.startsWith('📞')) return false;
    if (l.startsWith('✉')) return false;
    return true;
  });
  return cleaned.join('\n').trim();
}

function mergeGeneralBioForSave(form) {
  const cleanedBio = stripPhoneEmailLinesFromBioString(form.bio || '');
  const parts = [cleanedBio];
  const p = (form.phone || '').trim();
  const em = (form.email || '').trim();
  if (p) parts.push(`📞 ${p}`);
  if (em) parts.push(`✉ ${em}`);
  return parts.filter(Boolean).join('\n');
}

function buildGeneralFormFromProfileData(data) {
  const rawBio = data.bio || '';
  const cleanedBio = stripPhoneEmailLinesFromBioString(rawBio);
  const phone = extractPhoneFromBioString(rawBio);
  const email = extractEmailFromBioString(rawBio);
  return {
    username: data.username || '',
    name: data.name || '',
    title: data.title || '',
    bio: cleanedBio,
    phone: toINFullPhone(getINDisplayDigits(phone)) || '',
    email: email || '',
    photo: data.photo || '',
    theme: data.theme || 'mint',
    font: data.font || 'outfit',
    links: (data.links && data.links.length) ? data.links.map(parseLinkFromUrl) : [{ title: '', url: '', platform: 'website', order: 0 }],
    gallery: data.gallery || []
  };
}

/** Normalize photo upload JSON (artist/general share the same upload route). */
function extractUploadUrl(up) {
  if (!up || typeof up !== 'object') return '';
  return (
    up.url ||
    up.secure_url ||
    (up.data && (up.data.url || up.data.secure_url)) ||
    ''
  );
}

/** Shown on phone preview and hero while banner/cover is uploading and live iframe has not refreshed yet. */
function LivePreviewSyncOverlay({ show, message = 'Uploading banner…' }) {
  if (!show) return null;
  return (
    <div className="dash-preview-sync-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="dash-preview-sync-overlay__inner">
        <div className="dash-loading-spinner" />
        <span className="dash-preview-sync-overlay__text">{message}</span>
        <span className="dash-preview-sync-overlay__hint">Preview updates when upload finishes</span>
      </div>
    </div>
  );
}

/** Live iframe of `/link/:username` so dashboard preview matches the public restaurant profile. */
function RestaurantPublicPreviewIframe({ username, previewKey, bannerSyncing }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const u = (username || '').trim();
  if (!u) {
    return (
      <div className="dash-full-preview-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--dash-subtext)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
          Save and publish your profile with a username to see the live preview here.
        </p>
      </div>
    );
  }
  return (
    <div className="dash-full-preview-container">
      <iframe
        key={`restaurant-dash-preview-${u}-${previewKey}`}
        title="Live restaurant profile preview"
        src={`${origin}/link/${encodeURIComponent(u)}?v=${previewKey}`}
        className="dash-preview-iframe"
        sandbox="allow-scripts allow-same-origin"
      />
      <LivePreviewSyncOverlay show={!!bannerSyncing} message="Uploading banner…" />
    </div>
  );
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
      if (lock === 'artist' && (!stored || stored === 'choice')) {
        return 'artist';
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
  const [linkCopiedArtist, setLinkCopiedArtist] = useState(false);
  const [linkCopiedGeneral, setLinkCopiedGeneral] = useState(false);
  const [linkCopiedRest, setLinkCopiedRest] = useState(false);
  const [artistsLoading, setArtistsLoading] = useState(false);

  // States for Image Cropper
  const [cropper, setCropper] = useState({
    open: false,
    image: null,
    aspect: 1,
    onComplete: null,
    onCancel: null
  });
  /** True after GET /my-profiles finishes for this account (avoids one dashboard frame before onboarding). */
  const [artistListReady, setArtistListReady] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);

  /** GIFs skip crop; other images open cropper. Resolves with the file to upload. */
  const getFileAfterCropOrPassThrough = useCallback((file, aspect) => {
    if (file.type === 'image/gif') {
      return Promise.resolve(file);
    }
    return new Promise((resolve, reject) => {
      // Use blob URL instead of FileReader data URL — much faster on mobile
      // and avoids the "black cropper" issue caused by huge base64 strings.
      const blobUrl = URL.createObjectURL(file);
      setCropper({
        open: true,
        image: blobUrl,
        aspect,
        onComplete: async (pixelCrop, rotation) => {
            try {
              const croppedDataUrl = await getCroppedImg(blobUrl, pixelCrop, rotation);
              URL.revokeObjectURL(blobUrl);
            const res = await fetch(croppedDataUrl);
            const blob = await res.blob();
            const croppedFile = new File([blob], file.name || 'cropped.jpg', { type: 'image/jpeg' });
            resolve(croppedFile);
          } catch (err) {
            URL.revokeObjectURL(blobUrl);
            console.error('Cropping failed:', err);
            reject(err);
          } finally {
            setCropper((prev) => ({ ...prev, open: false }));
          }
        },
        onCancel: () => {
          URL.revokeObjectURL(blobUrl);
          setCropper((prev) => ({ ...prev, open: false }));
          reject(new Error('CROP_CANCEL'));
        }
      });
    });
  }, []);

  // MIME types that browsers can actually render as images
  const RENDERABLE_IMAGE_TYPES = new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/gif', 'image/svg+xml', 'image/bmp', 'image/tiff',
    'image/avif', 'image/heic', 'image/heif',
  ]);

  // RAW camera formats that look like images but browsers cannot render
  const RAW_EXTENSIONS = /\.(arw|cr2|cr3|nef|nrw|orf|raf|rw2|dng|pef|srw|x3f|3fr|fff|iiq|rwl|mef|mrw|erf)$/i;

  /** Helper to open cropper before actual upload/save logic (single file) */
  const handlePickAndCrop = (e, aspect, onCroppedDone) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    // Check for RAW camera formats — browsers cannot render them
    if (RAW_EXTENSIONS.test(file.name)) {
      setError(
        `Camera RAW files (like .ARW, .CR2, .NEF) cannot be used directly — your browser cannot render them.\n\nPlease export or convert the photo to JPEG or PNG first (use Google Photos, Windows Photos, or any photo editor), then upload it.`
      );
      return;
    }

    // Check MIME type — only allow renderable image types (not PDF, video, etc.)
    if (file.type && !RENDERABLE_IMAGE_TYPES.has(file.type.toLowerCase())) {
      setError(`"${file.name}" is not a supported image format. Please use JPEG, PNG, WebP, or GIF.`);
      return;
    }

    getFileAfterCropOrPassThrough(file, aspect)
      .then(onCroppedDone)
      .catch((err) => {
        if (err?.message !== 'CROP_CANCEL') console.error(err);
      });
  };
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

  // General profile (Linktree-like) state
  const [generalProfile, setGeneralProfile] = useState(null);
  const [generalProfileLoading, setGeneralProfileLoading] = useState(false);
  const generalProfileRef = useRef(null);
  generalProfileRef.current = generalProfile;
  const lastGeneralUidRef = useRef(undefined);
  const [generalStep, setGeneralStep] = useState(() => {
    try {
      const stored = localStorage.getItem('general_step');
      return stored === 'theme' ? 'create' : (stored || 'create');
    } catch (e) {
      return 'create';
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
    } catch (e) {
      return 1;
    }
  });
  const updateGeneralOnboardingStep = (step) => {
    setGeneralOnboardingStep(step);
    localStorage.setItem('general_onboarding_step', step.toString());
  };

  // Store which profile type user chose for a specific email.
  const setPrefByEmail = (email, pref) => {
    if (!email || !pref) return;
    try {
      const raw = localStorage.getItem(PROFILE_PREF_BY_EMAIL_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[email] = pref;
      localStorage.setItem(PROFILE_PREF_BY_EMAIL_KEY, JSON.stringify(parsed));
    } catch (e) { }
  };
  const [generalForm, setGeneralForm] = useState({
    username: '',
    name: '',
    title: '',
    bio: '',
    phone: '',
    email: '',
    photo: '',
    theme: 'mint',
    font: 'outfit',
    links: [{ title: '', url: '', platform: 'website', order: 0 }]
  });
  const [generalPhotoFile, setGeneralPhotoFile] = useState(null);
  const [generalPhotoPreviewUrl, setGeneralPhotoPreviewUrl] = useState(null);
  useEffect(() => {
    if (!generalPhotoFile) { setGeneralPhotoPreviewUrl(null); return; }
    const u = URL.createObjectURL(generalPhotoFile);
    setGeneralPhotoPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [generalPhotoFile]);
  const [generalSaving, setGeneralSaving] = useState(false);
  const [restaurantSaving, setRestaurantSaving] = useState(false);
  const [generalSuccess, setGeneralSuccess] = useState('');
  const [generalActiveTab, setGeneralActiveTab] = useState('profile');
  const [usernameCheck, setUsernameCheck] = useState({ status: 'idle', msg: '' }); // idle | checking | available | taken | invalid
  const usernameCheckTimer = useRef(null);

  // Refs for General profile onboarding inputs
  const genPhotoInputRef = useRef(null);

  // Refs for Restaurant profile onboarding inputs
  const restaurantBannerInputRef = useRef(null);
  const restaurantGalleryInputRef = useRef(null);
  const restaurantMenuInputRef = useRef(null);

  // Refs for Artist dashboard inputs
  const artistGalleryInputRef = useRef(null);
  const artistProfilePhotoInputRef = useRef(null);
  const artistBannerPhotoInputRef = useRef(null);
  const artistGalleryAddInputRef = useRef(null);

  // Refs for General profile dashboards
  const genDashPhotoInputRef = useRef(null);
  const genDashChangePhotoInputRef = useRef(null);

  const restaurantSyncTimerRef = useRef(null);
  const lastRestaurantSyncSigRef = useRef('');
  const loadGeneralProfileRef = useRef(() => Promise.resolve());

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
  const [rHeroEditingField, setRHeroEditingField] = useState(null); // 'name' | 'tagline'
  const [rHeroDraftName, setRHeroDraftName] = useState('');
  const [rHeroDraftTagline, setRHeroDraftTagline] = useState('');
  const [rLinkSelectorOpen, setRLinkSelectorOpen] = useState(false);
  const [rTempPlatforms, setRTempPlatforms] = useState([]);
  const [rSyncFonts, setRSyncFonts] = useState(true);
  const [restaurantProfile, setRestaurantProfile] = useState(() => {
    try {
      const raw = localStorage.getItem(RESTAURANT_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Older saved payloads may have embedded phone/email inside `bio`.
      // Clean it so About/Bio only shows the description.
      const bioRaw = parsed?.bio || '';
      const bio = stripPhoneEmailLinesFromBioString(bioRaw);
      const phone = parsed?.phone || extractPhoneFromBioString(bioRaw) || '';
      const email = parsed?.email || extractEmailFromBioString(bioRaw) || '';
      return { ...parsed, bio, phone, email };
    } catch (e) { return null; }
  });
  // Prevent auto-hydrating restaurantProfile while user is in the edit/onboarding flow.
  // Using a ref avoids any "state update ordering" issues between setRestaurantProfile(null)
  // and updateRestaurantOnboardingStep(1).
  const restaurantEditInProgressRef = useRef(false);
  const [restaurantGalleryUploading, setRestaurantGalleryUploading] = useState(false);
  const [restaurantBannerUploading, setRestaurantBannerUploading] = useState(false);

  // Strip large base64 blobs before persisting — keep last known https banner so refresh does not lose it
  const persistRestaurant = (profile) => {
    try {
      const MAX_DATA_URL_LENGTH = 1200000; // ~1.2MB string; cropped 16:9 JPEGs often exceed 500k
      const keepDataImage = (v) => typeof v === 'string' && v.startsWith('data:image/') && v.length <= MAX_DATA_URL_LENGTH;
      let previousHttpBanner = '';
      try {
        const rawPrev = localStorage.getItem(RESTAURANT_STORAGE_KEY);
        if (rawPrev) {
          const p = JSON.parse(rawPrev);
          if (p?.banner && String(p.banner).startsWith('http')) previousHttpBanner = String(p.banner).trim();
        }
      } catch (e) { /* ignore */ }

      let bannerOut;
      if (profile.banner && String(profile.banner).startsWith('http')) {
        bannerOut = String(profile.banner).trim();
      } else if (keepDataImage(profile.banner)) {
        bannerOut = profile.banner;
      } else {
        bannerOut = previousHttpBanner || undefined;
      }

      const safe = {
        ...profile,
        banner: bannerOut,
        // menuPdf base64 can be very large; only persist when it's already uploaded (http url).
        menuPdf: profile.menuPdf && profile.menuPdf.startsWith('http') ? profile.menuPdf : undefined,
        gallery: (profile.gallery || []).map(g => ({
          ...g,
          url: (g.url && g.url.startsWith('http')) ? g.url : (keepDataImage(g.url) ? g.url : undefined),
        })).filter(g => g.url),
      };
      localStorage.setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(safe));
    } catch (e) {
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

  const startRestaurantHeroEdit = (field) => {
    if (!restaurantProfile) return;
    setRHeroEditingField(field);
    if (field === 'name') setRHeroDraftName(restaurantProfile.name || '');
    if (field === 'tagline') setRHeroDraftTagline(restaurantProfile.tagline || '');
  };

  const cancelRestaurantHeroEdit = () => {
    setRHeroEditingField(null);
  };

  const saveRestaurantHeroEdit = () => {
    if (!restaurantProfile || !rHeroEditingField) return;

    const updated = { ...restaurantProfile };
    if (rHeroEditingField === 'name') updated.name = rHeroDraftName;
    if (rHeroEditingField === 'tagline') updated.tagline = rHeroDraftTagline;

    setRestaurantProfile(updated);
    persistRestaurant(updated);
    setRHeroEditingField(null);
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

  const handleRestaurantBannerUpload = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRestaurantForm(prev => ({ ...prev, banner: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Restaurant dashboard "Change banner" (no onboarding form).
  const handleRestaurantBannerChangeDashboard = (file) => {
    if (!file || !restaurantProfile) return;
    setRestaurantBannerUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setRestaurantProfile((prev) => {
        if (!prev) {
          queueMicrotask(() => setRestaurantBannerUploading(false));
          return prev;
        }
        const updated = { ...prev, banner: dataUrl };
        // Do not persist data URLs here — large crops get stripped and wipe the saved https banner.
        // persistRestaurant runs inside handleRestaurantPublish after upload + save.
        Promise.resolve().then(async () => {
          try {
            const ok = await handleRestaurantPublish(updated, { silent: true });
            if (!ok) {
              alert('Banner could not be saved to your public profile. Check your connection and try again.');
            }
          } catch (e) {
            console.warn('Restaurant banner publish failed:', e);
            alert('Banner could not be saved. Please try again.');
          } finally {
            setRestaurantBannerUploading(false);
          }
        });
        return updated;
      });
    };
    reader.onerror = () => {
      setRestaurantBannerUploading(false);
      alert('Could not read the image file. Please try another file.');
    };
    reader.readAsDataURL(file);
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
    
    setRestaurantSaving(true);
    try {
      // Keep local form immediately, but persist banner/menuPdf only after upload succeeds.
      setRestaurantProfile(payload);
      const ok = await handleRestaurantPublish(payload, { silent: true });
      if (!ok) throw new Error('Failed to publish restaurant profile');
      localStorage.removeItem(RESTAURANT_ONBOARDING_KEY);
      restaurantEditInProgressRef.current = false;
      setRestaurantOnboardingStep(0); // 0 means done, show dashboard
    } catch (e) {
      console.error('Failed to save restaurant profile', e);
      restaurantEditInProgressRef.current = false;
      alert('Failed to save. Please try again.');
    } finally {
      setRestaurantSaving(false);
    }
  };

  const handleRestaurantPublish = useCallback(async (profileInput = restaurantProfile, options = {}) => {
    const { silent = false } = options;
    if (!profileInput?.username) {
      alert('Please add a username to your restaurant profile first.');
      return false;
    }
    if (!user) {
      alert('Please sign in to publish your profile.');
      return false;
    }
    const getIdTokenFn = () => getIdToken();
    const getFirebaseUserFn = () => ({ uid: user.uid || null, email: user.email || null, name: user.displayName || null });
    try {
      let existing = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, 'restaurant');
      if (!existing?.data) {
        const existingGeneral = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, 'general');
        if (existingGeneral?.data) existing = existingGeneral;
      }
      const previousPhoto = (existing?.data?.photo && String(existing.data.photo).trim()) || '';

      let photoUrl =
        profileInput.banner && String(profileInput.banner).startsWith('http')
          ? String(profileInput.banner).trim()
          : '';
      if (profileInput.banner && String(profileInput.banner).startsWith('data:')) {
        try {
          const arr = profileInput.banner.split(',');
          const mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/png';
          const bstr = atob(arr[1]);
          const u8arr = new Uint8Array(bstr.length);
          for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
          const file = new File([u8arr], 'banner.png', { type: mime });
          const up = await generalProfileAPI.uploadPhoto(file, getIdTokenFn);
          photoUrl = extractUploadUrl(up);
        } catch (e) {
          console.warn('Banner upload failed:', e);
        }
        if (!photoUrl) {
          const msg = 'Banner could not be uploaded. Try a smaller image or check your connection.';
          if (!silent) alert(msg);
          return false;
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
          menuPdfUrl = extractUploadUrl(up) || (up && up.url) || '';
        } catch (e) {
          console.warn('Menu PDF upload failed:', e);
        }
      }

      const galleryNormalized = [];
      const rawGallery = Array.isArray(profileInput.gallery) ? profileInput.gallery.slice(0, 3) : [];
      for (let gi = 0; gi < rawGallery.length; gi++) {
        const item = rawGallery[gi];
        let gUrl = (item && item.url) ? String(item.url) : '';
        const gName = (item && item.name) ? String(item.name).trim() : '';
        if (!gUrl) continue;
        if (gUrl.startsWith('data:')) {
          try {
            const arr = gUrl.split(',');
            const mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
            const bstr = atob(arr[1]);
            const u8arr = new Uint8Array(bstr.length);
            for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
            const ext = mime.includes('png') ? 'png' : mime.includes('gif') ? 'gif' : mime.includes('webp') ? 'webp' : 'jpg';
            const file = new File([u8arr], `gallery-${gi}.${ext}`, { type: mime });
            const up = await generalProfileAPI.uploadPhoto(file, getIdTokenFn);
            gUrl = extractUploadUrl(up);
          } catch (e) {
            console.warn('Gallery image upload failed:', e);
            continue;
          }
        }
        if (gUrl.startsWith('http')) {
          galleryNormalized.push({ url: gUrl, name: gName });
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
        return { platform: k, title: titleForRestaurantLinkPlatform(k), url, order: idx };
      }).filter(l => l.url);
      const bioParts = [profileInput.bio || ''];
      if (profileInput.phone) bioParts.push(`📞 ${profileInput.phone}`);
      if (profileInput.email || user?.email) bioParts.push(`✉ ${profileInput.email || user?.email}`);
      const payload = {
        username: (profileInput.username || '').toLowerCase().trim(),
        name: profileInput.name || '',
        title: profileInput.tagline || '',
        bio: bioParts.filter(Boolean).join('\n'),
        // Avoid sending empty strings; some backends treat '' as invalid.
        photo: photoUrl || undefined,
        menuPdf: menuPdfUrl || undefined,
        theme: profileInput.theme || 'mint',
        font: profileInput.titleFont || profileInput.font || 'outfit',
        bioFont: profileInput.bodyFont || profileInput.font || 'outfit',
        links,
        gallery: galleryNormalized,
        profileType: 'restaurant'
      };

      let saveResult;
      if (existing?.data) {
        saveResult = await generalProfileAPI.update(payload, getIdTokenFn, getFirebaseUserFn);
        if (!silent) alert('Profile updated! Your link is now live.');
      } else {
        saveResult = await generalProfileAPI.create(payload, getIdTokenFn, getFirebaseUserFn);
        if (!silent) alert('Profile published! Your link is now live.');
      }

      const serverPhoto =
        (saveResult?.data?.photo && String(saveResult.data.photo).trim()) || photoUrl || previousPhoto || '';

      // Update local state with uploaded URLs, then persist.
      // This prevents banner/menuPdf from disappearing after refresh (localStorage strips base64).
      const updatedRestaurantProfile = {
        ...profileInput,
        banner: serverPhoto || profileInput.banner || null,
        menuPdf: menuPdfUrl || profileInput.menuPdf || null,
        gallery: galleryNormalized.length > 0 ? galleryNormalized : (profileInput.gallery || []),
        theme: payload.theme || profileInput.theme || 'mint',
        font: payload.font || profileInput.font || 'outfit',
        titleFont: payload.font || profileInput.titleFont || profileInput.font || 'outfit',
        bodyFont: payload.bioFont || profileInput.bodyFont || profileInput.font || 'outfit',
      };
      try { persistRestaurant(updatedRestaurantProfile); } catch (e) { }
      setRestaurantProfile(updatedRestaurantProfile);
      try { lastRestaurantSyncSigRef.current = JSON.stringify(updatedRestaurantProfile); } catch (e) { }
      setPreviewKey((prev) => prev + 1);
      try {
        await loadGeneralProfileRef.current();
      } catch (e) {
        /* ignore */
      }
      return true;
    } catch (err) {
      if (!silent) alert(err.message || 'Failed to publish. Please try again.');
      else console.warn('Restaurant auto-publish failed:', err);
      return false;
    }
  }, [restaurantProfile, user]);

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
    const email = user?.email;
    if (email) setPrefByEmail(email, 'general');
  }, [profileLock, user]);

  const handleSelectRestaurantMode = useCallback(() => {
    setError('');
    setProfileMode('restaurant');
    if (!profileLock) {
      setProfileLock('general_restaurant');
      try { localStorage.setItem(PROFILE_LOCK_KEY, 'general_restaurant'); } catch (e) { }
    }
    try { localStorage.setItem(GENERAL_FLOW_MODE_KEY, 'restaurant'); } catch (e) { }
    try { localStorage.setItem(PROFILE_MODE_KEY, 'restaurant'); } catch (e) { }
    const email = user?.email;
    if (email) setPrefByEmail(email, 'restaurant');
  }, [profileLock, user]);

  const loadMyProfiles = useCallback(async () => {
    if (!user) return;
    setArtistsLoading(true);
    try {
      const res = await landingArtistAPI.getMyProfiles(() => getIdToken(), getFirebaseUser);
      setMyArtists(res.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.warn('Artist profiles load:', err.message);
      setMyArtists([]);
    } finally {
      setArtistsLoading(false);
      setArtistListReady(true);
    }
  }, [user, getFirebaseUser]);

  const loadGeneralProfile = useCallback(async () => {
    if (!user) return;
    const getIdTokenFn = () => getIdToken();
    const getFirebaseUserFn = getFirebaseUser;
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
          setGeneralForm(buildGeneralFormFromProfileData(data));
          return;
        }

        const resGeneral = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, 'general');
        const data = resGeneral?.data;
        if (data && data.username) {
          setGeneralProfile(data);
          updateGeneralStep('home');
          setGeneralForm(buildGeneralFormFromProfileData(data));
          return;
        }

        updateGeneralStep('create');
        return;
      }

      const requestedType = profileMode === 'restaurant' ? 'restaurant' : 'general';
      const res = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, requestedType);
      const data = res.data || res;
      if (data && data.username) {
        setGeneralProfile(data);
        updateGeneralStep('home');
        setGeneralForm(buildGeneralFormFromProfileData(data));
      } else {
        updateGeneralStep('create');
      }
    } catch (err) {
      console.warn('General profile load:', err.message);
      updateGeneralStep('create');
    } finally {
      setGeneralProfileLoading(false);
    }
  }, [user, getFirebaseUser, profileMode]);
  loadGeneralProfileRef.current = loadGeneralProfile;

  useLayoutEffect(() => {
    const uid = user?.uid || null;
    const uidChanged = uid !== lastGeneralUidRef.current;
    if (uidChanged) {
      lastGeneralUidRef.current = uid;
      setGeneralProfile(null);
      setRestaurantProfile(null);
      setArtistListReady(false);
      
      // Clear all stateful onboarding steps
      setGeneralStep('choice');
      setGeneralOnboardingStep(1);
      setRestaurantOnboardingStep(1);
      
      if (!uid) {
        setGeneralProfileLoading(false);
        return;
      }
      
      // Clear potentially stale localStorage from previous sessions
      try {
        localStorage.removeItem('general_step');
        localStorage.removeItem('general_onboarding_step');
        localStorage.removeItem(RESTAURANT_STORAGE_KEY);
        localStorage.removeItem(RESTAURANT_ONBOARDING_KEY);
        localStorage.removeItem(GENERAL_FLOW_MODE_KEY);
        localStorage.removeItem(PROFILE_MODE_KEY);
        localStorage.removeItem(PROFILE_LOCK_KEY);
      } catch (e) { }

      setGeneralProfileLoading(true);
      return;
    }
    if (!user) return;
    if (!(profileMode === 'choice' || profileMode === 'general' || profileMode === 'restaurant')) return;
    if (generalProfileRef.current) return;
    setGeneralProfileLoading(true);
  }, [user, profileMode, user?.uid]);

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

  const isLoggedIn = !!user;
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
    if (user) {
      if (profileMode !== 'general') {
        loadMyProfiles();
      }
      if (profileMode === 'choice' || profileMode === 'general' || profileMode === 'restaurant') {
        loadGeneralProfile();
      }
    }
  }, [user, loadMyProfiles, loadGeneralProfile, profileMode]);

  useEffect(() => {
    if (!generalProfile || restaurantProfile) return;
    // Allow hydration when user is in restaurant dashboard or chose general_restaurant lock (same account may use both flows).
    if (profileLock !== 'general_restaurant' && profileMode !== 'restaurant') return;
    // If user is actively editing/onboarding their restaurant, don't auto-hydrate/override.
    if (restaurantEditInProgressRef.current) return;
    const fallbackEmail = user?.email || '';
    const likelyRestaurant =
      generalProfile.profileType === 'restaurant' ||
      !!(generalProfile.menuPdf && String(generalProfile.menuPdf).trim());
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

    const cleanedBio = stripPhoneEmailLinesFromBioString(generalProfile.bio || '');
    const extractedPhone = extractPhoneFromBioString(generalProfile.bio || '');
    const extractedEmail = extractEmailFromBioString(generalProfile.bio || '');

    const hydratedGallery = Array.isArray(generalProfile.gallery)
      ? generalProfile.gallery
        .map((g) => ({ url: (g && g.url) ? String(g.url) : '', name: (g && g.name) ? String(g.name) : '' }))
        .filter((g) => g.url)
        .slice(0, 3)
      : [];

    const hydratedRestaurant = {
      name: generalProfile.name || '',
      tagline: generalProfile.title || '',
      bio: cleanedBio || '',
      phone: extractedPhone || '',
      email: extractedEmail || fallbackEmail,
      username: generalProfile.username || '',
      menuPdf: generalProfile.menuPdf || null,
      banner: generalProfile.photo || '',
      gallery: hydratedGallery,
      links: mappedLinks,
      theme: generalProfile.theme || 'mint',
      font: generalProfile.font || 'outfit',
      titleFont: generalProfile.font || 'outfit',
      bodyFont: generalProfile.bioFont || generalProfile.font || 'outfit'
    };
    setRestaurantProfile(hydratedRestaurant);
    persistRestaurant(hydratedRestaurant);
    try { lastRestaurantSyncSigRef.current = JSON.stringify(hydratedRestaurant); } catch (e) { }
    
    // Only mark onboarding as complete if the server data actually confirms it's a restaurant.
    // If it was just 'preferredGeneralMode', let them go through onboarding to create the record properly.
    if (likelyRestaurant) {
      setRestaurantOnboardingStep(0);
      try { localStorage.setItem(RESTAURANT_ONBOARDING_KEY, '0'); } catch (e) { }
    }
    
    setProfileMode('restaurant');
    try { localStorage.setItem(PROFILE_MODE_KEY, 'restaurant'); } catch (e) { }
  }, [generalProfile, restaurantProfile, profileLock, profileMode, user]);

  // Merge gallery from API when opening restaurant dashboard (localStorage may omit images saved on the server).
  useEffect(() => {
    if (profileMode !== 'restaurant' || !generalProfile) return;
    const serverGallery = Array.isArray(generalProfile.gallery) ? generalProfile.gallery : [];
    const normalized = serverGallery
      .map((g) => ({ url: (g && g.url) ? String(g.url).trim() : '', name: (g && g.name) ? String(g.name).trim() : '' }))
      .filter((g) => g.url)
      .slice(0, 3);
    setRestaurantProfile((prev) => {
      if (!prev) return prev;
      if ((prev.gallery || []).some((g) => g.url && String(g.url).startsWith('data:'))) return prev;
      const prevNorm = (prev.gallery || [])
        .map((g) => ({ url: (g && g.url) ? String(g.url).trim() : '', name: (g && g.name) ? String(g.name).trim() : '' }))
        .filter((g) => g.url);
      if (JSON.stringify(normalized) === JSON.stringify(prevNorm)) return prev;
      const next = { ...prev, gallery: normalized };
      try {
        persistRestaurant(next);
      } catch (e) {
        /* ignore */
      }
      return next;
    });
  }, [profileMode, generalProfile]);

  // After refresh, localStorage may have no banner (large data URLs were never stored); pull photo from API.
  useEffect(() => {
    if (profileMode !== 'restaurant' || !generalProfile) return;
    const photo = generalProfile.photo && String(generalProfile.photo).trim();
    if (!photo || !photo.startsWith('http')) return;
    setRestaurantProfile((prev) => {
      if (!prev) return prev;
      const b = prev.banner != null ? String(prev.banner) : '';
      if (b.startsWith('data:')) return prev;
      if (b.startsWith('http') && b === photo) return prev;
      const next = { ...prev, banner: photo };
      try {
        persistRestaurant(next);
      } catch (e) {
        /* ignore */
      }
      try {
        lastRestaurantSyncSigRef.current = JSON.stringify(next);
      } catch (e) {
        /* ignore */
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileMode, generalProfile?.photo]);

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

  useLayoutEffect(() => {
    if (profileMode !== 'artist' || onboardingStep !== 0) return;
    if (!artistListReady) return;

    const first = myArtists[0];
    if (first?.isSetup === true) return;

    // New signups have no artist row yet — myArtists is empty — so we must still open the wizard.
    // useLayoutEffect: run before paint so the dashboard never flashes ahead of the wizard.
    updateOnboardingStep(1);
    setFormData(prev => ({
      ...prev,
      name: first?.name || user?.displayName || user?.email?.split('@')[0] || '',
      email: first?.email || user?.email || ''
    }));
  }, [myArtists, onboardingStep, profileMode, artistListReady, user]);

  // Google OAuth sets Firebase `user` asynchronously; onboarding may open before `user` exists.
  // Fill email / display name from the Google account only while those fields are still empty.
  useEffect(() => {
    if (profileMode !== 'artist') return;
    if (onboardingStep < 1 || onboardingStep > 3) return;
    const email = user?.email || '';
    const displayName = user?.displayName || '';
    if (!email && !displayName) return;
    setFormData((prev) => {
      const next = { ...prev };
      if (email && !String(prev.email || '').trim()) next.email = email;
      if (displayName && !String(prev.name || '').trim()) next.name = displayName;
      return next;
    });
  }, [user?.email, user?.displayName, profileMode, onboardingStep]);

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
    if (!generalForm.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!generalForm.username.trim()) {
      setError('Username is required.');
      return;
    }
    setGeneralSaving(true);
    setError('');
    setGeneralSuccess('');
    try {
      const getIdTokenFn = () => getIdToken();
      const getFirebaseUserFn = getFirebaseUser;
      let photoUrl = generalForm.photo;
      if (generalPhotoFile) {
        const up = await generalProfileAPI.uploadPhoto(generalPhotoFile, getIdTokenFn);
        photoUrl = extractUploadUrl(up) || photoUrl;
        if (!photoUrl || !String(photoUrl).startsWith('http')) {
          throw new Error('Profile photo upload did not return a URL. Try a smaller image or check your connection.');
        }
      }
      const links = generalForm.links.map(l => ({ ...l, url: buildLinkUrl(l.platform, l) || l.url || '' })).filter(l => (l.url || '').trim());
      const { phone: _gp, email: _ge, ...generalRest } = generalForm;
      const payload = { ...generalRest, bio: mergeGeneralBioForSave(generalForm), photo: photoUrl, links, profileType: 'general' };

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
      if (res.data) setGeneralForm(buildGeneralFormFromProfileData(res.data));
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

  const nfcFrontendBase = (process.env.REACT_APP_NFC_FRONTEND_URL || window.location.origin).replace(/\/$/, '');

  const getProfileLink = () => {
    const base = window.location.origin;
    return `${base}/link/${generalProfile?.username || generalForm.username}`;
  };

  const handleGeneralFieldSave = async (field, value) => {
    if (!generalProfile) return;
    const getIdTokenFn = () => getIdToken();
    const getFirebaseUserFn = getFirebaseUser;
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
    const getIdTokenFn = () => getIdToken();
    const getFirebaseUserFn = getFirebaseUser;
    setGeneralSaving(true);
    setError('');
    try {
      const up = await generalProfileAPI.uploadPhoto(file, getIdTokenFn);
      const photoUrl = extractUploadUrl(up);
      if (!photoUrl) {
        throw new Error('Upload did not return an image URL. Try again.');
      }
      const res = await generalProfileAPI.update({ photo: photoUrl }, getIdTokenFn, getFirebaseUserFn);
      setGeneralProfile(res.data);
      setGeneralForm((prev) => ({ ...prev, photo: res.data?.photo || photoUrl }));
      setGeneralPhotoFile(null);
      setGeneralSuccess('Photo updated!');
      setTimeout(() => setGeneralSuccess(''), 2000);
      setPreviewKey(prev => prev + 1);
    } catch (err) {
      setError(err.message || 'Failed to upload photo.');
    } finally {
      setGeneralSaving(false);
    }
  };

  const handleGeneralSaveAll = async () => {
    if (!generalProfile) return;
    const getIdTokenFn = () => getIdToken();
    const getFirebaseUserFn = getFirebaseUser;
    setGeneralSaving(true);
    setError('');
    try {
      let photoUrl = generalForm.photo;
      if (generalPhotoFile) {
        const up = await generalProfileAPI.uploadPhoto(generalPhotoFile, getIdTokenFn);
        photoUrl = extractUploadUrl(up) || photoUrl;
        if (!photoUrl || !String(photoUrl).startsWith('http')) {
          throw new Error('Profile photo upload did not return a URL. Try a smaller image or check your connection.');
        }
      }
      const links = generalForm.links.map(l => ({ ...l, url: buildLinkUrl(l.platform, l) || l.url || '' })).filter(l => (l.url || '').trim());
      const { phone: _gp2, email: _ge2, ...generalRestSave } = generalForm;
      const res = await generalProfileAPI.update(
        { ...generalRestSave, bio: mergeGeneralBioForSave(generalForm), photo: photoUrl, links },
        getIdTokenFn,
        getFirebaseUserFn
      );
      setGeneralProfile(res.data);
      if (res.data) setGeneralForm(buildGeneralFormFromProfileData(res.data));
      setGeneralPhotoFile(null);
      setGeneralSuccess('Profile saved!');
      setTimeout(() => setGeneralSuccess(''), 2500);
      setPreviewKey(prev => prev + 1);
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

  const handleLogout = () => {
    if (user) logout();
    try { localStorage.removeItem('landing_otp_auth'); } catch (e) { }
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
      const tokenForUpload = await getIdToken();
      const up = await landingArtistAPI.uploadPhoto(newGalleryFile, tokenForUpload);
      const url = extractUploadUrl(up) || null;
      if (url) {
        setFormData((prev) => ({
          ...prev,
          gallery: [...prev.gallery, { url, name: newGalleryName.trim() || 'Slide' }]
        }));
        setNewGalleryFile(null);
        setNewGalleryName('');
      } else {
        setError('Upload did not return an image URL. Try again.');
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
      const tokenForUpload = await getIdToken();
      let photoUrl = formData.photo;
      let bgUrl = formData.backgroundPhoto;
      if (photoFile) {
        const up = await landingArtistAPI.uploadPhoto(photoFile, tokenForUpload);
        photoUrl = extractUploadUrl(up) || photoUrl;
        if (!photoUrl || !String(photoUrl).startsWith('http')) {
          throw new Error('Profile photo upload did not return a URL. Try a smaller image or check your connection.');
        }
      }
      if (bgFile) {
        const up = await landingArtistAPI.uploadPhoto(bgFile, tokenForUpload);
        bgUrl = extractUploadUrl(up) || bgUrl;
        if (!bgUrl || !String(bgUrl).startsWith('http')) {
          throw new Error('Banner upload did not return a URL. Try a smaller image or check your connection.');
        }
      }
      const payload = {
        ...formData,
        photo: photoUrl,
        backgroundPhoto: bgUrl,
        artworkCount: formData.artworkCount === '' ? undefined : Number(formData.artworkCount)
      };
      await landingArtistAPI.updateMyProfile(
        editingArtist.artistId || editingArtist._id,
        payload,
        () => getIdToken(),
        getFirebaseUser
      );
      await loadMyProfiles();
      closeEdit();
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
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
      await landingArtistAPI.updateMyProfile(
        artist.artistId || artist._id,
        payload,
        () => getIdToken(),
        getFirebaseUser
      );
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
      await landingArtistAPI.updateMyProfile(artist.artistId || artist._id, payload, () => getIdToken(), getFirebaseUser);
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
      const token = await getIdToken();
      const up = await landingArtistAPI.uploadPhoto(file, token);
      const uploadedUrl = extractUploadUrl(up);
      if (uploadedUrl) {
        const payload = { [field]: uploadedUrl };
        await landingArtistAPI.updateMyProfile(artist.artistId || artist._id, payload, () => getIdToken(), getFirebaseUser);
        setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, [field]: uploadedUrl } : a));
        // Auto-refresh preview
        setPreviewKey(prev => prev + 1);
      } else {
        setError('Upload did not return an image URL. Try again.');
      }
    } catch (err) {
      console.error(`Failed to upload ${field}:`, err);
      setError(err.message || `Failed to upload ${field}.`);
    } finally {
      setIsUploading(null);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleAddGalleryItem = async (file, name = '') => {
    const artist = myArtists[0];
    if (!artist || !file) return;
    setGalleryUploading(true);
    try {
      const token = await getIdToken();
      const up = await landingArtistAPI.uploadPhoto(file, token);
      const uploadedUrl = extractUploadUrl(up);
      if (uploadedUrl) {
        const newItem = { url: uploadedUrl, name: name || 'Gallery image' };
        const newGallery = [...(artist.gallery || []), newItem];
        const payload = { gallery: newGallery };
        await landingArtistAPI.updateMyProfile(artist.artistId || artist._id, payload, () => getIdToken(), getFirebaseUser);
        setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, gallery: newGallery } : a));
        setPreviewKey(prev => prev + 1);
      } else {
        setError('Upload did not return an image URL. Try again.');
      }
    } catch (err) {
      console.error('Failed to add gallery item:', err);
      setError(err.message || 'Failed to add gallery item.');
    } finally {
      setGalleryUploading(false);
    }
  };

  /**
   * Upload multiple gallery images/GIFs at once (no crop — preserves animations).
   * Each file is uploaded sequentially; gallery state is refreshed after all uploads.
   */
  const handleAddMultipleGalleryItems = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const artist = myArtists[0];
    if (!artist) return;
    setGalleryUploading(true);
    try {
      const token = await getIdToken();
      let currentGallery = [...(artist.gallery || [])];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const up = await landingArtistAPI.uploadPhoto(file, token);
          const uploadedUrl = extractUploadUrl(up);
          if (uploadedUrl) {
            const label = `Gallery image ${currentGallery.length + 1}`;
            currentGallery = [...currentGallery, { url: uploadedUrl, name: label }];
          }
        } catch (err) {
          console.error('Failed to upload gallery image:', file.name, err);
        }
      }
      const payload = { gallery: currentGallery };
      await landingArtistAPI.updateMyProfile(artist.artistId || artist._id, payload, () => getIdToken(), getFirebaseUser);
      setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, gallery: currentGallery } : a));
      setPreviewKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to update gallery:', err);
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
      await landingArtistAPI.updateMyProfile(artist.artistId || artist._id, payload, () => getIdToken(), getFirebaseUser);
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
        await landingArtistAPI.updateMyProfile(artist.artistId || artist._id, updates, () => getIdToken(), getFirebaseUser);
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
          
          const createRes = await landingArtistAPI.createMyProfile(createPayload, () => getIdToken(), getFirebaseUser);
          
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
        const u = extractUploadUrl(up);
        if (!u || !String(u).startsWith('http')) {
          throw new Error('Profile photo upload did not return a URL. Try a smaller image or check your connection.');
        }
        payload.photo = u;
      }
      if (bgFile) {
        const up = await landingArtistAPI.uploadPhoto(bgFile, () => getIdToken());
        const u = extractUploadUrl(up);
        if (!u || !String(u).startsWith('http')) {
          throw new Error('Banner upload did not return a URL. Try a smaller image or check your connection.');
        }
        payload.backgroundPhoto = u;
      }

      // Upload gallery files (images / GIFs / videos ≤30s, validated client-side)
      if (onboardingGalleryFiles && onboardingGalleryFiles.length > 0) {
        const galleryUrls = [];
        for (let i = 0; i < onboardingGalleryFiles.length; i++) {
          const file = onboardingGalleryFiles[i];
          assertGalleryFileKind(file);
          await assertVideoMaxDuration(file);
          const up = await landingArtistAPI.uploadPhoto(file, () => getIdToken());
          const galleryUrl = extractUploadUrl(up);
          if (galleryUrl) {
            const isVid = file.type.startsWith('video/');
            galleryUrls.push({ url: galleryUrl, name: isVid ? `Gallery video ${i + 1}` : `Gallery image ${i + 1}` });
          }
        }
        payload.gallery = [...(payload.gallery || []), ...galleryUrls];
      }
      await landingArtistAPI.updateMyProfile(artist.artistId || artist._id, payload, () => getIdToken(), getFirebaseUser);

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
  const displayName = user?.displayName || user?.email || 'Profile';
  const displayEmail = user?.email || '';
  const avatarLetter = user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?';
  const setupLoader = (
    <span className="onboarding-inline-loader" aria-hidden="true">
      <DotLottieReact
        src="https://lottie.host/de82363b-b18e-4bef-9661-ec050f25006c/2wfqQErbPL.lottie"
        loop
        autoplay
      />
    </span>
  );

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

  if (isLoggedIn && isArtistMode && onboardingStep === 0 && !artistListReady) {
    return (
      <div className="profile-page profile-loading">
        <p>Loading your artist profile…</p>
      </div>
    );
  }

  // Onboarding Wizard
  if (isLoggedIn && isArtistMode && onboardingStep > 0) {
    return (
      <>
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
          handlePickAndCrop={handlePickAndCrop}
        />
        {cropper.open && (
         <div style={{ position: 'fixed', inset: 0, zIndex: 1000000 }}>
             <ImageCropperModal
               image={cropper.image}
               aspect={cropper.aspect}
               onSave={cropper.onComplete}
               onCancel={cropper.onCancel}
             />
           </div>
         )}
      </>
    );
  }

  // Avoid flashing the choice UI while artist / general profiles are still loading from the API
  if (isLoggedIn && profileMode === 'choice' && (artistsLoading || generalProfileLoading)) {
    return (
      <div className="profile-page profile-loading">
        <p>Loading your account…</p>
      </div>
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
  if (isLoggedIn && isRestaurantMode && restaurantProfile && restaurantOnboardingStep === 0) {
    return (
      <div className={`dash-root dash-theme-${dashTheme} dash-font-${dashFont} dash-tab-${restaurantActiveTab}`}>
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
              <p className="dash-main-subtitle">{restaurantActiveTab === 'design' ? 'Customize your restaurant profile theme and font' : restaurantActiveTab === 'menu' ? 'Upload and manage your restaurant menu PDF' : 'Manage your restaurant profile and contact information'}</p>
            </div>
          </header>

          <div className="dash-content">
            {/* ── PROFILE & MENU TAB ── */}
            {restaurantActiveTab === 'info' && (
              <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden' }}>
                {/* Left: profile info */}
                <div className="dash-single-profile" style={{ padding: '2.5rem', overflowY: 'auto' }}>
                  {/* Hero banner — with inline edit button */}
                  <div className="dash-profile-hero dash-profile-hero--restaurant">
                    {restaurantProfile.banner
                      ? <img src={restaurantProfile.banner} alt="" className="dash-profile-hero-bg" />
                      : <div className="dash-profile-hero-bg" style={{ background: 'linear-gradient(135deg,#fceabb,#f8b500)' }} />
                    }
                    <div className="dash-profile-hero-overlay" />

                    <button
                      type="button"
                      className="dash-hero-bg-trigger upload-trigger-btn"
                      style={{ cursor: restaurantBannerUploading ? 'wait' : 'pointer', opacity: restaurantBannerUploading ? 0.85 : 1, pointerEvents: restaurantBannerUploading ? 'none' : 'auto', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
                      onClick={() => { if (restaurantBannerInputRef.current) { restaurantBannerInputRef.current.value = ''; restaurantBannerInputRef.current.click(); } }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span>{restaurantBannerUploading ? 'Uploading…' : 'Edit Banner'}</span>
                    </button>
                    <input
                      ref={restaurantBannerInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                      style={{ display: 'none' }}
                      onChange={(e) => { if (!restaurantBannerUploading) handlePickAndCrop(e, 16 / 9, handleRestaurantBannerChangeDashboard); }}
                    />

                    <div className="dash-profile-hero-content">
                      <div className="dash-hero-text">
                        {rHeroEditingField === 'name' ? (
                          <div className="dash-hero-editable-wrapper">
                            <div className="dash-hero-edit-row">
                              <input
                                className="dash-hero-inline-input name"
                                autoFocus
                                value={rHeroDraftName}
                                onChange={(e) => setRHeroDraftName(e.target.value)}
                              />
                              <button type="button" onClick={saveRestaurantHeroEdit} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', fontWeight: 700 }}>
                                Save
                              </button>
                              <button type="button" className="cancel" onClick={cancelRestaurantHeroEdit} style={{ background: 'transparent', color: 'var(--dash-subtext)', border: '1px solid var(--dash-border)', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', fontWeight: 700 }}>
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <h2
                            className="dash-profile-hero-name clickable"
                            onClick={() => startRestaurantHeroEdit('name')}
                            style={{ cursor: 'pointer' }}
                          >
                            <span>{restaurantProfile.name || 'Add restaurant name'}</span>
                          </h2>
                        )}
                        <p className="dash-hero-spec">@{restaurantProfile.username}</p>
                        {rHeroEditingField === 'tagline' ? (
                          <div className="dash-hero-editable-wrapper">
                            <div className="dash-hero-edit-row">
                              <input
                                className="dash-hero-inline-input"
                                autoFocus
                                value={rHeroDraftTagline}
                                onChange={(e) => setRHeroDraftTagline(e.target.value)}
                              />
                              <button type="button" onClick={saveRestaurantHeroEdit} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', fontWeight: 700 }}>
                                Save
                              </button>
                              <button type="button" className="cancel" onClick={cancelRestaurantHeroEdit} style={{ background: 'transparent', color: 'var(--dash-subtext)', border: '1px solid var(--dash-border)', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', fontWeight: 700 }}>
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p
                            className="dash-hero-bio"
                            onClick={() => startRestaurantHeroEdit('tagline')}
                            style={{ cursor: 'pointer' }}
                          >
                            {restaurantProfile.tagline || 'Add tagline...'}
                          </p>
                        )}
                      </div>
                    </div>
                    <LivePreviewSyncOverlay show={restaurantBannerUploading} message="Uploading banner…" />
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
                          setLinkCopiedRest(true);
                          setTimeout(() => setLinkCopiedRest(false), 2000);
                        }}
                        className="dash-icon-pill"
                        aria-label={linkCopiedRest ? 'Copied' : 'Copy profile link'}
                      >
                        {linkCopiedRest ? (
                          <>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="9" y="9" width="13" height="13" rx="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                      <a
                        href={`${window.location.origin}/link/${restaurantProfile.username || ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="dash-icon-pill"
                        aria-label="Open profile link"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                        </svg>
                        <span>Go to Site</span>
                      </a>
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
                      <div
                        onClick={() => { setRBioDraft(restaurantProfile.bio || ''); setRBioEditing(true); }}
                        style={{
                          padding: '0.85rem 1rem',
                          background: 'var(--dash-bg-card)',
                          border: '1px solid var(--dash-border)',
                          borderRadius: '12px',
                          color: restaurantProfile.bio ? 'var(--dash-text)' : 'var(--dash-subtext)',
                          fontSize: '0.95rem',
                          lineHeight: 1.6,
                          cursor: 'text',
                          minHeight: '3rem',
                          // restaurantProfile.bio is saved as a multi-line string; preserve line breaks.
                          whiteSpace: 'pre-line'
                        }}
                      >
                        {restaurantProfile.bio || 'Click to add a bio…'}
                      </div>
                    )}
                  </div>

                  {/* Contact — always editable; server sync debounces via restaurantProfile */}
                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.85rem 1rem', background: 'var(--dash-bg-card)', border: '1px solid var(--dash-border)', borderRadius: '12px' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ color: 'var(--dash-subtext)', flexShrink: 0, marginTop: '1.35rem' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.72 16z"/></svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--dash-subtext)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Phone</div>
                        <PhoneINInput
                          wrapClassName="dash-hero-phone-in"
                          value={restaurantProfile.phone || ''}
                          onChange={(full) => {
                            const updated = { ...restaurantProfile, phone: full };
                            setRestaurantProfile(updated);
                            persistRestaurant(updated);
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.85rem 1rem', background: 'var(--dash-bg-card)', border: '1px solid var(--dash-border)', borderRadius: '12px' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ color: 'var(--dash-subtext)', flexShrink: 0, marginTop: '0.35rem' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--dash-subtext)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Email</div>
                        <div style={{ fontSize: '0.95rem', color: 'var(--dash-text)', fontWeight: 600, wordBreak: 'break-word' }}>
                          {restaurantProfile.email || displayEmail || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gallery Images — up to 3, inline upload */}
                  <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--dash-text)', margin: 0 }}>Gallery Images</h3>
                      {(restaurantProfile.gallery || []).length < 3 && (
                        <>
                        <button
                          type="button"
                          className="upload-trigger-btn"
                          style={{ width: 'auto', background: 'none', border: 'none', padding: 0 }}
                          onClick={() => { if (restaurantGalleryInputRef.current) { restaurantGalleryInputRef.current.value = ''; restaurantGalleryInputRef.current.click(); } }}
                          disabled={restaurantGalleryUploading}
                        >
                          <input
                            ref={restaurantGalleryInputRef}
                            type="file"
                            accept="image/*,image/gif"
                            multiple
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const picked = Array.from(e.target.files || []);
                              if (restaurantGalleryInputRef.current) restaurantGalleryInputRef.current.value = '';
                              if (picked.length === 0) return;
                              let latest = restaurantProfile;
                              const maxAdd = Math.max(0, 3 - (latest.gallery || []).length);
                              const slice = picked.slice(0, maxAdd);
                              if (slice.length === 0) {
                                alert('Only 3 images are allowed.');
                                return;
                              }
                              setRestaurantGalleryUploading(true);
                              try {
                                for (const file of slice) {
                                  if ((latest.gallery || []).length >= 3) break;
                                  let finalFile;
                                  try {
                                    finalFile = await getFileAfterCropOrPassThrough(file, 1);
                                  } catch (err) {
                                    if (err?.message === 'CROP_CANCEL') break;
                                    throw err;
                                  }
                                  assertGalleryFileKind(finalFile);
                                  await assertVideoMaxDuration(finalFile);
                                  const up = await generalProfileAPI.uploadPhoto(finalFile, () => getIdToken());
                                  const url = extractUploadUrl(up);
                                  if (!url) continue;
                                  const existing = latest.gallery || [];
                                  const base = (file.name || '').replace(/\.[^.]+$/, '') || `Gallery ${existing.length + 1}`;
                                  latest = { ...latest, gallery: [...existing, { url, name: base }] };
                                  setRestaurantProfile(latest);
                                  persistRestaurant(latest);
                                  await handleRestaurantPublish(latest, { silent: true });
                                }
                              } catch (err) {
                                console.error('Restaurant gallery upload:', err);
                                alert(err.message || 'Could not upload gallery image.');
                              } finally {
                                setRestaurantGalleryUploading(false);
                              }
                            }}
                          />
                          <span style={{ cursor: restaurantGalleryUploading ? 'wait' : 'pointer', color: '#6366f1', fontWeight: 600, fontSize: '0.85rem', opacity: restaurantGalleryUploading ? 0.7 : 1 }}>{restaurantGalleryUploading ? 'Uploading…' : '+ Add images or GIFs'}</span>
                        </button>
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
                        <div className="dash-link-card dash-link-card--inline" key={p.id}>
                          <div className="dash-link-card-main">
                            <div className="dash-link-icon-circle">
                              {getLinkIcon({ platform: p.id })}
                            </div>
                            <div className="dash-link-content dash-link-content--inline">
                              <span className="dash-link-title" title={p.label}>{p.label}</span>
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

                {/* Right: live preview = same public page as /link/:username (desktop only) */}
                {!isMobileViewport && (
                  <div className="dash-preview-panel">
                    <RestaurantPublicPreviewIframe username={restaurantProfile.username} previewKey={previewKey} bannerSyncing={restaurantBannerUploading} />
                  </div>
                )}
              </div>
            )}

            {/* ── DESIGN TAB ── */}
            {restaurantActiveTab === 'design' && (
              <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden' }}>
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

                {/* Right: live preview = same public page (desktop only) */}
                {!isMobileViewport && (
                  <div className="dash-preview-panel">
                    <RestaurantPublicPreviewIframe username={restaurantProfile.username} previewKey={previewKey} bannerSyncing={restaurantBannerUploading} />
                  </div>
                )}
              </div>
            )}

            {/* ── MENU TAB ── */}
            {restaurantActiveTab === 'menu' && (
              <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden' }}>
                {/* Left: PDF upload & viewer */}
                <div className="dash-single-profile" style={{ padding: '2.5rem', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dash-text)', margin: 0 }}>Menu PDF</h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--dash-subtext)', margin: '4px 0 0' }}>Customers can view this on your public profile</p>
                    </div>
                    {restaurantProfile.menuPdf && (
                      <button
                        type="button"
                        className="upload-trigger-btn"
                        style={{ width: 'auto', background: 'none', border: '1px solid #6366f1', borderRadius: '10px', padding: '0.5rem 1rem' }}
                        onClick={() => { if (restaurantMenuInputRef.current) { restaurantMenuInputRef.current.value = ''; restaurantMenuInputRef.current.click(); } }}
                      >
                        <input
                          ref={restaurantMenuInputRef}
                          type="file"
                          accept="application/pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => {
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
                          }}
                        />
                        <span style={{ cursor: 'pointer', color: '#6366f1', fontWeight: 600, fontSize: '0.85rem' }}>Replace PDF</span>
                      </button>
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
                      <button
                        type="button"
                        className="upload-trigger-btn"
                        style={{ width: 'auto', background: '#6366f1', color: '#fff', borderRadius: '12px', padding: '0.65rem 1.5rem', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-block' }}
                        onClick={() => { if (restaurantMenuInputRef.current) { restaurantMenuInputRef.current.value = ''; restaurantMenuInputRef.current.click(); } }}
                      >
                        <input
                          ref={restaurantMenuInputRef}
                          type="file"
                          accept="application/pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const updated = { ...restaurantProfile, menuPdf: ev.target.result };
                              setRestaurantProfile(updated);
                              persistRestaurant(updated);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        Upload Menu PDF
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: full live public page preview (desktop only) */}
                {!isMobileViewport && (
                  <div className="dash-preview-panel">
                    <RestaurantPublicPreviewIframe username={restaurantProfile.username} previewKey={previewKey} bannerSyncing={restaurantBannerUploading} />
                  </div>
                )}
              </div>
            )}

            {/* ── PREVIEW TAB (mobile pill) ── */}
            {restaurantActiveTab === 'preview' && (
              <div className="dash-mobile-preview-page">
                <div className="dash-mobile-preview-frame-wrap dash-mobile-preview-frame-wrap--relative">
                  <iframe
                    key={`restaurant-preview-${restaurantProfile.username || 'restaurant'}-${previewKey}`}
                    title="Restaurant Profile Preview"
                    src={`${window.location.origin}/link/${encodeURIComponent((restaurantProfile.username || '').trim())}?v=${previewKey}`}
                    className="dash-mobile-preview-iframe"
                    sandbox="allow-scripts allow-same-origin"
                  />
                  <LivePreviewSyncOverlay show={restaurantBannerUploading} message="Uploading banner…" />
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Mobile bottom nav — Restaurant (centered pill) */}
        {isMobileViewport && (
          <div className="dash-mobile-bottom-nav">
            <div className="dash-mobile-bottom-nav-inner">
              <button
                type="button"
                className={`dash-mobile-bottom-btn ${restaurantActiveTab === 'info' ? 'dash-mobile-bottom-btn-active' : ''}`}
                onClick={() => setRestaurantActiveTab('info')}
              >
                <div className="dash-mobile-bottom-btn-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <span>Profile</span>
              </button>
              <button
                type="button"
                className={`dash-mobile-bottom-btn ${restaurantActiveTab === 'design' ? 'dash-mobile-bottom-btn-active' : ''}`}
                onClick={() => setRestaurantActiveTab('design')}
              >
                <div className="dash-mobile-bottom-btn-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                </div>
                <span>Design</span>
              </button>
              <button
                type="button"
                className={`dash-mobile-bottom-btn ${restaurantActiveTab === 'menu' ? 'dash-mobile-bottom-btn-active' : ''}`}
                onClick={() => setRestaurantActiveTab('menu')}
              >
                <div className="dash-mobile-bottom-btn-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                </div>
                <span>Menu</span>
              </button>
              <button
                type="button"
                className={`dash-mobile-bottom-btn ${restaurantActiveTab === 'preview' ? 'dash-mobile-bottom-btn-active' : ''}`}
                onClick={() => setRestaurantActiveTab('preview')}
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
        {cropper.open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000000 }}>
            <ImageCropperModal
              image={cropper.image}
              aspect={cropper.aspect}
              onSave={cropper.onComplete}
              onCancel={cropper.onCancel}
            />
          </div>
        )}
      </div>
    );
  }
  if (isLoggedIn && isRestaurantMode && (!restaurantProfile || restaurantOnboardingStep > 0)) {
    const rStep = restaurantOnboardingStep;
    return (
      <div className="profile-page profile-login-wrap onboarding-screen">
        <div className="profile-login-card profile-choice-card general-onboarding-card">
          {rStep > 1 && (
            <button type="button" className="profile-back-btn" onClick={() => updateRestaurantOnboardingStep(rStep - 1)}>← Back</button>
          )}
          <div className="general-onboarding-progress">
            <div className="general-onboarding-progress-bar" style={{ width: `${(rStep / 6) * 100}%` }} />
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
                  <button
                    type="button"
                    className="upload-trigger-btn"
                    onClick={() => { if (restaurantBannerInputRef.current) { restaurantBannerInputRef.current.value = ''; restaurantBannerInputRef.current.click(); } }}
                    aria-label="Upload restaurant banner"
                  >
                    <div className="upload-preview-banner">
                      {restaurantForm.banner ? <img src={restaurantForm.banner} alt="Preview" /> : <span>+ Tap to upload banner</span>}
                    </div>
                  </button>
                  <input
                    ref={restaurantBannerInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={e => handlePickAndCrop(e, 16 / 9, handleRestaurantBannerUpload)}
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                  />
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
                  <PhoneINInput
                    wrapClassName="onboarding-phone-in"
                    value={restaurantForm.phone}
                    onChange={(v) => setRestaurantForm((prev) => ({ ...prev, phone: v }))}
                    autoFocus
                  />
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
                            '--theme-chip-text': t.text,
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
                        ref={restaurantMenuInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="upload-trigger-btn"
                        style={{ width: 'auto', display: 'inline-block' }}
                        onClick={() => { if (restaurantMenuInputRef.current) { restaurantMenuInputRef.current.value = ''; restaurantMenuInputRef.current.click(); } }}
                      >
                        <span style={{ cursor: 'pointer', color: '#6366f1', fontWeight: 600, display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(99,102,241,0.1)', borderRadius: '8px' }}>
                          Upload PDF
                        </span>
                      </button>
                      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>Max file size: 5MB</p>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={removePdf}
                        aria-label="Remove PDF"
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 10,
                          background: 'none',
                          border: 'none',
                          borderRadius: 0,
                          boxShadow: 'none',
                          padding: '4px 6px',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#111827',
                          fontSize: '1.25rem',
                          lineHeight: 1,
                          fontWeight: 400,
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}
                      >
                        ×
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
                <button type="button" className="onboarding-btn-primary" onClick={() => updateRestaurantOnboardingStep(5)}>
                  Next Step →
                </button>
              </div>
            </div>
          )}

          {rStep === 5 && (
            <div className="onboarding-step fade-in">
              <h2>Step 5 – Gallery</h2>
              <p className="onboarding-subtitle">Add up to 3 photos or GIFs (optional). You can select several files at once in the picker.</p>
              <div className="onboarding-fields">
                <div className="onboarding-field">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <label style={{ color: '#1a1b2e', margin: 0 }}>Gallery images</label>
                    {(restaurantForm.gallery || []).length < 3 && (
                      <>
                        <input
                          ref={restaurantGalleryInputRef}
                          type="file"
                          accept="image/*,image/gif"
                          multiple
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const picked = Array.from(e.target.files || []);
                            if (restaurantGalleryInputRef.current) restaurantGalleryInputRef.current.value = '';
                            if (picked.length === 0) return;
                            let latest = restaurantForm;
                            const maxAdd = Math.max(0, 3 - (latest.gallery || []).length);
                            const slice = picked.slice(0, maxAdd);
                            if (slice.length === 0) {
                              alert('Only 3 images are allowed.');
                              return;
                            }
                            setRestaurantGalleryUploading(true);
                            try {
                              for (const file of slice) {
                                if ((latest.gallery || []).length >= 3) break;
                                let finalFile;
                                try {
                                  finalFile = await getFileAfterCropOrPassThrough(file, 1);
                                } catch (err) {
                                  if (err?.message === 'CROP_CANCEL') break;
                                  throw err;
                                }
                                assertGalleryFileKind(finalFile);
                                await assertVideoMaxDuration(finalFile);
                                const up = await generalProfileAPI.uploadPhoto(finalFile, () => getIdToken());
                                const url = extractUploadUrl(up);
                                if (!url) continue;
                                const existing = latest.gallery || [];
                                const base = (file.name || '').replace(/\.[^.]+$/, '') || `Gallery ${existing.length + 1}`;
                                latest = { ...latest, gallery: [...existing, { url, name: base }] };
                                setRestaurantForm(latest);
                              }
                            } catch (err) {
                              console.error('Onboarding gallery upload:', err);
                              alert(err.message || 'Could not upload image. Try a smaller file.');
                            } finally {
                              setRestaurantGalleryUploading(false);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="upload-trigger-btn"
                          style={{ width: 'auto' }}
                          onClick={() => { if (restaurantGalleryInputRef.current) { restaurantGalleryInputRef.current.value = ''; restaurantGalleryInputRef.current.click(); } }}
                          disabled={restaurantGalleryUploading}
                          aria-label="Add images or GIFs"
                        >
                          <span style={{ cursor: restaurantGalleryUploading ? 'wait' : 'pointer', color: '#6366f1', fontWeight: 600, fontSize: '0.85rem', opacity: restaurantGalleryUploading ? 0.7 : 1 }}>
                            {restaurantGalleryUploading ? 'Uploading…' : '+ Add images or GIFs'}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                  {(restaurantForm.gallery || []).length === 0 ? (
                    <div style={{ padding: '2rem', border: '2px dashed rgba(0,0,0,0.15)', borderRadius: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', background: 'rgba(0,0,0,0.02)' }}>
                      No gallery images yet. Add up to 3.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                      {(restaurantForm.gallery || []).map((item, idx) => (
                        <div key={`${item.url}-${idx}`} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                          <img src={item.url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                          <div style={{ padding: '0.35rem', background: 'rgba(0,0,0,0.65)' }}>
                            <input
                              type="text"
                              value={item.name || ''}
                              placeholder="Caption"
                              onChange={(e) => {
                                const g = [...(restaurantForm.gallery || [])];
                                g[idx] = { ...g[idx], name: e.target.value };
                                setRestaurantForm((prev) => ({ ...prev, gallery: g }));
                              }}
                              style={{ width: '100%', fontSize: '0.75rem', padding: '0.25rem 0.35rem', borderRadius: '6px', border: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                          <button
                            type="button"
                            aria-label="Remove image"
                            onClick={() => {
                              setRestaurantForm((prev) => ({
                                ...prev,
                                gallery: (prev.gallery || []).filter((_, i) => i !== idx)
                              }));
                            }}
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              background: 'none',
                              border: 'none',
                              color: '#111827',
                              cursor: 'pointer',
                              fontSize: '1.1rem',
                              lineHeight: 1,
                              padding: '2px 4px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="onboarding-btn-primary" onClick={() => updateRestaurantOnboardingStep(6)}>
                  Next Step →
                </button>
              </div>
            </div>
          )}

          {rStep === 6 && (
            <div className="onboarding-step fade-in">
              <h2>Step 6 – Links</h2>
              <p className="onboarding-subtitle">Add social links and platforms customers can tap (optional)</p>
              <div className="onboarding-fields">
                <div className="onboarding-field">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <label style={{ color: '#1a1b2e', margin: 0 }}>Links</label>
                    <button
                      type="button"
                      onClick={() => {
                        setRTempPlatforms(Object.keys(restaurantForm.links || {}));
                        setRLinkSelectorOpen(true);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.9rem',
                        borderRadius: '999px',
                        border: '1px solid rgba(0,0,0,0.2)',
                        background: '#fff',
                        color: '#1a1b2e',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> Add Platforms
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {ALL_PLATFORMS.filter((p) => p.id in (restaurantForm.links || {})).map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '10px',
                          padding: '0.35rem 0.5rem 0.35rem 0.65rem',
                          background: 'rgba(0,0,0,0.02)',
                          minHeight: '40px'
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: '#1a1b2e',
                            fontSize: '0.8rem',
                            flexShrink: 0,
                            maxWidth: '92px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={p.label}
                        >
                          {p.label}
                        </span>
                        <input
                          className="onboarding-input"
                          placeholder="URL / handle"
                          value={(restaurantForm.links || {})[p.id] || ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setRestaurantForm((prev) => ({
                              ...prev,
                              links: { ...(prev.links || {}), [p.id]: v }
                            }));
                          }}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            margin: 0,
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.85rem',
                            borderRadius: '999px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setRestaurantForm((prev) => {
                              const next = { ...(prev.links || {}) };
                              delete next[p.id];
                              return { ...prev, links: next };
                            });
                          }}
                          style={{
                            flexShrink: 0,
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            fontSize: '1.05rem',
                            lineHeight: 1,
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          aria-label={`Remove ${p.label}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  {Object.keys(restaurantForm.links || {}).length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 0' }}>Tap “Add Platforms” to choose Instagram, WhatsApp, website, and more.</p>
                  )}
                </div>
              </div>
              <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="onboarding-btn-complete" onClick={saveRestaurantProfile} disabled={restaurantSaving}>
                  {restaurantSaving ? <><span>Setting up...</span>{setupLoader}</> : 'Save Restaurant ✓'}
                </button>
              </div>
            </div>
          )}

          {rLinkSelectorOpen && (
            <div className="dash-selector-overlay" style={{ zIndex: 100001 }}>
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
                        onClick={() => setRTempPlatforms((prev) => (isActive ? prev.filter((x) => x !== p.id) : [...prev, p.id]))}
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
                  <button
                    type="button"
                    className="dash-selector-btn-done"
                    onClick={() => {
                      setRestaurantForm((prev) => {
                        const currentLinks = prev.links || {};
                        const newLinks = { ...currentLinks };
                        rTempPlatforms.forEach((id) => {
                          if (!(id in newLinks)) newLinks[id] = '';
                        });
                        Object.keys(newLinks).forEach((id) => {
                          if (!rTempPlatforms.includes(id)) delete newLinks[id];
                        });
                        return { ...prev, links: newLinks };
                      });
                      setRLinkSelectorOpen(false);
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          <button type="button" onClick={handleLogout} className="profile-logout-btn-link" style={{ marginTop: 16 }}>Sign out</button>
        </div>
        {cropper.open && (
           <div style={{ position: 'fixed', inset: 0, zIndex: 1000000 }}>
             <ImageCropperModal
               image={cropper.image}
               aspect={cropper.aspect}
               onSave={cropper.onComplete}
               onCancel={cropper.onCancel}
             />
           </div>
         )}
      </div>
    );
  }

  if (isLoggedIn && isGeneralMode && generalProfileLoading) {
    return (
      <div className="profile-page profile-loading">
        <p>Loading your profile...</p>
      </div>
    );
  }

  // General Profile: 4-step onboarding (no profile yet)
  if (isLoggedIn && isGeneralMode && !generalProfile && !generalProfileLoading && generalStep !== 'home') {
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
                            '--theme-chip-text': t.text,
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
              <h2>Step 3 – Photo &amp; bio</h2>
              <p className="onboarding-subtitle">Profile photo and short bio</p>
              <div className="onboarding-fields">
                <div className="onboarding-field">
                  <label>Profile photo (optional)</label>
                  <div className="image-upload-box">
                    <button
                      type="button"
                      className="upload-trigger-btn"
                      onClick={() => { if (genPhotoInputRef.current) { genPhotoInputRef.current.value = ''; genPhotoInputRef.current.click(); } }}
                      aria-label="Upload profile photo"
                    >
                      <div className="upload-preview-circle dash-avatar-trigger" style={{ position: 'relative', overflow: 'hidden' }}>
                        {(generalForm.photo || generalPhotoFile) ? <img src={generalPhotoPreviewUrl || generalForm.photo} alt="Preview" /> : <span>+</span>}
                        <div className="dash-avatar-overlay">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ color: '#fff' }}>
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </div>
                      </div>
                    </button>
                    <input
                      ref={genPhotoInputRef}
                      type="file"
                      style={{ display: 'none' }}
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                      onChange={e => handlePickAndCrop(e, 1, (file) => setGeneralPhotoFile(file))}
                    />
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
                        <PhoneINInput
                          wrapClassName="onboarding-phone-in"
                          value={toINFullPhone(getINDisplayDigits(link.waPhone || ''))}
                          onChange={(v) => updateLink(idx, 'waPhone', v)}
                        />
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
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
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
                  {generalSaving ? <><span>Setting up...</span>{setupLoader}</> : 'Create General Profile ✓'}
                </button>
              </div>
            </form>
          )}

          <button type="button" onClick={handleLogout} className="profile-logout-btn-link" style={{ marginTop: 16 }}>Sign out</button>
        </div>
        {cropper.open && (
           <div style={{ position: 'fixed', inset: 0, zIndex: 1000000 }}>
             <ImageCropperModal
               image={cropper.image}
               aspect={cropper.aspect}
               onSave={cropper.onComplete}
               onCancel={cropper.onCancel}
             />
           </div>
         )}
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
              {error && (
                <div style={{ padding: '0.8rem 1.2rem', background: '#fef2f2', color: '#991b1b', border: '1px solid #f87171', borderRadius: '12px', marginTop: '1rem', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}
              {generalSuccess && (
                <div style={{ padding: '0.8rem 1.2rem', background: '#f0fdf4', color: '#166534', border: '1px solid #4ade80', borderRadius: '12px', marginTop: '1rem', fontSize: '0.9rem' }}>
                  {generalSuccess}
                </div>
              )}
              {generalActiveTab === 'profile' && (
                <div className="dash-profile-link-iconbar" aria-label="Profile link actions">
                  <button
                    type="button"
                    className="dash-icon-pill"
                    onClick={() => {
                      navigator.clipboard.writeText(gProfileLink);
                      setLinkCopiedGeneral(true);
                      setTimeout(() => setLinkCopiedGeneral(false), 2000);
                    }}
                    aria-label={linkCopiedGeneral ? 'Copied' : 'Copy profile link'}
                  >
                    {linkCopiedGeneral ? (
                      <>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <a
                    className="dash-icon-pill"
                    href={gProfileLink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open profile link"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                    </svg>
                    <span>Go to Site</span>
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

                  {/* Re-designed General Profile Hero (matches Artist style) */}
                    <div className="dash-profile-hero" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', minHeight: 'auto', padding: '2rem' }}>
                      <div className="dash-profile-hero-content" style={{ alignItems: 'center' }}>
                        <div className="dash-profile-hero-avatar" style={{ width: '100px', height: '100px', border: '3px solid rgba(255,255,255,0.15)' }}>
                          <button
                            type="button"
                            className="dash-avatar-trigger upload-trigger-btn"
                            style={{ margin: 0, padding: 0, border: 'none', background: 'none' }}
                            onClick={() => { if (genDashPhotoInputRef.current) { genDashPhotoInputRef.current.value = ''; genDashPhotoInputRef.current.click(); } }}
                            aria-label="Change profile photo"
                          >
                            <input
                              ref={genDashPhotoInputRef}
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                              style={{ display: 'none' }}
                              onChange={(e) => handlePickAndCrop(e, 1, (file) => {
                                setGeneralPhotoFile(file);
                                handleGeneralPhotoSave(file);
                              })}
                            />
                            {(generalForm.photo || generalPhotoFile) ? (
                              <img src={generalPhotoPreviewUrl || generalForm.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
                                {(generalProfile.name || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="dash-avatar-overlay">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ color: '#fff' }}>
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                              </svg>
                            </div>
                            {generalSaving && <div className="dash-avatar-uploading-spinner" style={{ position: 'absolute', inset: 0, border: '3px solid rgba(99, 102, 241, 0.4)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'rotate 1s linear infinite' }} />}
                          </button>
                        </div>
                        <div className="dash-profile-hero-info">
                          <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                            {generalProfile.name || 'Unnamed'}
                          </h2>
                          <p style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                            @{generalProfile.username}
                          </p>
                          
                          <button
                            type="button"
                            className="dash-icon-pill upload-trigger-btn"
                            style={{
                              padding: '10px 20px',
                              borderRadius: '12px',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              color: '#fff',
                              background: '#000',
                              transition: 'all 0.2s ease',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '10px',
                              lineHeight: 1,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                            onClick={() => { if (genDashChangePhotoInputRef.current) { genDashChangePhotoInputRef.current.value = ''; genDashChangePhotoInputRef.current.click(); } }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Change Photo
                            <input
                              ref={genDashChangePhotoInputRef}
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                              style={{ display: 'none' }}
                              onChange={(e) => handlePickAndCrop(e, 1, (file) => {
                                setGeneralPhotoFile(file);
                                handleGeneralPhotoSave(file);
                              })}
                            />
                          </button>
                        </div>
                      </div>
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

                  <div style={{ display: 'grid', gap: '1.25rem', marginTop: '1.25rem' }}>
                    <div style={{ background: 'var(--dash-bg-card)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--dash-border)' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--dash-subtext)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Phone</label>
                      <PhoneINInput
                        wrapClassName="dash-hero-phone-in"
                        value={generalForm.phone || ''}
                        onChange={(v) => setGeneralForm(prev => ({ ...prev, phone: v }))}
                      />
                    </div>
                    <div style={{ background: 'var(--dash-bg-card)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--dash-border)' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--dash-subtext)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Email</label>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--dash-text)', fontWeight: 600, wordBreak: 'break-word' }}>
                        {generalForm.email || displayEmail || '—'}
                      </p>
                    </div>
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
                        key={`gp-${generalProfile.username}-${generalProfile.theme}-${previewKey}`}
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
                        key={`gp-design-${generalProfile.theme}-${generalProfile.font}-${previewKey}`}
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
                        key={`gp-links-${generalProfile.username}-${previewKey}`}
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
                    key={`gp-preview-${generalProfile.username}-${generalProfile.theme}-${previewKey}`}
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
        {cropper.open && (
           <div style={{ position: 'fixed', inset: 0, zIndex: 1000000 }}>
             <ImageCropperModal
               image={cropper.image}
               aspect={cropper.aspect}
               onSave={cropper.onComplete}
               onCancel={cropper.onCancel}
             />
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
                  <button
                    type="button"
                    className="profile-edit-file-btn upload-trigger-btn"
                    style={{ width: 'auto' }}
                    onClick={() => { if (genPhotoInputRef.current) { genPhotoInputRef.current.value = ''; genPhotoInputRef.current.click(); } }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>{generalPhotoFile ? 'Change photo' : 'Upload photo'}</span>
                    <input
                      ref={genPhotoInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                      style={{ display: 'none' }}
                      onChange={(e) => handlePickAndCrop(e, 1, (file) => setGeneralPhotoFile(file))}
                    />
                  </button>
                  {(generalForm.photo || generalPhotoFile) && (
                    <div className="profile-edit-photo-preview">
                      <img src={generalPhotoPreviewUrl || generalForm.photo} alt="" />
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
                          <PhoneINInput
                            wrapClassName="profile-edit-phone-in"
                            value={toINFullPhone(getINDisplayDigits(link.waPhone || ''))}
                            onChange={(v) => updateLink(idx, 'waPhone', v)}
                          />
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
        {cropper.open && (
           <div style={{ position: 'fixed', inset: 0, zIndex: 1000000 }}>
             <ImageCropperModal
               image={cropper.image}
               aspect={cropper.aspect}
               onSave={cropper.onComplete}
               onCancel={cropper.onCancel}
             />
           </div>
         )}
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
                const profileUrl = `${nfcFrontendBase}/artist?id=${myArtists[0].artistId}`;
                return (
                  <div className="dash-profile-link-iconbar" aria-label="Profile link actions">
                    <button
                      type="button"
                      className="dash-icon-pill"
                      onClick={() => {
                        navigator.clipboard.writeText(profileUrl);
                        setLinkCopiedArtist(true);
                        setTimeout(() => setLinkCopiedArtist(false), 2000);
                      }}
                      aria-label={linkCopiedArtist ? 'Copied' : 'Copy profile link'}
                    >
                      {linkCopiedArtist ? (
                        <>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                    <a
                      className="dash-icon-pill"
                      href={profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open profile link"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                      </svg>
                      <span>Go to Site</span>
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
              <div className="dash-mobile-preview-frame-wrap dash-mobile-preview-frame-wrap--relative">
                <iframe
                  key={previewKey}
                  title="Artist Preview"
                  src={`${nfcFrontendBase}/artist?id=${myArtists[0].artistId}`}
                  className="dash-mobile-preview-iframe"
                  sandbox="allow-scripts allow-same-origin"
                />
                <LivePreviewSyncOverlay show={isUploading === 'backgroundPhoto'} message="Uploading cover…" />
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
                <div className="dash-design-mobile-preview-wrap dash-design-mobile-preview-wrap--relative">
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
                    src={`${nfcFrontendBase}/artist?id=${myArtists[0].artistId}`}
                    className="dash-design-mobile-preview-iframe"
                    sandbox="allow-scripts allow-same-origin"
                  />
                  <LivePreviewSyncOverlay show={isUploading === 'backgroundPhoto'} message="Uploading cover…" />
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
                      src={`${nfcFrontendBase}/artist?id=${myArtists[0].artistId}`}
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
              const getArtUrl = (artId) => `${nfcFrontendBase}/artist?id=${artistToken}&art=${artId}`;
              const getQrUrl = (artUrl) => `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(artUrl)}&bgcolor=ffffff&color=1a1a2e&qzone=2`;

              const handleArtImagePick = (e) => {
                if (artImagePreview.length >= 3) {
                  alert('Only 3 images are allowed per showcase.');
                  e.target.value = '';
                  return;
                }
                handlePickAndCrop(e, 3 / 4, (croppedFile) => {
                  const reader = new FileReader();
                  reader.onload = (ev) => setArtImagePreview(prev => [...prev, { file: croppedFile, url: ev.target.result }]);
                  reader.readAsDataURL(croppedFile);
                });
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
                    const u = extractUploadUrl(uploaded);
                    if (u) uploadedUrls.push(u);
                  }
                  if (artImagePreview.length > 0 && uploadedUrls.length === 0) {
                    throw new Error('Image upload did not return URLs. Try again.');
                  }
                  const artId = Date.now();
                  const newItem = { id: artId, title, description: desc || '', theme: newArtTheme, images: uploadedUrls.slice(0, 3) };
                  await handleUpdateHeroField('artLinks', [...items, newItem]);
                  document.getElementById('art-title-input').value = '';
                  document.getElementById('art-desc-input').value = '';
                  setArtImagePreview([]);
                  setNewArtTheme('painting');
                  // Automatically focus preview on the newly added artwork
                  setArtPreviewId(artId);
                } catch (err) {
                  alert(err.message || 'Could not save artwork.');
                } finally {
                  setArtSaving(false);
                }
              };

              const handleRemoveArt = async (itemId) => {
                await handleUpdateHeroField('artLinks', items.filter(i => i.id !== itemId));
              };

              // Pick first item for preview by default
              const previewArtId = artPreviewId || (items[0]?.id ?? null);
              const artPreviewSrc = previewArtId
                ? `${nfcFrontendBase}/artist?id=${artistToken}&art=${previewArtId}`
                : `${nfcFrontendBase}/artist?id=${artistToken}`;

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
                          Artwork Images {artImagePreview.length > 0 && <span style={{ color: 'var(--dash-accent)' }}>({artImagePreview.length}/3 added)</span>}
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
                          <span style={{ fontSize: '0.82rem', color: 'var(--dash-subtext)' }}>{artImagePreview.length > 0 ? '+ Add more images (max 3)' : 'Click to upload artwork photos (max 3)'}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--dash-subtext)', opacity: 0.55 }}>Up to 3 images per showcase — shown as slideshow</span>
                          <input id="art-image-file" type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml" multiple onChange={handleArtImagePick} style={{ display: 'none' }} />
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
                          <label className={`dash-hero-bg-trigger${isUploading === 'backgroundPhoto' ? ' dash-hero-bg-trigger--busy' : ''}`} style={{ cursor: isUploading === 'backgroundPhoto' ? 'wait' : undefined, opacity: isUploading === 'backgroundPhoto' ? 0.9 : undefined }}>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                              disabled={isUploading === 'backgroundPhoto'}
                              onChange={(e) => handlePickAndCrop(e, 16 / 9, (file) => handleUploadField('backgroundPhoto', file))}
                              style={{ display: 'none' }}
                            />
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                            <span>{isUploading === 'backgroundPhoto' ? 'Uploading…' : 'Change Cover'}</span>
                          </label>

                          <div className="dash-profile-hero-content">
                            <div className="dash-profile-hero-avatar">
                              <label className="dash-avatar-trigger">
                                <input
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                                  onChange={(e) => handlePickAndCrop(e, 1, (file) => handleUploadField('photo', file))}
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
                          <LivePreviewSyncOverlay show={isUploading === 'backgroundPhoto'} message="Uploading cover…" />
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
                              <div className="dash-link-card dash-link-card--inline" key={platform.id}>
                                <div className="dash-link-card-main">
                                  <div className="dash-link-icon-circle">
                                    {getLinkIcon({ platform: platform.id })}
                                  </div>
                                  <div className="dash-link-content dash-link-content--inline">
                                    <span className="dash-link-title" title={platform.label}>{platform.label}</span>
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
                                <p className="dash-contact-value" style={{ margin: 0 }}>{artist.email || displayEmail || '—'}</p>
                              </div>
                            </div>

                            <div className="dash-contact-item">
                              <div className="dash-contact-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                              </div>
                              <div className="dash-contact-content">
                                <span className="dash-contact-label">Phone</span>
                                <div className="dash-hero-edit-row">
                                  <PhoneINInput
                                    wrapClassName="dash-hero-phone-in"
                                    value={heroUpdates.phone !== undefined ? heroUpdates.phone : (artist.phone || '')}
                                    onChange={(v) => setHeroUpdates((prev) => ({ ...prev, phone: v }))}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateHeroField('phone', heroUpdates.phone !== undefined ? heroUpdates.phone : (artist.phone || ''))}
                                  >
                                    Save
                                  </button>
                                </div>
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

                        {/* Gallery Section */}
                        <div className="dash-profile-bio-section">
                          <div className="dash-section-header">
                            <h3 className="dash-section-label">Gallery</h3>
                            <button
                              type="button"
                              className="dash-add-platform-btn upload-trigger-btn"
                              style={{ width: 'auto' }}
                              onClick={() => { if (artistGalleryInputRef.current) { artistGalleryInputRef.current.value = ''; artistGalleryInputRef.current.click(); } }}
                            >
                              <input
                                ref={artistGalleryInputRef}
                                type="file"
                                accept="image/*,image/gif"
                                multiple
                                style={{ display: 'none' }}
                                onChange={handleAddMultipleGalleryItems}
                              />
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              {galleryUploading ? 'Uploading...' : 'Add Images'}
                            </button>
                          </div>

                          <div className="dash-gallery-grid">
                            {(artist.gallery || []).map((item, idx) => (
                              <div className="dash-gallery-item" key={idx}>
                                <img src={item.url} alt={item.name} />
                                <div className="dash-gallery-item-overlay">
                                  <input
                                    className="dash-gallery-item-name-input"
                                    value={item.name}
                                    placeholder="Gallery title"
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
                                <p>No images added yet. Start by adding images from your gallery.</p>
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
                              src={`${nfcFrontendBase}/artist?id=${artist.artistId}`}
                              className="dash-preview-iframe"
                              sandbox="allow-scripts allow-same-origin"
                            />
                            <LivePreviewSyncOverlay show={isUploading === 'backgroundPhoto'} message="Uploading cover…" />
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
                      <button
                        type="button"
                        className="profile-edit-file-btn upload-trigger-btn"
                        style={{ width: 'auto' }}
                        onClick={() => { if (artistProfilePhotoInputRef.current) { artistProfilePhotoInputRef.current.value = ''; artistProfilePhotoInputRef.current.click(); } }}
                      >
                        <input
                          ref={artistProfilePhotoInputRef}
                          type="file"
                          style={{ display: 'none' }}
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                          onChange={(e) => handlePickAndCrop(e, 1, (file) => setPhotoFile(file))}
                        />
                        {photoFile ? 'New image chosen' : 'Choose photo'}
                      </button>
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
                      <button
                        type="button"
                        className="profile-edit-file-btn upload-trigger-btn"
                        style={{ width: 'auto' }}
                        onClick={() => { if (artistBannerPhotoInputRef.current) { artistBannerPhotoInputRef.current.value = ''; artistBannerPhotoInputRef.current.click(); } }}
                      >
                        <input
                          ref={artistBannerPhotoInputRef}
                          type="file"
                          style={{ display: 'none' }}
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                          onChange={(e) => handlePickAndCrop(e, 16 / 9, (file) => setBgFile(file))}
                        />
                        {bgFile ? 'New image chosen' : 'Choose photo'}
                      </button>
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
                    <PhoneINInput
                      value={formData.phone}
                      onChange={(v) => setFormData((prev) => ({ ...prev, phone: v }))}
                    />
                  </div>
                  <div className="profile-edit-field">
                    <label>Website</label>
                    <input name="website" type="url" value={formData.website} onChange={handleInputChange} placeholder="https://" />
                  </div>
                  <div className="profile-edit-field">
                    <label>WhatsApp</label>
                    <PhoneINInput
                      value={toINFullPhone(getINDisplayDigitsFromWhatsAppStored(formData.whatsapp))}
                      onChange={(v) =>
                        setFormData((prev) => ({ ...prev, whatsapp: toWhatsAppUrlFromINPhone(v) }))
                      }
                      placeholder="10-digit mobile"
                    />
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
                      <button
                        type="button"
                        className="profile-edit-gallery-add-btn upload-trigger-btn"
                        style={{ width: 'auto' }}
                        onClick={() => { if (artistGalleryAddInputRef.current) { artistGalleryAddInputRef.current.value = ''; artistGalleryAddInputRef.current.click(); } }}
                      >
                        <input
                          ref={artistGalleryAddInputRef}
                          type="file"
                          style={{ display: 'none' }}
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                          onChange={(e) => handlePickAndCrop(e, 2, (file) => setNewGalleryFile(file))}
                        />
                        {galleryUploading ? 'Uploading…' : (newGalleryFile ? 'Image ready' : 'Pick Image')}
                      </button>
                      <button type="button" onClick={addGalleryItem} disabled={!newGalleryFile || galleryUploading} className="profile-edit-gallery-add-btn">
                        Add to slideshow
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
                    {(selected.images || []).slice(0, 3).map((img, i) => (
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

      {cropper.open && (
         <div style={{ position: 'fixed', inset: 0, zIndex: 1000000 }}>
           <ImageCropperModal
             image={cropper.image}
             aspect={cropper.aspect}
             onSave={cropper.onComplete}
             onCancel={cropper.onCancel}
           />
         </div>
       )}
    </div >
  );
}

export default Profile;

