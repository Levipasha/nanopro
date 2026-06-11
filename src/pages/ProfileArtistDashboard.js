/**
 * ProfileArtistDashboard.js
 * Restructured artist dashboard.
 * - Mobile view: remains unchanged (tabbed bottom nav).
 * - Desktop/Laptop view: simplified split-screen layout.
 *   - Top bar: Email + Title + Logout & Link actions.
 *   - Left side: Center-aligned interactive mobile-style preview (iframe) with click-to-edit selectors.
 *   - Right side: Empty space or context-aware editor based on what element was clicked in the preview.
 */
import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import ImageCropperModal from '../components/profile/ImageCropperModal';
import { getLinkIcon } from '../components/LinkIcons';
import { ALL_PLATFORMS } from './ProfileHelpers';
import ProfileArtistProfiles from './ProfileArtistProfiles';
import ProfileArtistPlatforms from './ProfileArtistPlatforms';
import ProfileArtistDesign from './ProfileArtistDesign';
import ProfileArtistLinkArt from './ProfileArtistLinkArt';
import { landingArtistAPI, generalProfileAPI } from '../services/api';
const formatSentenceCase = (text) => {
  if (!text) return '';
  let formatted = text.replace(/,([^\s])/g, ', $1');
  formatted = formatted.replace(/^(\s*)([a-z])/i, (match, space, letter) => space + letter.toUpperCase());
  formatted = formatted.replace(/(\.\s*)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
  return formatted;
};

export default function ProfileArtistDashboard(props) {
  const {
    user, displayName, displayEmail, avatarLetter, handleLogout,
    cropper, isMobileViewport, error, loading,
    artist, myArtists, activeTab, setActiveTab, activeEditor, setActiveEditor, dashTheme, dashFont,
    previewKey, frontendBase,
    isSelectorOpen, setIsSelectorOpen, tempPlatforms,
    togglePlatformInSelector, handlePlatformDone,
    linkCopiedArtist, setLinkCopiedArtist,
    saving, artistChanged, setArtistChanged,
    getIdToken, getFirebaseUser, setMyArtists, setPreviewKey,
    editingHeroField, setEditingHeroField, heroUpdates, setHeroUpdates,
    isAddingTag, setIsAddingTag, handleAddTag, handleDeleteTag,
    newTagText, setNewTagText, handleUploadField, handlePickAndCrop, isUploading,

    // link edit popup props
    mobileLinkEditPlatform, setMobileLinkEditPlatform,
    mobileLinkEditId, setMobileLinkEditId,
    mobileLinkEditLabel,
    mobileLinkEditValue, setMobileLinkEditValue,
    mobileLinkEditMode,
    saveMobileLinkField, savingLink,

    // username popup props
    showUsernamePopup, handleCreateArtistWithUsername,
    setProfileMode, setProfileLock, setChoiceSource
  } = props;

  const iframeRef = useRef(null);
  const [iframeVisible, setIframeVisible] = useState(false);

  const [localUsername, setLocalUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);
  const [popupError, setPopupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!localUsername) {
      setIsAvailable(null);
      setAvailabilityError(null);
      return;
    }
    const cleanUsername = localUsername.toLowerCase().trim();
    if (!/^[a-z0-9_-]+$/.test(cleanUsername)) {
      setAvailabilityError('Username can only contain lowercase letters, numbers, underscores, and hyphens.');
      setIsAvailable(false);
      return;
    }
    
    setAvailabilityError(null);
    setIsChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await generalProfileAPI.checkAvailability({ username: cleanUsername });
        if (res && res.available) {
          setIsAvailable(true);
          setAvailabilityError(null);
        } else {
          setIsAvailable(false);
          setAvailabilityError('Username is already taken.');
        }
      } catch (err) {
        console.warn('Username check failed', err);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localUsername]);

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/\s+/g, '_');
    setLocalUsername(val);
  };

  const handleSubmitUsername = async () => {
    if (!localUsername || !isAvailable || isChecking) return;
    setSubmitting(true);
    setPopupError(null);
    try {
      if (handleCreateArtistWithUsername) {
        await handleCreateArtistWithUsername(localUsername);
      }
    } catch (err) {
      setPopupError(err.message || 'Failed to create artist profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const [recentChanges, setRecentChanges] = useState(() => {
    try {
      const saved = localStorage.getItem(`recent_changes_${artist?.artistId || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Lock page scroll when platform selector modal is open (style-tag injection is stronger than JS style property)
  useEffect(() => {
    const styleId = 'plt-no-scroll';
    let el = document.getElementById(styleId);
    if (isSelectorOpen) {
      if (!el) {
        el = document.createElement('style');
        el.id = styleId;
        document.head.appendChild(el);
      }
      el.textContent = 'html, body { overflow: hidden !important; max-width: 100% !important; }';
    } else {
      if (el) el.remove();
    }
    return () => { const e = document.getElementById(styleId); if (e) e.remove(); };
  }, [isSelectorOpen]);

  // Load correct recent changes log from localStorage once artist profile loads
  useEffect(() => {
    if (artist?.artistId) {
      try {
        const saved = localStorage.getItem(`recent_changes_${artist.artistId}`);
        setRecentChanges(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setRecentChanges([]);
      }
    }
  }, [artist?.artistId]);

  const prevArtistRef = useRef(null);

  // Compare artist profile data changes to dynamically log recent updates
  useEffect(() => {
    if (!artist) return;
    
    if (!prevArtistRef.current) {
      prevArtistRef.current = { ...artist };
      return;
    }

    const prev = prevArtistRef.current;
    let detectedField = null;
    let detectedLabel = null;

    if (artist.name !== prev.name && prev.name !== undefined) {
      detectedLabel = "Display Name";
      detectedField = "name";
    }
    else if ((artist.city !== prev.city || artist.state !== prev.state) && (prev.city !== undefined || prev.state !== undefined)) {
      detectedLabel = "Location";
      detectedField = "location";
    }
    else if (artist.specialization !== prev.specialization && prev.specialization !== undefined) {
      detectedLabel = "Specialization Badges";
      detectedField = "tags";
    }
    else if (artist.photo !== prev.photo && prev.photo !== undefined) {
      detectedLabel = "Avatar Photo";
      detectedField = "photo";
    }
    else if (artist.backgroundPhoto !== prev.backgroundPhoto && prev.backgroundPhoto !== undefined) {
      detectedLabel = "Background Banner";
      detectedField = "photo";
    }
    else if ((artist.bio !== prev.bio || artist.experience !== prev.experience) && (prev.bio !== undefined || prev.experience !== undefined)) {
      detectedLabel = "About & Bio";
      detectedField = "about";
    }
    else if (JSON.stringify(artist.links) !== JSON.stringify(prev.links) && prev.links !== undefined) {
      detectedLabel = "Social Platforms";
      detectedField = "platforms";
    }

    else if (JSON.stringify(artist.artLinks) !== JSON.stringify(prev.artLinks) && prev.artLinks !== undefined) {
      const prevArt = prev.artLinks || [];
      const currArt = artist.artLinks || [];
      const prevServices = (Array.isArray(prevArt) ? prevArt : Object.values(prevArt)).filter(x => x.itemType === 'service');
      const currServices = (Array.isArray(currArt) ? currArt : Object.values(currArt)).filter(x => x.itemType === 'service');
      const prevArtworks = (Array.isArray(prevArt) ? prevArt : Object.values(prevArt)).filter(x => x.itemType !== 'service');
      const currArtworks = (Array.isArray(currArt) ? currArt : Object.values(currArt)).filter(x => x.itemType !== 'service');
      
      if (JSON.stringify(prevServices) !== JSON.stringify(currServices)) {
        detectedLabel = "Services & Offerings";
        detectedField = "what-i-do";
      } else if (JSON.stringify(prevArtworks) !== JSON.stringify(currArtworks)) {
        detectedLabel = "Art Portfolio";
        detectedField = "link-art";
      }
    }
    else if ((artist.profileTheme !== prev.profileTheme || artist.profileFont !== prev.profileFont || artist.bioFont !== prev.bioFont) && (prev.profileTheme !== undefined || prev.profileFont !== undefined || prev.bioFont !== undefined)) {
      detectedLabel = "Design Theme";
      detectedField = "design";
    }
    else if ((artist.showName !== false) !== (prev.showName !== false)) {
      detectedLabel = "Name Visibility";
      detectedField = "name";
    }
    else if ((artist.showLocation !== false) !== (prev.showLocation !== false)) {
      detectedLabel = "Location Visibility";
      detectedField = "location";
    }
    else if ((artist.showSpecialization !== false) !== (prev.showSpecialization !== false)) {
      detectedLabel = "Badges Visibility";
      detectedField = "tags";
    }
    else if ((artist.showPhoto !== false) !== (prev.showPhoto !== false)) {
      detectedLabel = "Photo Visibility";
      detectedField = "photo";
    }
    else if ((artist.showAbout !== false) !== (prev.showAbout !== false)) {
      detectedLabel = "About Visibility";
      detectedField = "about";
    }
    else if ((artist.showConnect !== false) !== (prev.showConnect !== false)) {
      detectedLabel = "Platforms Visibility";
      detectedField = "platforms";
    }

    else if ((artist.showWhatIDo !== false) !== (prev.showWhatIDo !== false)) {
      detectedLabel = "Services Visibility";
      detectedField = "what-i-do";
    }
    else if ((artist.showArtPortfolio !== false) !== (prev.showArtPortfolio !== false)) {
      detectedLabel = "Portfolio Visibility";
      detectedField = "link-art";
    }

    if (detectedLabel && detectedField) {
      const label = detectedLabel;
      const editorType = detectedField;
      
      setRecentChanges(prevLog => {
        const filtered = prevLog.filter(item => item.editorType !== editorType);
        const updated = [
          { label, editorType, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ...filtered
        ].slice(0, 5);
        
        try {
          localStorage.setItem(`recent_changes_${artist?.artistId || 'default'}`, JSON.stringify(updated));
        } catch (e) {}
        
        return updated;
      });
    }

    prevArtistRef.current = { ...artist };
  }, [artist]);

  // Real-time synchronization of editor draft updates with the preview iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const cleanData = JSON.parse(JSON.stringify({
          ...artist,
          name: heroUpdates.name !== undefined ? heroUpdates.name : (artist?.name || ''),
          city: heroUpdates.city !== undefined ? heroUpdates.city : (artist?.city || ''),
          state: heroUpdates.state !== undefined ? heroUpdates.state : (artist?.state || ''),
          experience: heroUpdates.experience !== undefined ? heroUpdates.experience : (artist?.experience || ''),
          bio: heroUpdates.bio !== undefined ? heroUpdates.bio : (artist?.bio || '')
        }));
        iframeRef.current.contentWindow.postMessage({
          type: 'DRAFT_UPDATE',
          data: cleanData
        }, '*');
      } catch (err) {
        console.warn('Artist draft sync serialization warning:', err);
      }
    }
  }, [heroUpdates, artist, previewKey]);

  // Helper editor header with integrated toggle switch
  const renderEditorHeader = (title, fieldName, actionBtn = null) => {
    if (isMobileViewport) {
      return null;
    }

    const isChecked = artist ? artist[fieldName] !== false : true;

    const handleToggle = () => {
      if (!artist) return;
      const newVal = !isChecked;
      
      // Update local state immediately
      setMyArtists(prev => prev.map((a, idx) => idx === 0 ? { ...a, [fieldName]: newVal } : a));
      
      // Save to database
      landingArtistAPI.updateMyProfile(artist.artistId || artist._id, { [fieldName]: newVal }, () => getIdToken(), getFirebaseUser)
        .then(res => {
          if (res.success && res.data) {
            setMyArtists(prev => prev.map((a, idx) => idx === 0 ? res.data : a));
          }
        })
        .catch(err => {
          console.error("Error updating toggle:", err);
        });
    };

    return (
      <div className="dash-editor-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: '1.75rem',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        {/* Left: Title */}
        <h3 className="dash-editor-header-title" style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 700 }}>
          {title}
        </h3>

        {/* Right: Toggle + Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Toggle Block */}
          <div className="dash-editor-header-toggle-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {isChecked ? 'Visible on profile' : 'Hidden from profile'}
            </span>
            <button
              onClick={handleToggle}
              type="button"
              style={{
                position: 'relative',
                width: '36px',
                height: '18px',
                borderRadius: '100px',
                background: isChecked ? '#2563eb' : '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'background-color 0.2s ease',
                outline: 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div style={{
                position: 'absolute',
                left: isChecked ? '20px' : '2px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.15)',
                transition: 'left 0.2s ease'
              }} />
            </button>
          </div>

          {/* Optional Action Button */}
          {actionBtn}
        </div>
      </div>
    );
  };

  const renderMobileToggle = (fieldName) => {
    if (!fieldName || !isMobileViewport) return null;
    const isChecked = artist ? artist[fieldName] !== false : true;

    const handleToggle = () => {
      if (!artist) return;
      const newVal = !isChecked;
      
      // Update local state immediately
      setMyArtists(prev => prev.map((a, idx) => idx === 0 ? { ...a, [fieldName]: newVal } : a));
      
      // Save to database
      landingArtistAPI.updateMyProfile(artist.artistId || artist._id, { [fieldName]: newVal }, () => getIdToken(), getFirebaseUser)
        .then(res => {
          if (res.success && res.data) {
            setMyArtists(prev => prev.map((a, idx) => idx === 0 ? res.data : a));
          }
        })
        .catch(err => {
          console.error("Error updating toggle:", err);
        });
    };

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.8rem 1rem',
        background: '#f8fafc',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        margin: '1rem 0',
        boxSizing: 'border-box'
      }}>
        <span style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>
          {isChecked ? 'Visible on profile' : 'Hidden from profile'}
        </span>
        <button
          onClick={handleToggle}
          type="button"
          style={{
            position: 'relative',
            width: '36px',
            height: '18px',
            borderRadius: '100px',
            background: isChecked ? '#2563eb' : '#cbd5e1',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            transition: 'background-color 0.2s ease',
            outline: 'none',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div style={{
            position: 'absolute',
            left: isChecked ? '20px' : '2px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.15)',
            transition: 'left 0.2s ease'
          }} />
        </button>
      </div>
    );
  };

  // Listen to message events from the preview iframe (e.g. click notifications to open editors)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'PREVIEW_CLICK') {
        let field = event.data.field;
        if (field === 'links') field = 'platforms';
        if (field === 'suggestions') field = 'what-i-do';
        if (field === 'gallery') field = 'link-art';
        setActiveEditor(field);
      }
      if (event.data && event.data.type === 'PROFILE_READY') {
        setIframeVisible(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setActiveEditor]);

  // Obsolete direct DOM attachment is replaced by postMessage listener inside the iframe itself
  const handleIframeLoad = () => {
    // Left empty since iframe manages its own hover styling and click listeners internally.
  };

  // Helper renderers for context-aware editors on the right side
  const renderNameEditor = () => {
    const currentName = heroUpdates.name !== undefined ? heroUpdates.name : (artist?.name || '');
    // Use | separator: "FIRSTNAME|LASTNAME" — first or last can be empty
    const nameParts = currentName.includes('|') ? currentName.split('|') : [currentName, ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts[1] || '';

    return (
      <div style={isMobileViewport ? { padding: '0 0.5rem', width: '100%', boxSizing: 'border-box' } : { background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {renderEditorHeader("Edit Profile Name", "showName")}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>First Name</label>
            <input
              type="text"
              style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.95rem', outline: 'none', textTransform: 'uppercase' }}
              value={firstName}
              onChange={(e) => setHeroUpdates(prev => ({ ...prev, name: `${e.target.value.toUpperCase()}|${lastName}` }))}
              placeholder="FIRST NAME"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Last Name</label>
            <input
              type="text"
              style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.95rem', outline: 'none', textTransform: 'uppercase' }}
              value={lastName}
              onChange={(e) => setHeroUpdates(prev => ({ ...prev, name: `${firstName}|${e.target.value.toUpperCase()}` }))}
              placeholder="LAST NAME"
            />
          </div>
        </div>
        {renderMobileToggle("showName")}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={() => {
              const nameVal = heroUpdates.name !== undefined ? heroUpdates.name : (artist?.name || '');
              landingArtistAPI.updateMyProfile(artist.artistId || artist._id, { name: nameVal }, () => getIdToken(), getFirebaseUser)
                .then(res => {
                  setMyArtists(prev => prev.map((a, idx) => idx === 0 ? { ...a, name: nameVal } : a));
                  setHeroUpdates({});
                  setActiveEditor('default');
                });
            }}
            style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer', margin: 0 }}
          >
            Save Changes
          </button>
          <button
            onClick={() => { setEditingHeroField(null); setHeroUpdates({}); setActiveEditor('default'); }}
            style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: 600, cursor: 'pointer', margin: 0 }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderLocationEditor = () => (
    <div style={isMobileViewport ? { padding: '0 0.5rem', width: '100%', boxSizing: 'border-box' } : { background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      {renderEditorHeader("Edit Location", "showLocation")}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>City</label>
          <input
            type="text"
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.95rem', outline: 'none' }}
            value={heroUpdates.city !== undefined ? heroUpdates.city : (artist?.city || '')}
            onChange={(e) => setHeroUpdates(prev => ({ ...prev, city: formatSentenceCase(e.target.value) }))}
            placeholder="e.g. Hyderabad"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>State</label>
          <input
            type="text"
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.95rem', outline: 'none' }}
            value={heroUpdates.state !== undefined ? heroUpdates.state : (artist?.state || '')}
            onChange={(e) => setHeroUpdates(prev => ({ ...prev, state: formatSentenceCase(e.target.value) }))}
            placeholder="e.g. Telangana"
          />
        </div>
        {renderMobileToggle("showLocation")}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            onClick={() => {
              const c = heroUpdates.city !== undefined ? heroUpdates.city : artist.city;
              const s = heroUpdates.state !== undefined ? heroUpdates.state : artist.state;
              landingArtistAPI.updateMyProfile(artist.artistId || artist._id, { city: c, state: s }, () => getIdToken(), getFirebaseUser)
                .then(res => {
                  if (res.success) {
                    setMyArtists(prev => prev.map((a, idx) => idx === 0 ? res.data : a));
                    setHeroUpdates({});
                    setActiveEditor('default');
                  }
                });
            }}
            style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer', margin: 0 }}
          >
            Save Location
          </button>
          <button
            onClick={() => { setHeroUpdates({}); setActiveEditor('default'); }}
            style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: 600, cursor: 'pointer', margin: 0 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderTagsEditor = () => (
    <div style={isMobileViewport ? { padding: '0 0.5rem', width: '100%', boxSizing: 'border-box' } : { background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      {renderEditorHeader("Specialization Badges", "showSpecialization")}
      
      {/* Existing badges list */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {(artist?.specialization || '').split(',').map(t => t.trim()).filter(Boolean).map((tag, idx) => (
          <div
            key={idx}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <span>{tag}</span>
            <span
              onClick={() => handleDeleteTag(tag)}
              style={{ fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer', lineHeight: '1', display: 'flex', alignItems: 'center' }}
              title="Delete tag"
            >
              ×
            </span>
          </div>
        ))}
        {!(artist?.specialization) && <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>No badges added yet.</p>}
      </div>

      {/* Add tag form */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>Add New Tag</label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newTagText.trim()) {
              handleAddTag(newTagText);
              setNewTagText('');
            }
          }}
          style={{ display: 'flex', gap: '10px' }}
        >
          <input
            type="text"
            style={{ flex: 1, minWidth: 0, padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
            value={newTagText}
            onChange={(e) => setNewTagText(formatSentenceCase(e.target.value))}
            placeholder="e.g. Painter, Sculptor"
          />
          <button
            type="submit"
            style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', border: '1px solid #2563eb', background: '#2563eb', color: '#ffffff', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', boxSizing: 'border-box', margin: 0 }}
          >
            Add
          </button>
        </form>
      </div>

      {renderMobileToggle("showSpecialization")}
      <button
        onClick={() => setActiveEditor('default')}
        style={{ width: '100%', marginTop: '1.5rem', marginLeft: 0, marginRight: 0, marginBottom: 0, padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: 600, cursor: 'pointer', boxSizing: 'border-box', display: 'block' }}
      >
        Done
      </button>
    </div>
  );

  const renderPhotoEditor = () => (
    <div style={isMobileViewport ? { padding: '0 0.5rem', width: '100%', boxSizing: 'border-box' } : { background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      {renderEditorHeader("Upload Profile Images", "showPhoto")}
      
      {/* Avatar Photo */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ color: '#475569', fontSize: '1rem', margin: '0 0 1rem 0' }}>Profile Avatar</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            overflow: 'hidden', 
            background: '#e2e8f0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative'
          }}>
            {artist?.photo ? (
              <img src={artist.photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '2rem', color: '#64748b' }}>{avatarLetter}</span>
            )}
            
            {isUploading === 'photo' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(15, 23, 42, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="3" fill="none" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 12 12"
                      to="360 12 12"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </path>
                </svg>
              </div>
            )}
          </div>
          <label style={{ 
            background: isUploading === 'photo' ? '#94a3b8' : '#2563eb', 
            color: '#fff', 
            padding: '0.6rem 1.2rem', 
            borderRadius: '8px', 
            fontWeight: 600, 
            cursor: isUploading === 'photo' ? 'not-allowed' : 'pointer', 
            fontSize: '0.85rem',
            pointerEvents: isUploading === 'photo' ? 'none' : 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {isUploading === 'photo' ? 'Uploading...' : 'Choose New Avatar'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              disabled={isUploading === 'photo'}
              onChange={(e) => handlePickAndCrop(e, 1, (file) => handleUploadField('photo', file))}
            />
          </label>
        </div>
      </div>

      {renderMobileToggle("showPhoto")}
      <button
        onClick={() => setActiveEditor('default')}
        style={{ width: '100%', marginTop: '2rem', marginLeft: 0, marginRight: 0, marginBottom: 0, padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: 600, cursor: 'pointer', boxSizing: 'border-box', display: 'block' }}
      >
        Done
      </button>
    </div>
  );

  const renderAboutEditor = () => (
    <div style={isMobileViewport ? { padding: '0 0.5rem', width: '100%', boxSizing: 'border-box' } : { background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      {renderEditorHeader("About & Bio", "showAbout")}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>Headline (White Text)</label>
            <textarea
              rows={2}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.95rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', textTransform: 'uppercase' }}
              value={(() => {
                const exp = heroUpdates.experience !== undefined ? heroUpdates.experience : (artist?.experience || '');
                return exp.split('|')[0] || '';
              })()}
              onChange={(e) => {
                const exp = heroUpdates.experience !== undefined ? heroUpdates.experience : (artist?.experience || '');
                const part2 = exp.split('|').slice(1).join('|');
                setHeroUpdates(prev => ({ ...prev, experience: part2 ? `${e.target.value.toUpperCase()}|${part2}` : e.target.value.toUpperCase() }));
              }}
              placeholder="E.G. A PASSIONATE"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>Headline (Red Text)</label>
            <input
              type="text"
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.95rem', outline: 'none', textTransform: 'uppercase' }}
              value={(() => {
                const exp = heroUpdates.experience !== undefined ? heroUpdates.experience : (artist?.experience || '');
                return exp.split('|').slice(1).join('|') || '';
              })()}
              onChange={(e) => {
                const exp = heroUpdates.experience !== undefined ? heroUpdates.experience : (artist?.experience || '');
                const part1 = exp.split('|')[0] || '';
                setHeroUpdates(prev => ({ ...prev, experience: `${part1}|${e.target.value.toUpperCase()}` }));
              }}
              placeholder="E.G. CREATIVE MIND"
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>Bio Description</label>
          <textarea
            rows={5}
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.95rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            value={heroUpdates.bio !== undefined ? heroUpdates.bio : (artist?.bio || '')}
            onChange={(e) => setHeroUpdates(prev => ({ ...prev, bio: formatSentenceCase(e.target.value) }))}
            placeholder="Tell your story, your mediums, style, background..."
          />
        </div>
        {renderMobileToggle("showAbout")}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            onClick={() => {
              const expVal = heroUpdates.experience !== undefined ? heroUpdates.experience : (artist.experience || '');
              const bioVal = heroUpdates.bio !== undefined ? heroUpdates.bio : (artist.bio || '');
              landingArtistAPI.updateMyProfile(artist.artistId || artist._id, { experience: expVal, bio: bioVal }, () => getIdToken(), getFirebaseUser)
                .then(res => {
                  setMyArtists(prev => prev.map((a, idx) => idx === 0 ? { ...a, experience: expVal, bio: bioVal } : a));
                  setHeroUpdates({});
                  setActiveEditor('default');
                });
            }}
            style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer', margin: 0 }}
          >
            Save About info
          </button>
          <button
            onClick={() => { setHeroUpdates({}); setActiveEditor('default'); }}
            style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: 600, cursor: 'pointer', margin: 0 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderPlatformsEditor = () => (
    <div>
      {renderEditorHeader("Digital Platforms", "showConnect", (
        <button
          onClick={() => setActiveEditor('default')}
          style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Back
        </button>
      ))}
      {renderMobileToggle("showConnect")}
      <ProfileArtistPlatforms {...props} hidePreview={true} />
    </div>
  );



  const renderDesignEditor = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>Customize Design</h3>
        {!isMobileViewport && (
          <button
            onClick={() => setActiveEditor('default')}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Back
          </button>
        )}
      </div>
      <ProfileArtistDesign {...props} hidePreview={true} />
    </div>
  );

  const renderWhatIDoEditor = () => (
    <div>
      {renderEditorHeader("Services & Offerings", "showWhatIDo", (
        <button
          onClick={() => setActiveEditor('default')}
          style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Back
        </button>
      ))}
      {renderMobileToggle("showWhatIDo")}
      <ProfileArtistLinkArt {...props} activeTab="what-i-do" hidePreview={true} />
    </div>
  );

  const renderArtShowcaseEditor = () => (
    <div>
      {renderEditorHeader("Art Portfolio", "showArtPortfolio", (
        <button
          onClick={() => setActiveEditor('default')}
          style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Back
        </button>
      ))}
      {renderMobileToggle("showArtPortfolio")}
      <ProfileArtistLinkArt {...props} activeTab="link-art" hidePreview={true} />
    </div>
  );

  const renderStatusBadge = (fieldName) => {
    if (!artist) return null;
    const isVisible = artist[fieldName] !== false;
    return (
      <span style={{
        fontSize: '0.68rem',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '100px',
        background: isVisible ? 'rgba(37, 99, 235, 0.06)' : 'rgba(100, 116, 139, 0.08)',
        color: isVisible ? '#2563eb' : '#64748b',
        border: '1px solid ' + (isVisible ? 'rgba(37, 99, 235, 0.15)' : 'rgba(100, 116, 139, 0.15)'),
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        lineHeight: 1,
        marginLeft: 'auto'
      }}>
        <span style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: isVisible ? '#2563eb' : '#64748b'
        }} />
        {isVisible ? 'Visible' : 'Hidden'}
      </span>
    );
  };

  const renderQuickAccessButton = (editorKey, icon, title, fieldName, description) => {
    const isAlwaysOn = fieldName === null;
    return (
      <button
        onClick={() => setActiveEditor(editorKey)}
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          borderRadius: '12px',
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          width: '100%',
          boxSizing: 'border-box'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#2563eb';
          e.currentTarget.style.background = '#f8fafc';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.background = '#ffffff';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0.5rem' }}>
          <div style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}>
            {icon}
          </div>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
            {title}
          </span>
          {isAlwaysOn ? (
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '100px',
              background: 'rgba(37, 99, 235, 0.06)',
              color: '#2563eb',
              border: '1px solid rgba(37, 99, 235, 0.15)',
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              lineHeight: 1
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2563eb' }} />
              Always On
            </span>
          ) : (
            renderStatusBadge(fieldName)
          )}
        </div>
        <div style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.4 }}>
          {description}
        </div>
      </button>
    );
  };

  const renderDefaultPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.25rem' }}>Welcome to your Editor!</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6 }}>
          Click on any element in the profile preview on the left to start editing it, or use the quick access links below.
        </p>
      </div>

      <div>
        <h4 style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem 0' }}>Quick Access Settings</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {renderQuickAccessButton('name', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>, "Edit Name", "showName", "Change your public display name")}
          
          {renderQuickAccessButton('photo', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, "Profile Image", "showPhoto", "Upload and toggle your profile photo")}
          
          {renderQuickAccessButton('location', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, "Location", "showLocation", "Update city and state visibility")}
          
          {renderQuickAccessButton('tags', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>, "Specialization Badges", "showSpecialization", "Manage professional skills and badges")}
          
          {renderQuickAccessButton('about', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, "About & Bio", "showAbout", "Update headline and biography details")}
          
          {renderQuickAccessButton('platforms', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><path d="M2 12h20" /></svg>, "Social Platforms", "showConnect", "Connect Instagram, Twitter, and other links")}
          

          
          {renderQuickAccessButton('what-i-do', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>, "What I Do", "showWhatIDo", "List your custom services and offerings")}
          
          {renderQuickAccessButton('link-art', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, "Art Portfolio Showcase", "showArtPortfolio", "Set up specific artworks with distinct QR codes")}
        </div>
      </div>
    </div>
  );

  const renderEditorPanel = () => {
    switch (activeEditor) {
      case 'name':
        return renderNameEditor();
      case 'location':
        return renderLocationEditor();
      case 'tags':
        return renderTagsEditor();
      case 'photo':
        return renderPhotoEditor();
      case 'about':
        return renderAboutEditor();
      case 'platforms':
        return renderPlatformsEditor();

      case 'design':
        return renderDesignEditor();
      case 'what-i-do':
        return renderWhatIDoEditor();
      case 'link-art':
        return renderArtShowcaseEditor();
      default:
        return renderDefaultPanel();
    }
  };

  // If in Mobile viewport, directly render the profile preview with edit-on-click modals
  if (isMobileViewport) {
    return (
      <div className={`dash-root dash-theme-${dashTheme} dash-font-${dashFont} dash-mode-artist`} style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#ffffff',
        color: '#0f172a',
        fontFamily: "'Outfit', sans-serif"
      }}>
        {/* Sleek Mobile Header */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          height: '60px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Artist Editor</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {myArtists && myArtists[0] && (() => {
              const profileUrl = `${frontendBase}/artist/${myArtists[0].artistId}`;
              return (
                <>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(profileUrl);
                      setLinkCopiedArtist(true);
                      setTimeout(() => setLinkCopiedArtist(false), 2000);
                    }}
                    title={linkCopiedArtist ? 'Copied' : 'Copy Profile Link'}
                    aria-label="Copy Profile Link"
                    style={{
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#ffffff',
                      color: linkCopiedArtist ? '#16a34a' : '#475569',
                      border: '1px solid ' + (linkCopiedArtist ? '#bbf7d0' : '#cbd5e1'),
                      borderRadius: '8px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {linkCopiedArtist ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Visit Profile"
                    aria-label="Visit Profile"
                    style={{
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#2563eb',
                      color: '#ffffff',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textDecoration: 'none'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </>
              );
            })()}

            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Full-screen Preview Frame */}
        <div style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          background: '#ffffff',
          overflow: 'hidden'
        }}>
          {myArtists && myArtists[0] ? (
            <iframe
              ref={iframeRef}
              key={previewKey}
              onLoad={handleIframeLoad}
              title="Artist Preview"
              src={`${frontendBase}/artist/${myArtists[0].artistId}?no_redirect=1`}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          ) : null}
          {/* Skeleton overlay — hides iframe flashes, matches profile layout */}
          {!iframeVisible && (
            <div style={{ position: 'absolute', inset: 0, background: '#F7F3EE', zIndex: 10, overflowY: 'auto', fontFamily: "'Syne', sans-serif", color: '#0A0A0A' }}>
              <style>{`
                @keyframes skshimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
                .skb { background: linear-gradient(90deg,#EDE8E2 25%,#F7F3EE 50%,#EDE8E2 75%); background-size: 600px 100%; animation: skshimmer 1.4s ease-in-out infinite; border-radius: 4px; }
                .skb-red { background: linear-gradient(90deg,#C8001A 25%,#ff4d66 50%,#C8001A 75%); background-size: 600px 100%; animation: skshimmer 1.4s ease-in-out infinite; border-radius: 4px; }
              `}</style>
              
              {/* Topbar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                height: '56px',
                background: 'rgba(247,243,238,0.88)',
                backdropFilter: 'blur(24px)',
                borderBottom: '1px solid rgba(10,10,10,0.1)',
                position: 'sticky',
                top: 0,
                zIndex: 100
              }}>
                <div style={{ fontSize: '11px', letterSpacing: '4px', fontWeight: 700, color: '#9A9490' }}>
                  <b style={{ color: '#C8001A' }}>NANO</b>PROFILES
                </div>
                <div style={{ fontSize: '11px', fontFamily: "monospace", color: '#9A9490', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C8001A' }}></span>
                  @{artist?.username || artist?.artistId || 'profile'}
                </div>
              </div>

              {/* Main Content (Hero) */}
              <div style={{ padding: '80px 24px 40px', position: 'relative', borderLeft: '4px solid #C8001A', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="skb" style={{ width: 110, height: 28 }} />
                  <div className="skb" style={{ width: 80, height: 16 }} />
                </div>
                <div className="skb" style={{ width: '100%', aspectRatio: '1/1', maxHeight: '380px', borderRadius: 2 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px 0' }}>
                  <div className="skb-red" style={{ width: 120, height: 12 }} />
                  <div className="skb" style={{ width: '80%', height: 48 }} />
                  <div className="skb" style={{ width: '60%', height: 48 }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div className="skb" style={{ width: 90, height: 32, borderRadius: 0 }} />
                  <div className="skb" style={{ width: 110, height: 32, borderRadius: 0 }} />
                  <div className="skb" style={{ width: 80, height: 32, borderRadius: 0 }} />
                </div>
              </div>

              {/* Section 01: About */}
              <div style={{ padding: '40px 24px', borderTop: '1px solid rgba(10,10,10,0.1)', borderLeft: '4px solid #C8001A', background: '#0A0A0A', color: '#F7F3EE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div className="skb-red" style={{ width: 32, height: 20 }} />
                  <div className="skb" style={{ width: 80, height: 12 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="skb" style={{ width: '90%', height: 20 }} />
                  <div className="skb" style={{ width: '85%', height: 16 }} />
                  <div className="skb" style={{ width: '70%', height: 16 }} />
                </div>
              </div>

              {/* Section 02: Connect */}
              <div style={{ padding: '40px 24px', borderTop: '1px solid rgba(10,10,10,0.1)', borderLeft: '4px solid #C8001A', background: '#111' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div className="skb-red" style={{ width: 32, height: 20 }} />
                  <div className="skb" style={{ width: 80, height: 12 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skb" style={{ width: '100%', height: 68, borderRadius: 16 }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Sheet / Modal Overlay for Editor panels */}
        {activeEditor !== 'default' && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0 16px 16px 16px',
            boxSizing: 'border-box'
          }} onClick={() => setActiveEditor('default')}>
            <div style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '450px',
              maxHeight: '80vh',
              borderRadius: '24px',
              padding: '1.5rem',
              boxSizing: 'border-box',
              overflowY: 'auto',
              overflowX: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
              color: '#0f172a',
              margin: '0 auto'
            }} onClick={(e) => e.stopPropagation()}>
              {/* Close indicator/handle on mobile */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', cursor: 'pointer' }} onClick={() => setActiveEditor('default')}>
                <div style={{ width: '40px', height: '5px', borderRadius: '3px', background: '#e2e8f0' }} />
              </div>
              
              {/* Actual editor content */}
              <div style={{ width: '100%', boxSizing: 'border-box' }}>
                {renderEditorPanel()}
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

        {showUsernamePopup && ReactDOM.createPortal(
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 999999,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              width: '450px',
              maxWidth: 'calc(100vw - 32px)',
              padding: '2.5rem 2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxSizing: 'border-box',
              fontFamily: "'Outfit', sans-serif",
              color: '#0f172a'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                  Welcome to <span style={{ color: '#2563eb' }}>nano</span>
                </div>
                <p style={{ fontSize: '0.92rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Please choose a unique username to generate your Indian mock artist profile. You can edit everything later!
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Username / Artist ID
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 500, fontSize: '0.95rem' }}>
                    @
                  </span>
                  <input
                    type="text"
                    placeholder="username"
                    value={localUsername}
                    onChange={handleUsernameChange}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.8rem 1rem 0.8rem 2rem',
                      borderRadius: '12px',
                      border: `1.5px solid ${availabilityError ? '#ef4444' : isAvailable === true ? '#10b981' : '#e2e8f0'}`,
                      background: '#f8fafc',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                </div>
                {availabilityError && (
                  <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 500 }}>
                    {availabilityError}
                  </span>
                )}
                {isChecking && (
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                    Checking availability...
                  </span>
                )}
                {!isChecking && isAvailable === true && (
                  <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 500 }}>
                    ✓ Username is available!
                  </span>
                )}
              </div>

              {popupError && (
                <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#b91c1c', fontSize: '0.82rem', fontWeight: 500 }}>
                  {popupError}
                </div>
              )}

              <button
                onClick={handleSubmitUsername}
                disabled={submitting || !isAvailable || isChecking}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: (!isAvailable || isChecking) ? '#cbd5e1' : '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: (!isAvailable || isChecking) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  margin: 0
                }}
              >
                {submitting ? 'Creating Artist Profile...' : 'Claim Username & Create Artist Profile'}
              </button>
            </div>
          </div>
        , document.body)}

        {isSelectorOpen && ReactDOM.createPortal(
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <style>{`
              @keyframes modalIn {
                from { opacity: 0; }
                to   { opacity: 1; }
              }
              .plt-row { transition: background 0.15s; box-sizing: border-box; }
              .plt-row:hover { background: #f8fafc !important; }
              .plt-row.plt-active { background: #f0fdf4 !important; }
              .plt-row.plt-active:hover { background: #dcfce7 !important; }
              .plt-search:focus { border-color: #2563eb !important; outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important; }
              .plt-cancel:hover { background: #f1f5f9 !important; }
              .plt-done:hover { filter: brightness(1.08); }
              .plt-list::-webkit-scrollbar { width: 4px; }
              .plt-list::-webkit-scrollbar-track { background: transparent; }
              .plt-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
              .plt-list { overflow-x: hidden !important; }
            `}</style>

            <div style={{
              background: '#ffffff',
              borderRadius: '18px',
              width: '400px',
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 48px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
              animation: 'modalIn 0.18s ease',
            }}>

              {/* Header */}
              <div style={{ padding: '1.5rem 1.5rem 1.2rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Add Platforms</div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '3px', fontWeight: 500 }}>
                      {tempPlatforms.length === 0
                        ? 'Choose platforms for your profile'
                        : `${tempPlatforms.length} platform${tempPlatforms.length > 1 ? 's' : ''} selected`}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSelectorOpen(false)}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#64748b', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}
                  >×</button>
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    className="plt-search"
                    type="text"
                    placeholder="Search..."
                    onChange={e => {
                      const q = e.target.value.toLowerCase();
                      document.querySelectorAll('.plt-row').forEach(r => {
                        r.style.display = (r.dataset.name || '').includes(q) ? 'flex' : 'none';
                      });
                    }}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 1rem 0.65rem 2.4rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '0.88rem', color: '#0f172a', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  />
                </div>
              </div>

              {/* List */}
              <div className="plt-list" style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>
                {ALL_PLATFORMS.map((p, idx) => {
                  const isActive = tempPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      data-name={p.label.toLowerCase()}
                      className={`plt-row${isActive ? ' plt-active' : ''}`}
                      type="button"
                      onClick={() => togglePlatformInSelector(p.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        gap: '12px', padding: '9px 18px',
                        border: 'none',
                        boxSizing: 'border-box',
                        borderBottom: idx < ALL_PLATFORMS.length - 1 ? '1px solid #f8fafc' : 'none',
                        background: isActive ? '#f0fdf4' : 'transparent',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                        background: p.gradient || p.color || '#6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#ffffff', fontSize: '16px',
                        boxShadow: `0 2px 6px ${(p.color || '#6366f1')}30`
                      }}>
                        {getLinkIcon({ platform: p.id })}
                      </div>

                      {/* Label + desc */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>{p.label}</div>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>
                      </div>

                      {/* Toggle */}
                      {isActive ? (
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 8px rgba(34,197,94,0.35)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      ) : (
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', background: '#fafbfd' }}>
                <button
                  type="button"
                  className="plt-cancel"
                  onClick={() => setIsSelectorOpen(false)}
                  style={{ flex: 1, padding: '0.8rem', borderRadius: '11px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'background 0.15s' }}
                >Cancel</button>
                <button
                  type="button"
                  className="plt-done"
                  onClick={handlePlatformDone}
                  style={{
                    flex: 2, padding: '0.8rem', borderRadius: '11px', border: 'none',
                    background: tempPlatforms.length > 0 ? '#2563eb' : '#cbd5e1',
                    color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                    transition: 'filter 0.15s',
                    boxShadow: tempPlatforms.length > 0 ? '0 4px 14px rgba(37,99,235,0.3)' : 'none'
                  }}
                >
                  {tempPlatforms.length > 0 ? `Add ${tempPlatforms.length} Platform${tempPlatforms.length > 1 ? 's' : ''}` : 'Select Platforms'}
                </button>
              </div>
            </div>
          </div>
        , document.body)}

        {mobileLinkEditPlatform && ReactDOM.createPortal(
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
          onClick={() => {
            setMobileLinkEditPlatform(null);
            if (setMobileLinkEditId) setMobileLinkEditId(null);
          }}>
            <div
              className="dash-mobile-edit-modal"
              aria-label={`Edit ${mobileLinkEditLabel}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                width: '400px',
                maxWidth: 'calc(100vw - 32px)',
                padding: '1.5rem',
                boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxSizing: 'border-box'
              }}
            >
              <div className="dash-mobile-edit-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="dash-mobile-edit-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  {mobileLinkEditMode === 'title' ? `Edit Label` : `Edit ${mobileLinkEditLabel}`}
                </div>
                <button
                  type="button"
                  className="dash-mobile-edit-close"
                  onClick={() => {
                    setMobileLinkEditPlatform(null);
                    if (setMobileLinkEditId) setMobileLinkEditId(null);
                  }}
                  aria-label="Close"
                  style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#64748b', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ×
                </button>
              </div>
              <div className="dash-mobile-edit-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  autoFocus
                  value={mobileLinkEditValue}
                  placeholder={
                    mobileLinkEditMode === 'title' ? 'e.g. My Instagram' :
                    mobileLinkEditPlatform === 'instagram' ? '@handle' :
                    mobileLinkEditPlatform === 'whatsapp' ? 'Phone number' :
                    'Enter URL / handle'
                  }
                  onChange={(e) => setMobileLinkEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setMobileLinkEditPlatform(null);
                      if (setMobileLinkEditId) setMobileLinkEditId(null);
                    }
                    if (e.key === 'Enter') saveMobileLinkField();
                  }}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                />
                <div className="dash-mobile-edit-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="dash-mobile-edit-btn ghost"
                    onClick={() => {
                      setMobileLinkEditPlatform(null);
                      if (setMobileLinkEditId) setMobileLinkEditId(null);
                    }}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="dash-mobile-edit-btn primary"
                    onClick={saveMobileLinkField}
                    disabled={savingLink === mobileLinkEditPlatform || (mobileLinkEditId && savingLink === mobileLinkEditId)}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    {savingLink === mobileLinkEditPlatform || (mobileLinkEditId && savingLink === mobileLinkEditId) ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        , document.body)}
      </div>
    );
  }

  // ── LAPTOP/DESKTOP VIEW: Split Screen Visual Editor ──
  return (
    <div className={`dash-root dash-theme-${dashTheme} dash-font-${dashFont}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#f8fafc',
      color: '#0f172a',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Top Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2.5rem',
        height: '72px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Artist Profile</h1>
          <span style={{ fontSize: '0.92rem', color: '#64748b', fontWeight: 500 }}>({displayEmail})</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {myArtists && myArtists[0] && (() => {
            const profileUrl = `${frontendBase}/artist/${myArtists[0].artistId}`;
            return (
              <>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(profileUrl);
                    setLinkCopiedArtist(true);
                    setTimeout(() => setLinkCopiedArtist(false), 2000);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    padding: '0.55rem 1.1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                >
                  {linkCopiedArtist ? 'Copied!' : 'Copy Profile Link'}
                </button>
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    textDecoration: 'none',
                    padding: '0.55rem 1.1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; }}
                >
                  Visit the Profile
                </a>
              </>
            );
          })()}



          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT PANEL: Flat Iframe Preview, taking up the whole space */}
        <div style={{
          width: '400px',
          flexShrink: 0,
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          position: 'relative',
          height: '100%'
        }}>
          {myArtists && myArtists[0] ? (
            <iframe
              ref={iframeRef}
              key={previewKey}
              onLoad={handleIframeLoad}
              title="Artist Preview"
              src={`${frontendBase}/artist/${myArtists[0].artistId}?no_redirect=1`}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
              Loading profile preview...
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Flex Container containing Editor */}
        <div style={{
          flex: 1,
          display: 'flex',
          background: '#ffffff',
          height: '100%',
          overflow: 'hidden'
        }}>
          
          {/* Active Editor Pane */}
          <div style={{
            flex: 1,
            padding: '3.5rem 3rem',
            overflowY: 'auto',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div style={{ width: '100%', maxWidth: '640px' }}>
              {renderEditorPanel()}
            </div>
          </div>

        </div>

      </div>

      {isSelectorOpen && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 99999,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <style>{`
            @keyframes modalIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            .plt-row { transition: background 0.15s; box-sizing: border-box; }
            .plt-row:hover { background: #f8fafc !important; }
            .plt-row.plt-active { background: #f0fdf4 !important; }
            .plt-row.plt-active:hover { background: #dcfce7 !important; }
            .plt-search:focus { border-color: #2563eb !important; outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important; }
            .plt-cancel:hover { background: #f1f5f9 !important; }
            .plt-done:hover { filter: brightness(1.08); }
            .plt-list::-webkit-scrollbar { width: 4px; }
            .plt-list::-webkit-scrollbar-track { background: transparent; }
            .plt-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
            .plt-list { overflow-x: hidden !important; }
          `}</style>

          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            width: '400px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 48px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            animation: 'modalIn 0.18s ease',
          }}>

            {/* Header */}
            <div style={{ padding: '1.5rem 1.5rem 1.2rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Add Platforms</div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '3px', fontWeight: 500 }}>
                    {tempPlatforms.length === 0
                      ? 'Choose platforms for your profile'
                      : `${tempPlatforms.length} platform${tempPlatforms.length > 1 ? 's' : ''} selected`}
                  </div>
                </div>
                <button
                  onClick={() => setIsSelectorOpen(false)}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#64748b', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}
                >×</button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  className="plt-search"
                  type="text"
                  placeholder="Search..."
                  onChange={e => {
                    const q = e.target.value.toLowerCase();
                    document.querySelectorAll('.plt-row').forEach(r => {
                      r.style.display = (r.dataset.name || '').includes(q) ? 'flex' : 'none';
                    });
                  }}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 1rem 0.65rem 2.4rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '0.88rem', color: '#0f172a', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                />
              </div>
            </div>

            {/* List */}
            <div className="plt-list" style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>
              {ALL_PLATFORMS.map((p, idx) => {
                const isActive = tempPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    data-name={p.label.toLowerCase()}
                    className={`plt-row${isActive ? ' plt-active' : ''}`}
                    type="button"
                    onClick={() => togglePlatformInSelector(p.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: '12px', padding: '9px 18px',
                      border: 'none',
                      boxSizing: 'border-box',
                      borderBottom: idx < ALL_PLATFORMS.length - 1 ? '1px solid #f8fafc' : 'none',
                      background: isActive ? '#f0fdf4' : 'transparent',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      background: p.gradient || p.color || '#6366f1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#ffffff', fontSize: '16px',
                      boxShadow: `0 2px 6px ${(p.color || '#6366f1')}30`
                    }}>
                      {getLinkIcon({ platform: p.id })}
                    </div>

                    {/* Label + desc */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>{p.label}</div>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>
                    </div>

                    {/* Toggle */}
                    {isActive ? (
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 8px rgba(34,197,94,0.35)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    ) : (
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', background: '#fafbfd' }}>
              <button
                type="button"
                className="plt-cancel"
                onClick={() => setIsSelectorOpen(false)}
                style={{ flex: 1, padding: '0.8rem', borderRadius: '11px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'background 0.15s' }}
              >Cancel</button>
              <button
                type="button"
                className="plt-done"
                onClick={handlePlatformDone}
                style={{
                  flex: 2, padding: '0.8rem', borderRadius: '11px', border: 'none',
                  background: tempPlatforms.length > 0 ? '#2563eb' : '#cbd5e1',
                  color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                  transition: 'filter 0.15s',
                  boxShadow: tempPlatforms.length > 0 ? '0 4px 14px rgba(37,99,235,0.3)' : 'none'
                }}
              >
                {tempPlatforms.length > 0 ? `Add ${tempPlatforms.length} Platform${tempPlatforms.length > 1 ? 's' : ''}` : 'Select Platforms'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {mobileLinkEditPlatform && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 99999,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
        onClick={() => {
          setMobileLinkEditPlatform(null);
          if (setMobileLinkEditId) setMobileLinkEditId(null);
        }}>
          <div
            className="dash-mobile-edit-modal"
            aria-label={`Edit ${mobileLinkEditLabel}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              width: '400px',
              maxWidth: 'calc(100vw - 32px)',
              padding: '1.5rem',
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxSizing: 'border-box'
            }}
          >
            <div className="dash-mobile-edit-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="dash-mobile-edit-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                {mobileLinkEditMode === 'title' ? `Edit Label` : `Edit ${mobileLinkEditLabel}`}
              </div>
              <button
                type="button"
                className="dash-mobile-edit-close"
                onClick={() => {
                  setMobileLinkEditPlatform(null);
                  if (setMobileLinkEditId) setMobileLinkEditId(null);
                }}
                aria-label="Close"
                style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#64748b', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
            </div>
            <div className="dash-mobile-edit-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                autoFocus
                value={mobileLinkEditValue}
                placeholder={
                  mobileLinkEditMode === 'title' ? 'e.g. My Instagram' :
                  mobileLinkEditPlatform === 'instagram' ? '@handle' :
                  mobileLinkEditPlatform === 'whatsapp' ? 'Phone number' :
                  'Enter URL / handle'
                }
                onChange={(e) => setMobileLinkEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setMobileLinkEditPlatform(null);
                    if (setMobileLinkEditId) setMobileLinkEditId(null);
                  }
                  if (e.key === 'Enter') saveMobileLinkField();
                }}
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
              />
              <div className="dash-mobile-edit-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="dash-mobile-edit-btn ghost"
                  onClick={() => {
                    setMobileLinkEditPlatform(null);
                    if (setMobileLinkEditId) setMobileLinkEditId(null);
                  }}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="dash-mobile-edit-btn primary"
                  onClick={saveMobileLinkField}
                  disabled={savingLink === mobileLinkEditPlatform || (mobileLinkEditId && savingLink === mobileLinkEditId)}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  {savingLink === mobileLinkEditPlatform || (mobileLinkEditId && savingLink === mobileLinkEditId) ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {showUsernamePopup && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 999999,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '450px',
            maxWidth: 'calc(100vw - 32px)',
            padding: '2.5rem 2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxSizing: 'border-box',
            fontFamily: "'Outfit', sans-serif",
            color: '#0f172a'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                Welcome to <span style={{ color: '#2563eb' }}>nano</span>
              </div>
              <p style={{ fontSize: '0.92rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Please choose a unique username to generate your Indian mock artist profile. You can edit everything later!
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Username / Artist ID
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 500, fontSize: '0.95rem' }}>
                  @
                </span>
                <input
                  type="text"
                  placeholder="username"
                  value={localUsername}
                  onChange={handleUsernameChange}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.8rem 1rem 0.8rem 2rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${availabilityError ? '#ef4444' : isAvailable === true ? '#10b981' : '#e2e8f0'}`,
                    background: '#f8fafc',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                />
              </div>
              {availabilityError && (
                <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 500 }}>
                  {availabilityError}
                </span>
              )}
              {isChecking && (
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                  Checking availability...
                </span>
              )}
              {!isChecking && isAvailable === true && (
                <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 500 }}>
                  ✓ Username is available!
                </span>
              )}
            </div>

            {popupError && (
              <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#b91c1c', fontSize: '0.82rem', fontWeight: 500 }}>
                {popupError}
              </div>
            )}

            <button
              onClick={handleSubmitUsername}
              disabled={submitting || !isAvailable || isChecking}
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: '12px',
                border: 'none',
                background: (!isAvailable || isChecking) ? '#cbd5e1' : '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: (!isAvailable || isChecking) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                margin: 0
              }}
            >
              {submitting ? 'Creating Artist Profile...' : 'Claim Username & Create Artist Profile'}
            </button>
          </div>
        </div>
      , document.body)}

      {/* Image Cropper */}
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
