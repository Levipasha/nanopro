import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIdToken } from '../firebase';
import { generalProfileAPI } from '../services/api';
import ImageCropperModal from '../components/profile/ImageCropperModal';
import ProfileRestaurantOnboarding from './ProfileRestaurantOnboarding';
import ProfileRestaurantDashboard from './ProfileRestaurantDashboard';
import { assertGalleryFileKind, assertVideoMaxDuration } from '../utils/galleryMedia';
import {
  ALL_PLATFORMS,
  PROFILE_LOCK_KEY,
  PROFILE_MODE_KEY,
  RESTAURANT_STORAGE_KEY,
  RESTAURANT_ONBOARDING_KEY,
  GENERAL_FLOW_MODE_KEY,
  extractUploadUrl,
  buildLinkUrl,
  stripPhoneEmailLinesFromBioString,
  extractPhoneFromBioString,
  extractEmailFromBioString,
  titleForRestaurantLinkPlatform,
  SMART_PLATFORMS,
  ProfileLoadingScreen,
  useImageCropper,
  getStoredValue,
  setStoredValue,
  removeStoredValue
} from './ProfileHelpers';

export default function ProfileRestaurantController(props) {
  const { user, handleLogout, isMobileViewport, frontendBase, setProfileMode, setProfileLock, setChoiceSource } = props;
  const navigate = useNavigate();

  const [generalProfile, setGeneralProfile] = useState(null);
  const [generalProfileLoading, setGeneralProfileLoading] = useState(false);
  const [restaurantSaving, setRestaurantSaving] = useState(false);
  const [restaurantChanged, setRestaurantChanged] = useState(false);
  const [artistChanged, setArtistChanged] = useState(false);
  const [error, setError] = useState('');

  // Refs for Restaurant profile onboarding inputs
  const restaurantBannerInputRef = useRef(null);
  const restaurantGalleryInputRef = useRef(null);
  const restaurantMenuInputRef = useRef(null);
  const usernameCheckTimer = useRef(null);
  const restaurantSyncTimerRef = useRef(null);
  const lastRestaurantSyncSigRef = useRef('');
  const restaurantEditInProgressRef = useRef(false);

  // Restaurant profile state (localStorage until backend exists)
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    photo: null,
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
    username: '',
    links: {}
  });

  const [restaurantOnboardingStep, setRestaurantOnboardingStep] = useState(() => {
    try {
      const s = getStoredValue(user, RESTAURANT_ONBOARDING_KEY);
      return s ? parseInt(s, 10) : 1;
    } catch (e) {
      return 1;
    }
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
  
  const [restaurantProfile, setRestaurantProfile] = useState(null);
  const [restaurantGalleryUploading, setRestaurantGalleryUploading] = useState(false);
  const [restaurantBannerUploading, setRestaurantBannerUploading] = useState(false);
  
  const [usernameCheck, setUsernameCheck] = useState({ status: 'idle', msg: '' });
  const [availabilitySuggestions, setAvailabilitySuggestions] = useState([]);
  const [pdfNumPages, setPdfNumPages] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [linkCopiedRest, setLinkCopiedRest] = useState(false);
  const [rLinkEditOpen, setRLinkEditOpen] = useState(false);
  
  const [restaurantBannerFile, setRestaurantBannerFile] = useState(null);
  const [restaurantGalleryFile, setRestaurantGalleryFile] = useState(null);

  // Cropper state using hook
  const { cropper, setCropper, getFileAfterCropOrPassThrough, handlePickAndCrop } = useImageCropper(setError);

  const setupLoader = (
    <span className="onboarding-inline-loader" aria-hidden="true" style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );

  const getFirebaseUser = useCallback(
    () => (user ? { uid: user.uid, email: user.email || null } : null),
    [user]
  );

  // Strip large base64 blobs before persisting
  const persistRestaurant = (profile) => {
    try {
      const MAX_DATA_URL_LENGTH = 1200000;
      const keepDataImage = (v) => typeof v === 'string' && v.startsWith('data:image/') && v.length <= MAX_DATA_URL_LENGTH;
      let previousHttpBanner = '';
      try {
        const rawPrev = getStoredValue(user, RESTAURANT_STORAGE_KEY);
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
        menuPdf: profile.menuPdf && profile.menuPdf.startsWith('http') ? profile.menuPdf : undefined,
        gallery: (profile.gallery || []).map(g => ({
          ...g,
          url: (g.url && g.url.startsWith('http')) ? g.url : (keepDataImage(g.url) ? g.url : undefined),
        })).filter(g => g.url),
      };
      setStoredValue(user, RESTAURANT_STORAGE_KEY, JSON.stringify(safe));
    } catch (e) {
      try {
        const minimal = { ...profile, banner: undefined, menuPdf: undefined, gallery: [] };
        setStoredValue(user, RESTAURANT_STORAGE_KEY, JSON.stringify(minimal));
      } catch (e2) {
        console.warn('Could not persist restaurant profile', e2);
      }
    }
  };

  const updateRestaurantOnboardingStep = (step) => {
    setRestaurantOnboardingStep(step);
    setStoredValue(user, RESTAURANT_ONBOARDING_KEY, step.toString());
  };

  const startRestaurantHeroEdit = (field) => {
    if (!restaurantProfile) return;
    setRHeroEditingField(field);
    if (field === 'name') setRHeroDraftName(restaurantProfile.name || '');
    if (field === 'tagline') setRHeroDraftTagline(restaurantProfile.tagline || '');
  };

  const saveRestaurantHeroEdit = () => {
    if (!restaurantProfile || !rHeroEditingField) return;

    const updated = { ...restaurantProfile };
    if (rHeroEditingField === 'name') updated.name = rHeroDraftName;
    if (rHeroEditingField === 'tagline') updated.tagline = rHeroDraftTagline;

    setRestaurantProfile(updated);
    persistRestaurant(updated);
    setRHeroEditingField(null);
    setRestaurantChanged(true);
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

  const onPdfLoadSuccess = ({ numPages }) => {
    setPdfNumPages(numPages);
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

      let bannerUrl =
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
          bannerUrl = extractUploadUrl(up);
        } catch (e) {
          console.warn('Banner upload failed:', e);
        }
      }

      let photoUrl =
        profileInput.photo && String(profileInput.photo).startsWith('http')
          ? String(profileInput.photo).trim()
          : '';
      if (profileInput.photo && String(profileInput.photo).startsWith('data:')) {
        try {
          const arr = profileInput.photo.split(',');
          const mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/png';
          const bstr = atob(arr[1]);
          const u8arr = new Uint8Array(bstr.length);
          for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
          const file = new File([u8arr], 'photo.png', { type: mime });
          const up = await generalProfileAPI.uploadPhoto(file, getIdTokenFn);
          photoUrl = extractUploadUrl(up);
        } catch (e) {
          console.warn('Photo upload failed:', e);
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
      const rawGallery = Array.isArray(profileInput.gallery) ? profileInput.gallery.slice(0, 4) : [];
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
        title: '',
        bio: bioParts.filter(Boolean).join('\n'),
        phone: profileInput.phone || '',
        email: profileInput.email || user?.email || '',
        photo: photoUrl || undefined,
        banner: bannerUrl || undefined,
        menuPdf: menuPdfUrl || undefined,
        theme: profileInput.theme || 'mint',
        font: profileInput.titleFont || profileInput.font || 'outfit',
        bioFont: profileInput.bodyFont || profileInput.font || 'outfit',
        links,
        gallery: galleryNormalized,
        profileType: 'restaurant',
        isSetup: true
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
      
      return true;
    } catch (err) {
      if (!silent) alert(err.message || 'Failed to publish. Please try again.');
      else console.warn('Restaurant auto-publish failed:', err);
      return false;
    }
  }, [restaurantProfile, user]);

  const saveRestaurantProfile = async () => {
    if (!restaurantForm.name.trim()) {
      alert('Restaurant name is required');
      updateRestaurantOnboardingStep(1);
      return;
    }

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
      setRestaurantProfile(payload);
      const ok = await handleRestaurantPublish(payload, { silent: true });
      if (!ok) throw new Error('Failed to publish restaurant profile');
      removeStoredValue(user, RESTAURANT_ONBOARDING_KEY);
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

  const getProfileLink = () => {
    const username = restaurantProfile?.username || restaurantForm.username || '';
    if (!username) return frontendBase;
    return `${frontendBase}/link/${username}`;
  };



  // Load profile from server
  const loadRestaurantProfile = useCallback(async () => {
    if (!user) return;
    const getIdTokenFn = () => getIdToken();
    const getFirebaseUserFn = getFirebaseUser;
    setGeneralProfileLoading(true);
    try {
      const res = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, 'restaurant');
      let data = res.data || res;
      if (data && data.username) {
        // Auto-initialize if it is an empty profile created via admin panel (e.g. missing name, tagline/title, bio or has no setup status)
        const isEmptyProfile = !data.name && !data.title && !data.bio && (!data.links || data.links.length === 0);
        if (isEmptyProfile || !data.isSetup) {
          console.log("Restaurant profile is uninitialized (created via admin). Auto-initializing with mock data...");
          const base = window.location.origin;
          const initializePayload = {
            name: 'Sakura Kitchen',
            title: '',
            bio: "Authentic Japanese flavors reimagined with local ingredients. From sushi to ramen, every dish tells a story of tradition meeting innovation.\n📞 +9183746501\n✉ SakuraKitchen@mock.com",
            photo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&h=500&fit=crop',
            theme: 'mint',
            font: 'outfit',
            bioFont: 'outfit',
            isSetup: true,
            links: [
              { title: 'Instagram', url: 'https://instagram.com/exampleinsta', platform: 'instagram', order: 0 },
              { title: 'WhatsApp', url: 'https://wa.me/9183746501', platform: 'whatsapp', order: 1 },
              { title: 'Website', url: 'https://example.com', platform: 'website', order: 2 }
            ],
            gallery: [
              { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600', name: 'Interior' },
              { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600', name: 'Dining' }
            ]
          };
          try {
            const updateRes = await generalProfileAPI.update(initializePayload, getIdTokenFn, getFirebaseUserFn);
            data = updateRes.data || updateRes;
          } catch (updateErr) {
            console.error('Failed to auto-populate restaurant profile:', updateErr);
          }
        }

        setGeneralProfile(data);
        const bioRaw = data.bio || '';
        const bio = stripPhoneEmailLinesFromBioString(bioRaw);
        const phone = data.phone || extractPhoneFromBioString(bioRaw) || '';
        const email = data.email || extractEmailFromBioString(bioRaw) || '';

        const linksObj = {};
        if (Array.isArray(data.links)) {
          data.links.forEach(l => {
            if (l.platform) {
              linksObj[l.platform] = l.url;
            }
          });
        }

        const hydrated = {
          ...data,
          bio,
          phone,
          email,
          links: linksObj,
          theme: data.theme || 'mono',
          font: data.font || 'outfit',
          titleFont: data.font || 'outfit',
          bodyFont: data.bioFont || 'outfit',
        };

        setRestaurantProfile(hydrated);
        setRestaurantForm(hydrated);
        persistRestaurant(hydrated);
        lastRestaurantSyncSigRef.current = JSON.stringify(hydrated);
        
        // If step wasn't set, default to dashboard (0)
        setRestaurantOnboardingStep(0);
        setStoredValue(user, RESTAURANT_ONBOARDING_KEY, '0');
      } else {
        // Check for general profile to import base details
        const resGen = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, 'general');
        const genData = resGen?.data || resGen;
        if (genData && genData.username) {
          const linksObj = {};
          if (Array.isArray(genData.links)) {
            genData.links.forEach(l => {
              if (l.platform) linksObj[l.platform] = l.url;
            });
          }
          const bioRaw = genData.bio || '';
          
          setRestaurantForm(prev => ({
            ...prev,
            name: genData.name || '',
            username: genData.username || '',
            tagline: '',
            bio: stripPhoneEmailLinesFromBioString(bioRaw) || '',
            phone: genData.phone || extractPhoneFromBioString(bioRaw) || '',
            email: genData.email || user.email || '',
            links: linksObj,
            theme: genData.theme || 'mono',
            font: genData.font || 'outfit'
          }));
        }
        setRestaurantOnboardingStep(1);
      }
    } catch (err) {
      console.warn('Restaurant profile load failed:', err.message);
      setRestaurantOnboardingStep(1);
    } finally {
      setGeneralProfileLoading(false);
    }
  }, [user, getFirebaseUser]);

  useLayoutEffect(() => {
    if (user) {
      loadRestaurantProfile();
    }
  }, [user, loadRestaurantProfile]);

  // Sync profile logic
  useEffect(() => {
    const isLoggedIn = !!user;
    if (!isLoggedIn || restaurantOnboardingStep !== 0 || !restaurantProfile) return undefined;

    let signature = '';
    try { signature = JSON.stringify(restaurantProfile); } catch (e) { return undefined; }
    if (!signature || signature === lastRestaurantSyncSigRef.current) return undefined;

    if (restaurantSyncTimerRef.current) clearTimeout(restaurantSyncTimerRef.current);
    restaurantSyncTimerRef.current = setTimeout(async () => {
      const ok = await handleRestaurantPublish(restaurantProfile, { silent: true });
      if (ok) lastRestaurantSyncSigRef.current = signature;
    }, 4000);

    return () => {
      if (restaurantSyncTimerRef.current) clearTimeout(restaurantSyncTimerRef.current);
    };
  }, [user, restaurantProfile, restaurantOnboardingStep, handleRestaurantPublish]);

  const displayName = user?.displayName || user?.email || 'Profile';
  const displayEmail = user?.email || '';
  const avatarLetter = user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?';

  if (generalProfileLoading) {
    return <ProfileLoadingScreen message="Loading Restaurant Dashboard..." />;
  }

  const restProps = {
    user,
    displayName,
    displayEmail,
    avatarLetter,
    handleLogout,
    cropper,
    setCropper,
    isMobileViewport,
    error,
    loading: generalProfileLoading,
    previewKey,
    setPreviewKey,
    frontendBase,
    isRestaurantMode: true,
    isLoggedIn: !!user,
    setProfileMode,
    setProfileLock,
    setChoiceSource,
    restaurantProfile,
    setRestaurantProfile,
    restaurantOnboardingStep,
    updateRestaurantOnboardingStep,
    restaurantActiveTab,
    setRestaurantActiveTab,
    restaurantSaving,
    setRestaurantSaving,
    restaurantChanged,
    setRestaurantChanged,
    restaurantGalleryUploading,
    setRestaurantGalleryUploading,
    restaurantBannerUploading,
    setRestaurantBannerUploading,
    rBioEditing,
    setRBioEditing,
    rBioDraft,
    setRBioDraft,
    rHeroEditingField,
    setRHeroEditingField,
    rHeroDraftName,
    setRHeroDraftName,
    rHeroDraftTagline,
    setRHeroDraftTagline,
    rLinkSelectorOpen,
    setRLinkSelectorOpen,
    rTempPlatforms,
    setRTempPlatforms,
    rSyncFonts,
    setRSyncFonts,
    saveRestaurantProfile,
    handleRestaurantPublish,
    handlePdfUpload,
    handleRestaurantBannerUpload,
    handleRestaurantBannerChangeDashboard,
    pdfNumPages,
    setPdfNumPages,
    onPdfLoadSuccess,
    restaurantForm,
    setRestaurantForm,
    startRestaurantHeroEdit,
    persistRestaurant,
    linkCopiedRest,
    setLinkCopiedRest,
    handleUpdateHeroFieldRest: () => {},
    rLinkEditOpen,
    setRLinkEditOpen,
    restaurantBannerFile,
    restaurantGalleryFile,
    setupLoader,
    getProfileLink,
    artistChanged,
    setArtistChanged,
    removePdf,
    getFileAfterCropOrPassThrough,
    handlePickAndCrop,
    
    // Pass references to DOM inputs
    restaurantBannerInputRef,
    restaurantGalleryInputRef,
    restaurantMenuInputRef,
    usernameCheckTimer,
    usernameCheck,
    setUsernameCheck,
    availabilitySuggestions,
    setAvailabilitySuggestions
  };

  if (restaurantOnboardingStep > 0) {
    return <ProfileRestaurantOnboarding {...restProps} />;
  }

  return <ProfileRestaurantDashboard {...restProps} />;
}
