/**
 * ProfileHelpers.js
 * Utility constants, helper functions, and small presentational sub-components
 * extracted from Profile.js to keep the main controller lean.
 */
import React, { useState, useCallback } from 'react';
import { pdfjs } from 'react-pdf';
import getCroppedImg from '../utils/cropImage';
import { getINDisplayDigits, toINFullPhone } from '../utils/indianPhone';

const RENDERABLE_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/gif', 'image/svg+xml', 'image/bmp', 'image/tiff',
  'image/avif', 'image/heic', 'image/heif',
]);

const RAW_EXTENSIONS = /\.(arw|cr2|cr3|nef|nrw|orf|raf|rw2|dng|pef|srw|x3f|3fr|fff|iiq|rwl|mef|mrw|erf)$/i;


// ─────────────────────────────────────────────────────────────────────────────
// PDF Worker
// ─────────────────────────────────────────────────────────────────────────────
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ─────────────────────────────────────────────────────────────────────────────
// Storage Keys
// ─────────────────────────────────────────────────────────────────────────────
export const PROFILE_MODE_KEY = 'profile_mode';
export const PROFILE_LOCK_KEY = 'profile_type_lock';
export const RESTAURANT_STORAGE_KEY = 'restaurant_profile';
export const RESTAURANT_ONBOARDING_KEY = 'restaurant_onboarding_step';
export const GENERAL_FLOW_MODE_KEY = 'general_flow_mode';
export const PROFILE_PREF_BY_EMAIL_KEY = 'profile_pref_by_email_v1';
export const MAX_PLATFORM_LINKS = 50;
export const SMART_PLATFORMS = ['whatsapp', 'telegram', 'instagram', 'twitter', 'tiktok', 'snapchat', 'threads'];

