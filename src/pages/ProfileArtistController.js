import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, logout, getIdToken } from '../firebase';
import { landingArtistAPI } from '../services/api';
import ImageCropperModal from '../components/profile/ImageCropperModal';
import ProfileArtistOnboardingWizard from '../components/profile/ProfileArtistOnboardingWizard';
import ProfileArtistDashboard from './ProfileArtistDashboard';

import {
  ALL_PLATFORMS,
  defaultForm,
  PROFILE_LOCK_KEY,
  PROFILE_MODE_KEY,
  extractUploadUrl,
  MAX_PLATFORM_LINKS,
  useImageCropper,
  getStoredValue,
  setStoredValue,
  removeStoredValue
} from './ProfileHelpers';

export default function ProfileArtistController(props) {
  const { user, handleLogout, isMobileViewport, frontendBase, setProfileMode, setProfileLock, setChoiceSource } = props;
  const navigate = useNavigate();

  const [formData, setFormData] = useState(defaultForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [bgFile, setBgFile] = useState(null);

  const [onboardingPlatforms, setOnboardingPlatforms] = useState([]);
  const [isOnboardingSelectorOpen, setIsOnboardingSelectorOpen] = useState(false);
  const [visiblePlatforms, setVisiblePlatforms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [myArtists, setMyArtists] = useState([]);
  const [linkCopiedArtist, setLinkCopiedArtist] = useState(false);
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [error, setError] = useState('');

  // States for Image Cropper using the custom hook
  const { cropper, setCropper, getFileAfterCropOrPassThrough, handlePickAndCrop, handlePickAndCropBatch } = useImageCropper(setError);
  const [inlineEditing, setInlineEditing] = useState(null); // { platformId, field: 'title' | 'value' }
  const [inlineEditValue, setInlineEditValue] = useState('');
  const [artistListReady, setArtistListReady] = useState(false);

  const [artQrModal, setArtQrModal] = useState(null); // { url, title }

  // Dashboard customization state
  const [activeTab, setActiveTab] = useState('profiles'); // 'profiles' | 'design' | 'preview' | 'link-art'
  const [activeEditor, setActiveEditor] = useState('default'); // 'default' | 'name' | 'location' | 'tags' | 'photo' | 'about' | 'platforms' | 'gallery' | 'design' | 'what-i-do'
  const [dashTheme] = useState(() => localStorage.getItem('dash_theme') || 'aura');
  const [dashFont] = useState(() => localStorage.getItem('dash_font') || 'outfit');
  const [openSubPanel, setOpenSubPanel] = useState({}); // tracks open panel ('prioritize', 'schedule', 'lock') per platform ID
  const [layoutActiveTab, setLayoutActiveTab] = useState({}); // tracks active tab ('settings' | 'layout') per platform ID
  const [designSubTab, setDesignSubTab] = useState(null); // null | 'theme' | 'font' (used for artist design)
  
  // Link Your Art tab state
  const [newArtTheme, setNewArtTheme] = useState('painting');
  const [artSaving, setArtSaving] = useState(false);
  const [artImagePreview, setArtImagePreview] = useState([]); // [{ file, url }, ...] for new art upload
  const [showArtGallery, setShowArtGallery] = useState(false);
  const [artGallerySelectedItem, setArtGallerySelectedItem] = useState(null);

  const [onboardingStep, setOnboardingStep] = useState(() => {
    return parseInt(getStoredValue(user, 'onboarding_step')) || 0;
  });

  const updateOnboardingStep = (step) => {
    setOnboardingStep(step);
    setStoredValue(user, 'onboarding_step', step.toString());
  };

  const getFirebaseUser = useCallback(
    () => (user ? { uid: user.uid, email: user.email || null } : null),
    [user]
  );

  const loadMyProfiles = useCallback(async () => {
    if (!user) return;
    setArtistsLoading(true);
    try {
      const res = await landingArtistAPI.getMyProfiles(() => getIdToken(), getFirebaseUser);
      const profiles = res.data || (Array.isArray(res) ? res : []);
      if (profiles && profiles.length > 0) {
        const data = profiles[0];
        const isEmptyProfile = !data.name && !data.experience && !data.bio && (!data.links || data.links.length === 0);
        if (isEmptyProfile || !data.isSetup) {
          console.log("Artist profile is uninitialized (created via admin). Auto-initializing with mock data...");
          const base = window.location.origin;
          const initializePayload = {
            name: 'Ananya Verma',
            specialization: 'Visual Arts, Sketching, Mandalas',
            experience: 'Visual Artist & Illustrator',
            bio: 'Indian Visual Artist & Illustrator. Combining traditional Indian folk art styles with modern digital illustrations. Curator of color, storytelling, and cultural aesthetics.',
            phone: '+919876543210',
            email: user?.email || data.email || '',
            photo: `${base}/indian_artist_avatar.png`,
            backgroundPhoto: `${base}/mock_art_folk.png`,
            profileTheme: 'mono',
            isSetup: true,
            showPhoto: true,
            showName: true,
            showLocation: true,
            showSpecialization: true,
            showAbout: true,
            showConnect: true,
            showWhatIDo: true,
            showArtPortfolio: true,
            showGallery: true,
            links: [
              { title: 'Instagram', platform: 'instagram', url: 'https://instagram.com/ananyaverma_art', order: 0 },
              { title: 'Pinterest', platform: 'pinterest', url: 'https://pinterest.com/ananyaverma_art', order: 1 },
              { title: 'WhatsApp', platform: 'whatsapp', url: 'https://wa.me/919876543210', order: 2 }
            ],
            gallery: [
              { name: 'Mystic Mandalas', url: `${base}/mock_art_mandala.png`, link: 'https://example.com/mystic-mandalas' },
              { name: 'Royal Rajasthan', url: `${base}/mock_art_folk.png`, link: 'https://example.com/royal-rajasthan' }
            ],
            artLinks: [
              {
                id: Date.now() - 1000,
                title: 'Traditional Folk Illustrations',
                description: 'Custom canvas paintings and digital illustrations inspired by traditional Indian folk art forms like Madhubani and Gond art.',
                theme: 'classic',
                images: [],
                itemType: 'artwork'
              },
              {
                id: Date.now(),
                title: 'Handmade Mandala Designs',
                description: 'Intricate handmade mandala designs for home decor, wall art, and custom tattooing.',
                theme: 'painting',
                images: [],
                itemType: 'artwork'
              }
            ]
          };
          try {
            const updateRes = await landingArtistAPI.updateMyProfile(data._id || data.artistId, initializePayload, () => getIdToken(), getFirebaseUser);
            setMyArtists([updateRes.data || updateRes]);
          } catch (updateErr) {
            console.error('Failed to auto-populate artist profile:', updateErr);
            setMyArtists(profiles);
          }
        } else {
          setMyArtists(profiles);
        }
      } else {
        setMyArtists([]);
      }
    } catch (err) {
      console.warn('Artist profiles load:', err.message);
      setMyArtists([]);
    } finally {
      setArtistsLoading(false);
      setArtistListReady(true);
    }
  }, [user, getFirebaseUser]);

  // Load profiles on mount/user change
  useEffect(() => {
    if (user) {
      loadMyProfiles();
    }
  }, [user, loadMyProfiles]);

  const [previewKey, setPreviewKey] = useState(0);
  const [artistChanged, setArtistChanged] = useState(false);
  const [mobileHeroEditField, setMobileHeroEditField] = useState(null); // 'name' | 'specialization'
  const [mobileLinkEditPlatform, setMobileLinkEditPlatform] = useState(null); // platform ID
  const [mobileLinkEditId, setMobileLinkEditId] = useState(null); // specific link _id
  const [mobileLinkEditLabel, setMobileLinkEditLabel] = useState('');
  const [mobileLinkEditValue, setMobileLinkEditValue] = useState('');
  const [mobileLinkEditMode, setMobileLinkEditMode] = useState('value'); // 'value' | 'title'
  const [mobileHeroDraft, setMobileHeroDraft] = useState('');
  const [isUploading, setIsUploading] = useState(null); // 'photo' | 'backgroundPhoto' | 'gallery_add'

  const [savingLink, setSavingLink] = useState(null);
  const [pendingLinks, setPendingLinks] = useState({});
  const [editingHeroField, setEditingHeroField] = useState(null);
  const [heroUpdates, setHeroUpdates] = useState({});
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [tempPlatforms, setTempPlatforms] = useState([]);
  const [syncFonts, setSyncFonts] = useState(true);
  const [loadedArtistId, setLoadedArtistId] = useState(null);


  useEffect(() => {
    document.body.classList.toggle('dash-platform-selector-open', !!isSelectorOpen);
    document.documentElement.classList.toggle('dash-platform-selector-open', !!isSelectorOpen);
    return () => {
      document.body.classList.remove('dash-platform-selector-open');
      document.documentElement.classList.remove('dash-platform-selector-open');
    };
  }, [isSelectorOpen]);

  useEffect(() => {
    if (!myArtists || myArtists.length === 0) return;
    const artist = myArtists[0];
    if (artist && artist.artistId !== loadedArtistId) {
      const isNonEmpty = (v) => {
        if (v === undefined || v === null) return false;
        if (typeof v === 'string') return v.trim() !== '';
        return true;
      };
      const active = ALL_PLATFORMS
        .filter((p) =>
          isNonEmpty(artist[p.id]) ||
          (Array.isArray(artist.links) && artist.links.some(l => (l.platform || '').toLowerCase() === p.id.toLowerCase()))
        )
        .map((p) => p.id);
      setVisiblePlatforms(active);
      setLoadedArtistId(artist.artistId);
    }
  }, [myArtists, loadedArtistId]);

  useEffect(() => {
    if (isMobileViewport) {
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

  useLayoutEffect(() => {
    if (onboardingStep !== 0) return;
    if (!artistListReady) return;

    const first = myArtists[0];
    if (first?.isSetup === true) return;

    updateOnboardingStep(0);
    setFormData(prev => ({
      ...prev,
      name: first?.name || user?.displayName || user?.email?.split('@')[0] || '',
      email: first?.email || user?.email || ''
    }));
  }, [myArtists, onboardingStep, artistListReady, user]);

  useEffect(() => {
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
  }, [user?.email, user?.displayName, onboardingStep]);



  const handleUpdateLink = async (platform, value, linkId = null) => {
    const artist = myArtists[0];
    if (!artist) return;
    setSavingLink(linkId || platform);
    try {
      let finalValue = value;
      if (platform === 'whatsapp' && value && !value.includes('http')) {
        const cleanNumber = value.replace('+', '').replace(/\s/g, '');
        finalValue = `https://wa.me/${cleanNumber}`;
      }

      const existingLinks = Array.isArray(artist.links) ? [...artist.links] : [];
      const isFirstInstance = linkId
        ? existingLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase()) === existingLinks.findIndex(l => String(l._id) === String(linkId))
        : true;

      const payload = {};
      if (isFirstInstance) {
        payload[platform] = finalValue;
      }

      let updatedLinks = [];
      if (finalValue === null || (typeof finalValue === 'string' && finalValue.trim() === '')) {
        if (linkId) {
          updatedLinks = existingLinks.filter(l => String(l._id) !== String(linkId));
        } else {
          updatedLinks = existingLinks.filter(l => (l.platform || '').toLowerCase() !== platform.toLowerCase());
        }
        const hasRemaining = updatedLinks.some(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
        if (!hasRemaining) {
          setVisiblePlatforms(prev => prev.filter(p => p !== platform));
        }
      } else {
        let idx = -1;
        if (linkId) {
          idx = existingLinks.findIndex(l => String(l._id) === String(linkId));
        } else {
          idx = existingLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
        }

        const platformObj = ALL_PLATFORMS.find(p => p.id === platform);
        const existingTitle = idx > -1 ? existingLinks[idx].title : null;
        const existingImage = idx > -1 ? existingLinks[idx].image : null;
        const newLink = {
          ...(idx > -1 ? existingLinks[idx] : {}),
          platform,
          url: finalValue,
          title: existingTitle || (platformObj ? platformObj.label : platform.charAt(0).toUpperCase() + platform.slice(1)),
          image: existingImage,
          order: idx > -1 ? (existingLinks[idx].order || 0) : existingLinks.length
        };

        if (idx > -1) {
          existingLinks[idx] = newLink;
          updatedLinks = existingLinks;
        } else {
          updatedLinks = [...existingLinks, newLink];
        }
      }
      payload.links = updatedLinks;

      const res = await landingArtistAPI.updateMyProfile(
        artist._id || artist.artistId,
        payload,
        () => getIdToken(),
        getFirebaseUser
      );

      if (res && res.success === false) {
        throw new Error(res.message || 'The server rejected this update.');
      }

      setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, ...res.data } : a));
      setPendingLinks(prev => {
        const next = { ...prev };
        delete next[linkId || platform];
        return next;
      });
    } catch (err) {
      console.error('Failed to update link:', err);
      window.alert('Failed to save link. Please try again.');
    } finally {
      setSavingLink(null);
    }
  };

  const handleUpdateHeroField = async (field, value, extraPayload = {}) => {
    const artist = myArtists[0];
    if (!artist) return;
    setSavingLink(field);
    try {
      const payload = { [field]: value, ...extraPayload };
      await landingArtistAPI.updateMyProfile(artist._id || artist.artistId, payload, () => getIdToken(), getFirebaseUser);
      setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, ...payload } : a));
      setEditingHeroField(null);
      setHeroUpdates(prev => {
        const next = { ...prev };
        Object.keys(payload).forEach(k => delete next[k]);
        return next;
      });
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
    } finally {
      setSavingLink(null);
    }
  };

  const handleAddTag = async (tagText) => {
    const artist = myArtists[0];
    if (!artist || !tagText.trim()) return;
    const cleanTag = tagText.trim().replace(/,/g, '');
    if (!cleanTag) return;

    const currentTags = artist.specialization
      ? artist.specialization.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    if (currentTags.includes(cleanTag)) {
      setIsAddingTag(false);
      return;
    }

    const updatedTags = [...currentTags, cleanTag];
    await handleUpdateHeroField('specialization', updatedTags.join(','));
    setIsAddingTag(false);
    setNewTagText('');
  };

  const handleDeleteTag = async (tagToDelete) => {
    const artist = myArtists[0];
    if (!artist) return;

    const currentTags = artist.specialization
      ? artist.specialization.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const updatedTags = currentTags.filter(t => t !== tagToDelete);
    await handleUpdateHeroField('specialization', updatedTags.join(','));
  };

  const openHeroEditor = (field, artist) => {
    if (field === 'name' || field === 'specialization' || field === 'experience') {
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

  const handleUpdateLinkLabel = async (platform, newLabel, linkId = null) => {
    const artist = myArtists[0];
    if (!artist) return;
    setSavingLink(linkId || platform);
    try {
      const existingLinks = Array.isArray(artist.links) ? [...artist.links] : [];
      let idx = -1;
      if (linkId) {
        idx = existingLinks.findIndex(l => String(l._id) === String(linkId));
      } else {
        idx = existingLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
      }

      if (idx > -1) {
        existingLinks[idx] = {
          ...existingLinks[idx],
          title: newLabel
        };
      } else {
        const platformObj = ALL_PLATFORMS.find(p => p.id === platform);
        existingLinks.push({
          platform,
          url: artist[platform] || '',
          title: newLabel,
          order: existingLinks.length
        });
      }

      const payload = { links: existingLinks };
      const res = await landingArtistAPI.updateMyProfile(
        artist._id || artist.artistId,
        payload,
        () => getIdToken(),
        getFirebaseUser
      );

      if (res && res.success === false) {
        throw new Error(res.message || 'The server rejected this update.');
      }

      setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, ...res.data } : a));
    } catch (err) {
      console.error('Failed to update link label:', err);
      alert(err.message || 'Failed to update platform label. Please try again.');
    } finally {
      setSavingLink(null);
    }
  };

  const openLinkPopup = (platform, label, value, mode = 'value', linkId = null) => {
    setMobileLinkEditPlatform(platform);
    setMobileLinkEditLabel(label);
    setMobileLinkEditValue(value || '');
    setMobileLinkEditMode(mode);
    setMobileLinkEditId(linkId);
  };

  const saveMobileLinkField = async () => {
    if (!mobileLinkEditPlatform) return;
    if (mobileLinkEditMode === 'title') {
      await handleUpdateLinkLabel(mobileLinkEditPlatform, mobileLinkEditValue, mobileLinkEditId);
    } else {
      await handleUpdateLink(mobileLinkEditPlatform, mobileLinkEditValue, mobileLinkEditId);
    }
    setMobileLinkEditPlatform(null);
    setMobileLinkEditId(null);
  };

  const handleUpdateLinkImage = async (platform, file, linkId = null) => {
    const artist = myArtists[0];
    if (!artist || !file) return;
    setSavingLink(linkId || platform);
    try {
      const token = await getIdToken();
      const up = await landingArtistAPI.uploadPhoto(file, token);
      const uploadedUrl = extractUploadUrl(up);
      
      if (!uploadedUrl) {
        throw new Error('Upload did not return an image URL. Try again.');
      }

      const existingLinks = Array.isArray(artist.links) ? [...artist.links] : [];
      let idx = -1;
      if (linkId) {
        idx = existingLinks.findIndex(l => String(l._id) === String(linkId));
      } else {
        idx = existingLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
      }
      
      if (idx > -1) {
        existingLinks[idx] = {
          ...existingLinks[idx],
          image: uploadedUrl
        };
      } else {
        const platformObj = ALL_PLATFORMS.find(p => p.id === platform);
        existingLinks.push({
          platform,
          url: artist[platform] || '',
          title: platformObj ? platformObj.label : platform.charAt(0).toUpperCase() + platform.slice(1),
          image: uploadedUrl,
          order: existingLinks.length
        });
      }

      const payload = { links: existingLinks };
      const res = await landingArtistAPI.updateMyProfile(artist._id || artist.artistId, payload, () => getIdToken(), getFirebaseUser);
      setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, ...res.data } : a));
    } catch (err) {
      console.error('Failed to update link image:', err);
      alert(err.message || 'Failed to update link image. Please try again.');
    } finally {
      setSavingLink(null);
    }
  };

  const handleRemoveLinkImage = async (platform, linkId = null) => {
    const artist = myArtists[0];
    if (!artist) return;
    setSavingLink(linkId || platform);
    try {
      const existingLinks = Array.isArray(artist.links) ? [...artist.links] : [];
      let idx = -1;
      if (linkId) {
        idx = existingLinks.findIndex(l => String(l._id) === String(linkId));
      } else {
        idx = existingLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
      }
      
      if (idx > -1) {
        existingLinks[idx] = {
          ...existingLinks[idx],
          image: null
        };
        const payload = { links: existingLinks };
        const res = await landingArtistAPI.updateMyProfile(artist._id || artist.artistId, payload, () => getIdToken(), getFirebaseUser);
        setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, ...res.data } : a));
      }
    } catch (err) {
      console.error('Failed to remove link image:', err);
      alert(err.message || 'Failed to remove link image. Please try again.');
    } finally {
      setSavingLink(null);
    }
  };

  const handleUpdateLinkLayout = async (platform, layoutType, linkId = null) => {
    const artist = myArtists[0];
    if (!artist) return;
    setSavingLink(linkId || platform);
    try {
      const existingLinks = Array.isArray(artist.links) ? [...artist.links] : [];
      let idx = -1;
      if (linkId) {
        idx = existingLinks.findIndex(l => String(l._id) === String(linkId));
      } else {
        idx = existingLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
      }
      
      if (idx > -1) {
        existingLinks[idx] = {
          ...existingLinks[idx],
          layoutType: layoutType
        };
      } else {
        const platformObj = ALL_PLATFORMS.find(p => p.id === platform);
        existingLinks.push({
          platform,
          url: artist[platform] || '',
          title: platformObj ? platformObj.label : platform.charAt(0).toUpperCase() + platform.slice(1),
          layoutType: layoutType,
          order: existingLinks.length
        });
      }

      const payload = { links: existingLinks };
      const res = await landingArtistAPI.updateMyProfile(artist._id || artist.artistId, payload, () => getIdToken(), getFirebaseUser);
      setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, ...res.data } : a));
    } catch (err) {
      console.error('Failed to update link layout:', err);
      alert('Failed to update link layout. Please try again.');
    } finally {
      setSavingLink(null);
    }
  };

  const handleUpdateLinkPrioritize = async (platform, prioritizeType, animationType = 'buzz', linkId = null) => {
    const artist = myArtists[0];
    if (!artist) return;
    setSavingLink(linkId || platform);
    try {
      const existingLinks = Array.isArray(artist.links) ? [...artist.links] : [];
      let updatedLinks = existingLinks.map(l => {
        const matches = linkId ? String(l._id) === String(linkId) : (l.platform || '').toLowerCase() === platform.toLowerCase();
        if (matches) {
          return {
            ...l,
            prioritizeType,
            animationType
          };
        } else {
          return {
            ...l,
            prioritizeType: 'none'
          };
        }
      });

      const idx = linkId
        ? updatedLinks.findIndex(l => String(l._id) === String(linkId))
        : updatedLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
      if (idx === -1) {
        const platformObj = ALL_PLATFORMS.find(p => p.id === platform);
        updatedLinks.push({
          platform,
          url: artist[platform] || '',
          title: platformObj ? platformObj.label : platform.charAt(0).toUpperCase() + platform.slice(1),
          image: '',
          prioritizeType,
          animationType,
          order: updatedLinks.length
        });
      }

      const payload = { links: updatedLinks };
      const res = await landingArtistAPI.updateMyProfile(artist._id || artist.artistId, payload, () => getIdToken(), getFirebaseUser);
      setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, ...res.data } : a));
    } catch (err) {
      console.error('Failed to update prioritize option:', err);
      alert('Failed to update prioritize option. Please try again.');
    } finally {
      setSavingLink(null);
    }
  };

  const handleDuplicateLink = async (linkItem) => {
    const artist = myArtists[0];
    if (!artist) return;
    try {
      const existingLinks = Array.isArray(artist.links) ? [...artist.links] : [];
      const platformObj = ALL_PLATFORMS.find(p => p.id === linkItem.platform);
      const defaultTitle = platformObj ? platformObj.label : linkItem.platform.charAt(0).toUpperCase() + linkItem.platform.slice(1);
      
      const newLink = {
        platform: linkItem.platform,
        url: '',
        title: defaultTitle,
        image: '',
        prioritizeType: 'none',
        animationType: 'buzz',
        layoutType: 'classic',
        order: existingLinks.length
      };

      const payload = { links: [...existingLinks, newLink] };
      const res = await landingArtistAPI.updateMyProfile(
        artist._id || artist.artistId,
        payload,
        () => getIdToken(),
        getFirebaseUser
      );

      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to duplicate link.');
      }

      setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, ...res.data } : a));
    } catch (err) {
      console.error('Failed to duplicate link:', err);
      window.alert('Failed to duplicate link. Please try again.');
    }
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
        await landingArtistAPI.updateMyProfile(artist._id || artist.artistId, payload, () => getIdToken(), getFirebaseUser);
        setMyArtists(prev => prev.map((a, j) => j === 0 ? { ...a, [field]: uploadedUrl } : a));
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





  const togglePlatformInSelector = (id) => {
    setTempPlatforms((prev) => {
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id);
      }

      const base = new Set(visiblePlatforms || []);
      const nextTemp = [...prev, id];
      const combined = new Set([...base, ...nextTemp]);

      if (combined.size > MAX_PLATFORM_LINKS) {
        window.alert(`You can add up to ${MAX_PLATFORM_LINKS} platforms.`);
        return prev;
      }
      return nextTemp;
    });
  };

  const handlePlatformDone = async () => {
    const artist = myArtists[0];
    if (!artist) return;

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

  const handleOnboardingComplete = async () => {
    try {
      setSaving(true);
      setError('');

      let artist = myArtists[0];
      if (!artist) {
        try {
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


      await landingArtistAPI.updateMyProfile(artist._id || artist.artistId, payload, () => getIdToken(), getFirebaseUser);
      await loadMyProfiles();
      updateOnboardingStep(0);
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to complete setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateArtistWithUsername = async (username) => {
    try {
      setSaving(true);
      setError('');

      const createRes = await landingArtistAPI.createMyProfile({
        artistId: username.toLowerCase().trim(),
        name: 'Ananya Verma'
      }, () => getIdToken(), getFirebaseUser);

      if (createRes && createRes.success === false) {
        throw new Error(createRes.message || 'Failed to initialize profile.');
      }

      const createdArtist = createRes.data;

      const base = window.location.origin;
      const updatePayload = {
        name: 'Ananya Verma',
        specialization: 'Visual Arts, Sketching, Mandalas',
        experience: 'Visual Artist & Illustrator',
        bio: 'Indian Visual Artist & Illustrator. Combining traditional Indian folk art styles with modern digital illustrations. Curator of color, storytelling, and cultural aesthetics.',
        phone: '+919876543210',
        email: user?.email || '',
        photo: `${base}/indian_artist_avatar.png`,
        backgroundPhoto: `${base}/mock_art_folk.png`,
        profileTheme: 'mono',
        isSetup: true,
        showPhoto: true,
        showName: true,
        showLocation: true,
        showSpecialization: true,
        showAbout: true,
        showConnect: true,
        showWhatIDo: true,
        showArtPortfolio: true,
        showGallery: true,
        links: [
          { title: 'Instagram', platform: 'instagram', url: 'https://instagram.com/ananyaverma_art', order: 0 },
          { title: 'Pinterest', platform: 'pinterest', url: 'https://pinterest.com/ananyaverma_art', order: 1 },
          { title: 'WhatsApp', platform: 'whatsapp', url: 'https://wa.me/919876543210', order: 2 }
        ],
        gallery: [
          { name: 'Mystic Mandalas', url: `${base}/mock_art_mandala.png`, link: 'https://example.com/mystic-mandalas' },
          { name: 'Royal Rajasthan', url: `${base}/mock_art_folk.png`, link: 'https://example.com/royal-rajasthan' }
        ],
        artLinks: [
          {
            id: Date.now() - 1000,
            title: 'Custom Canvas Commissions',
            description: 'Specialize in bespoke traditional acrylic and oil paintings on canvas based on custom themes.',
            theme: 'painting',
            images: [],
            itemType: 'service'
          },
          {
            id: Date.now(),
            title: 'Digital Illustration Workshops',
            description: 'Interactive online sessions teaching modern folk art concepts and procreate illustration workflows.',
            theme: 'digital',
            images: [],
            itemType: 'service'
          }
        ]
      };

      const res = await landingArtistAPI.updateMyProfile(
        createdArtist._id || createdArtist.artistId,
        updatePayload,
        () => getIdToken(),
        getFirebaseUser
      );

      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to update profile.');
      }

      await loadMyProfiles();
    } catch (err) {
      console.error('Failed to auto-create artist profile:', err);
      setError(err.message || 'Failed to create artist profile. Please try again.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.displayName || user?.email || 'Profile';
  const displayEmail = user?.email || '';
  const avatarLetter = user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?';

  const artist = myArtists[0];

  const dashboardProps = {
    user,
    displayName,
    displayEmail,
    avatarLetter,
    handleLogout,
    cropper,
    isMobileViewport,
    error,
    loading: artistsLoading,
    artistsLoading,
    artist,
    myArtists,
    showUsernamePopup: artistListReady && myArtists.length === 0,
    handleCreateArtistWithUsername,
    setProfileMode,
    setProfileLock,
    setChoiceSource,
    activeTab,
    setActiveTab,
    activeEditor,
    setActiveEditor,
    dashTheme,
    dashFont,
    previewKey,
    frontendBase,
    isSelectorOpen,
    tempPlatforms,
    togglePlatformInSelector,
    handlePlatformDone,
    linkCopiedArtist,
    setLinkCopiedArtist,
    saving,
    artistChanged,
    setArtistChanged,
    inlineEditing,
    setInlineEditing,
    inlineEditValue,
    setInlineEditValue,
    artQrModal,
    setArtQrModal,
    handleUpdateLink,
    handleUpdateHeroField,
    handleAddTag,
    handleDeleteTag,
    openHeroEditor,
    saveMobileHeroField,
    handleUpdateLinkLabel,
    openLinkPopup,
    saveMobileLinkField,
    handleUpdateLinkImage,
    handleRemoveLinkImage,
    handleUpdateLinkLayout,
    handleUpdateLinkPrioritize,
    handleUploadField,

    artSaving,
    setArtSaving,
    artImagePreview,
    setArtImagePreview,
    newArtTheme,
    setNewArtTheme,
    showArtGallery,
    setShowArtGallery,
    artGallerySelectedItem,
    setArtGallerySelectedItem,
    mobileHeroEditField,
    mobileHeroDraft,
    setMobileHeroDraft,
    mobileLinkEditPlatform,
    setMobileLinkEditPlatform,
    mobileLinkEditId,
    setMobileLinkEditId,
    mobileLinkEditLabel,
    mobileLinkEditValue,
    setMobileLinkEditValue,
    mobileLinkEditMode,
    setMobileLinkEditMode,
    handleDuplicateLink,
    pendingLinks,
    setPendingLinks,
    savingLink,
    visiblePlatforms,
    setVisiblePlatforms,
    heroUpdates,
    setHeroUpdates,
    isAddingTag,
    newTagText,
    setNewTagText,
    isUploading,

    designSubTab,
    setDesignSubTab,
    setIsSelectorOpen,
    handlePickAndCrop,
    handlePickAndCropBatch,
    setError,
    loadMyProfiles,
    setPreviewKey,
    openSubPanel,
    setOpenSubPanel,
    layoutActiveTab,
    setLayoutActiveTab,
    setTempPlatforms,
    setSaving,
    setMyArtists,
    getIdToken,
    getFirebaseUser,
    editingHeroField,
    setEditingHeroField,
    setIsAddingTag,
    setMobileHeroEditField,

    syncFonts,
    setSyncFonts
  };




  if (onboardingStep > 0) {
    return (
      <>
        <ProfileArtistOnboardingWizard
          onboardingStep={onboardingStep}
          handleOnboardingBack={() => updateOnboardingStep(onboardingStep - 1)}
          handleOnboardingNext={() => updateOnboardingStep(onboardingStep + 1)}
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

          error={error}
          saving={saving}
          handleLogout={handleLogout}
          handlePickAndCrop={handlePickAndCrop}
          handlePickAndCropBatch={handlePickAndCropBatch}
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

  return (
    <ProfileArtistDashboard {...dashboardProps} />
  );
}