// ─────────────────────────────────────────────────────────────────────────────
// Default Form
// ─────────────────────────────────────────────────────────────────────────────
export const defaultForm = {
  artistId: '',
  name: '',
  bio: '',
  specialization: '',
  experience: '',
  city: '',
  state: '',
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

// ─────────────────────────────────────────────────────────────────────────────
// Platform List
// ─────────────────────────────────────────────────────────────────────────────
export const ALL_PLATFORMS = [
  { id: 'instagram',   label: 'Instagram',    description: 'Display your posts and reels',            color: '#E1306C', gradient: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' },
  { id: 'whatsapp',   label: 'WhatsApp',     description: 'Let people message you directly',          color: '#25D366', gradient: 'linear-gradient(135deg, #25D366, #128C7E)' },
  { id: 'youtube',    label: 'YouTube',      description: 'Share your videos and channel',            color: '#FF0000', gradient: 'linear-gradient(135deg, #FF0000, #cc0000)' },
  { id: 'tiktok',     label: 'TikTok',       description: 'Share your TikToks and viral content',     color: '#010101', gradient: 'linear-gradient(135deg, #010101, #69C9D0)' },
  { id: 'spotify',    label: 'Spotify',      description: 'Share your latest or favorite music',      color: '#1DB954', gradient: 'linear-gradient(135deg, #1DB954, #158a3e)' },
  { id: 'facebook',   label: 'Facebook',     description: 'Connect via your Facebook profile',        color: '#1877F2', gradient: 'linear-gradient(135deg, #1877F2, #0d5bba)' },
  { id: 'twitter',    label: 'X (Twitter)',  description: 'Share thoughts and connect on X',          color: '#000000', gradient: 'linear-gradient(135deg, #000000, #333333)' },
  { id: 'linkedin',   label: 'LinkedIn',     description: 'Showcase your professional profile',       color: '#0A66C2', gradient: 'linear-gradient(135deg, #0A66C2, #084d91)' },
  { id: 'telegram',   label: 'Telegram',     description: 'Connect via Telegram messenger',           color: '#229ED9', gradient: 'linear-gradient(135deg, #229ED9, #1a7fad)' },
  { id: 'snapchat',   label: 'Snapchat',     description: 'Connect on Snapchat',                      color: '#FFFC00', gradient: 'linear-gradient(135deg, #FFFC00, #e6e300)' },
  { id: 'discord',    label: 'Discord',      description: 'Join your community or server',            color: '#5865F2', gradient: 'linear-gradient(135deg, #5865F2, #4050d4)' },
  { id: 'threads',    label: 'Threads',      description: 'Share updates on Threads by Meta',         color: '#000000', gradient: 'linear-gradient(135deg, #000000, #444)' },
  { id: 'pinterest',  label: 'Pinterest',    description: 'Share your pins and boards',               color: '#E60023', gradient: 'linear-gradient(135deg, #E60023, #ad001a)' },
  { id: 'github',     label: 'GitHub',       description: 'Show off your code and projects',          color: '#24292e', gradient: 'linear-gradient(135deg, #24292e, #4a5568)' },
  { id: 'twitch',     label: 'Twitch',       description: 'Link your live streams and content',       color: '#9146FF', gradient: 'linear-gradient(135deg, #9146FF, #6d28d9)' },
  { id: 'reddit',     label: 'Reddit',       description: 'Connect via your Reddit profile',          color: '#FF4500', gradient: 'linear-gradient(135deg, #FF4500, #cc3700)' },
  { id: 'medium',     label: 'Medium',       description: 'Share your articles and stories',          color: '#00ab6c', gradient: 'linear-gradient(135deg, #00ab6c, #008a57)' },
  { id: 'google_maps',label: 'Google Maps',  description: 'Share your location with visitors',        color: '#4285F4', gradient: 'linear-gradient(135deg, #4285F4, #EA4335)' },
  { id: 'website',    label: 'Website',      description: 'Link to your personal website',            color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  { id: 'portfolio',  label: 'Portfolio',    description: 'Showcase your work and projects',          color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { id: 'quora',      label: 'Quora',        description: 'Share knowledge on Quora',                 color: '#a82400', gradient: 'linear-gradient(135deg, #a82400, #cc2e00)' },
  { id: 'tumblr',     label: 'Tumblr',       description: 'Share your blog and creative content',     color: '#35465c', gradient: 'linear-gradient(135deg, #35465c, #4a637f)' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

export function getStoredValue(user, key, defaultValue = null) {
  if (!user) return defaultValue;
  const identifier = user.email || user.uid;
  try {
    const val = localStorage.getItem(`nano_${identifier}_${key}`);
    return val !== null ? val : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export function setStoredValue(user, key, value) {
  if (!user) return;
  const identifier = user.email || user.uid;
  try {
    localStorage.setItem(`nano_${identifier}_${key}`, value);
  } catch (e) {}
}

export function removeStoredValue(user, key) {
  if (!user) return;
  const identifier = user.email || user.uid;
  try {
    localStorage.removeItem(`nano_${identifier}_${key}`);
  } catch (e) {}
}

/** Link title sent to API / shown on public page — avoids e.g. Google_maps from raw keys. */
export function titleForRestaurantLinkPlatform(platformKey) {
  const k = String(platformKey || '');
  const meta = ALL_PLATFORMS.find((p) => p.id === k);
  if (meta) return meta.label;
  return k
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function buildLinkUrl(platform, link) {
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

export function parseLinkFromUrl(link) {
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

export function extractPhoneFromBioString(bioString) {
  if (!bioString) return '';
  const m = bioString.match(/📞\s*([+\d][\d\s()-]{8,})/i) || bioString.match(/([+\d][\d\s()-]{10,})/);
  return m?.[1]?.trim() || '';
}

export function extractEmailFromBioString(bioString) {
  if (!bioString) return '';
  const m = bioString.match(/✉\s*([^\s]+)/i) || bioString.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
  return m?.[1]?.trim() || '';
}

export function stripPhoneEmailLinesFromBioString(bioString) {
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

export function mergeGeneralBioForSave(form) {
  // We no longer need to append phone/email to bio as they have dedicated fields now.
  return stripPhoneEmailLinesFromBioString(form.bio || '');
}

export function buildGeneralFormFromProfileData(data) {
  const rawBio = data.bio || '';
  const cleanedBio = stripPhoneEmailLinesFromBioString(rawBio);
  const phone = data.phone || extractPhoneFromBioString(rawBio);
  const email = data.email || extractEmailFromBioString(rawBio);
  return {
    username: data.username || '',
    name: data.name || '',
    title: data.title || '',
    bio: cleanedBio,
    phone: toINFullPhone(getINDisplayDigits(phone)) || '',
    email: email || '',
    photo: data.photo || '',
    banner: data.banner || '',
    theme: data.theme || 'mint',
    font: data.font || 'outfit',
    links: (data.links && data.links.length) ? data.links.map(parseLinkFromUrl) : [],
    gallery: data.gallery || [],
    suggestionsTitle: data.suggestionsTitle || 'Suggestions',
    suggestions: data.suggestions || [],
    showEmail: data.showEmail !== false,
    showPhone: data.showPhone !== false,
    city: data.city || '',
    state: data.state || '',
    showLocation: data.showLocation !== false,
    specialization: data.specialization || ''
  };
}

/** Normalize photo upload JSON (artist/general share the same upload route). */
export function extractUploadUrl(up) {
  if (!up || typeof up !== 'object') return '';
  return (
    up.url ||
    up.secure_url ||
    (up.data && (up.data.url || up.data.secure_url)) ||
    ''
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small Sub-Components
// ─────────────────────────────────────────────────────────────────────────────

export function PremiumToggle({ checked, onChange, disabled }) {
  return (
    <label style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
      userSelect: 'none'
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{
          opacity: 0,
          width: 0,
          height: 0,
          position: 'absolute'
        }}
      />
      <div style={{
        width: '40px',
        height: '22px',
        backgroundColor: checked ? '#10b981' : '#cbd5e1',
        borderRadius: '100px',
        position: 'relative',
        transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: '16px',
          height: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          position: 'absolute',
          top: '3px',
          left: checked ? '21px' : '3px',
          transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} />
      </div>
    </label>
  );
}

/** Shown on phone preview and hero while banner/cover is uploading and live iframe has not refreshed yet. */
export function LivePreviewSyncOverlay({ show, message = 'Uploading banner…' }) {
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
export function RestaurantPublicPreviewIframe({ username, previewKey, bannerSyncing }) {
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
      />
      <LivePreviewSyncOverlay show={!!bannerSyncing} message="Uploading banner…" />
    </div>
  );
}

/** Loading screen shared between modes */
export function ProfileLoadingScreen({ message = 'Loading dashboard...', subtext = 'nano is here' }) {
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Hook: useImageCropper
// ─────────────────────────────────────────────────────────────────────────────
export function useImageCropper(setError) {
  const [cropper, setCropper] = useState({
    open: false,
    image: null,
    aspect: 1,
    onComplete: null,
    onCancel: null
  });

  const getFileAfterCropOrPassThrough = useCallback((file, aspect) => {
    if (file.type === 'image/gif') {
      return Promise.resolve(file);
    }
    return new Promise((resolve, reject) => {
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

  const handlePickAndCrop = useCallback((e, aspect, onCroppedDone) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (RAW_EXTENSIONS.test(file.name)) {
      if (setError) setError(`Camera RAW files (like .ARW, .CR2, .NEF) cannot be used directly. Please convert to JPEG or PNG.`);
      return;
    }
    if (file.type && !RENDERABLE_IMAGE_TYPES.has(file.type.toLowerCase())) {
      if (setError) setError(`"${file.name}" is not a supported image format.`);
      return;
    }

    getFileAfterCropOrPassThrough(file, aspect)
      .then(onCroppedDone)
      .catch((err) => {
        if (err?.message !== 'CROP_CANCEL') console.error(err);
      });
  }, [getFileAfterCropOrPassThrough, setError]);

  const handlePickAndCropBatch = useCallback(async (e, aspect, onCroppedDone) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';

    for (const file of files) {
      if (RAW_EXTENSIONS.test(file.name)) {
        if (setError) setError(`"${file.name}" is a RAW camera file which is not supported. Please convert it to JPEG/PNG.`);
        continue;
      }
      if (file.type && !RENDERABLE_IMAGE_TYPES.has(file.type.toLowerCase())) {
        continue;
      }
      try {
        const croppedFile = await getFileAfterCropOrPassThrough(file, aspect);
        await onCroppedDone(croppedFile);
      } catch (err) {
        if (err?.message === 'CROP_CANCEL') continue;
        console.error('Batch crop error:', err);
      }
    }
  }, [getFileAfterCropOrPassThrough, setError]);

  return {
    cropper,
    setCropper,
    getFileAfterCropOrPassThrough,
    handlePickAndCrop,
    handlePickAndCropBatch
  };
}
