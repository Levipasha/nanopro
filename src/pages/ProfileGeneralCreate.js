/**
 * ProfileGeneralCreate.js
 * Auto-split from Profile.js â€” all state and handlers remain in Profile.js
 * and are passed as props. Do NOT add useState/useEffect here.
 */
import React from 'react';
import './GeneralOnboarding.css';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import ImageCropperModal from '../components/profile/ImageCropperModal';
import { getLinkIcon } from '../components/LinkIcons';
import { GENERAL_THEMES, AVAILABLE_FONTS, resolveFontFamily } from '../constants/generalThemes';
import PhoneINInput from '../components/PhoneINInput';
import { getINDisplayDigits, toINFullPhone, getINDisplayDigitsFromWhatsAppStored, toWhatsAppUrlFromINPhone } from '../utils/indianPhone';
import { fixImageUrl } from '../utils/imageHelper';
import PlatformIconSelect from '../components/PlatformIconSelect';
import { generalProfileAPI } from '../services/api';
import {
  ALL_PLATFORMS, PremiumToggle, LivePreviewSyncOverlay, RestaurantPublicPreviewIframe,
  buildLinkUrl, SMART_PLATFORMS, MAX_PLATFORM_LINKS, titleForRestaurantLinkPlatform
} from './ProfileHelpers';


export default function ProfileGeneralCreate(props) {
  const usernameCheckTimer = React.useRef(null);
  // Destructure all props passed from Profile.js
  const {
    isLoggedIn, isGeneralMode,
    // auth / user
    user, displayName, displayEmail, avatarLetter, handleLogout,
    // shared state
    cropper, setCropper, isMobileViewport, error, loading,
    // artist
    artist, myArtists, setMyArtists, editingArtist, setEditingArtist,
    activeTab, setActiveTab, dashTheme, dashFont,
    formData, setFormData, saving, setSaving,
    photoFile, setPhotoFile, bgFile, setBgFile,
    previewKey, setPreviewKey, frontendBase,
    onboardingStep, handleOnboardingBack, handleOnboardingNext, handleOnboardingComplete,
    isOnboardingSelectorOpen, setIsOnboardingSelectorOpen,
    onboardingPlatforms, setOnboardingPlatforms,
    onboardingGalleryFiles, setOnboardingGalleryFiles,
    newGalleryName, setNewGalleryName, newGalleryFile, setNewGalleryFile,
    galleryUploading, setGalleryUploading,
    isSelectorOpen, setIsSelectorOpen, tempPlatforms, setTempPlatforms,
    savingLink, setSavingLink, pendingLinks, setPendingLinks,
    editingHeroField, setEditingHeroField, heroUpdates, setHeroUpdates,
    isAddingTag, setIsAddingTag, newTagText, setNewTagText,
    inlineEditing, setInlineEditing, inlineEditValue, setInlineEditValue,
    openSubPanel, setOpenSubPanel, layoutActiveTab, setLayoutActiveTab,
    designSubTab, setDesignSubTab, syncFonts, setSyncFonts,
    linkCopiedArtist, setLinkCopiedArtist,
    mobileHeroEditField, setMobileHeroEditField,
    mobileLinkEditPlatform, setMobileLinkEditPlatform,
    mobileLinkEditLabel, setMobileLinkEditLabel,
    mobileLinkEditValue, setMobileLinkEditValue,
    mobileLinkEditMode, setMobileLinkEditMode,
    mobileHeroDraft, setMobileHeroDraft,
    isUploading, setIsUploading,
    artQrModal, setArtQrModal,
    showArtGallery, setShowArtGallery,
    artGallerySelectedItem, setArtGallerySelectedItem,
    newArtTheme, setNewArtTheme, artSaving, setArtSaving,
    artImagePreview, setArtImagePreview,
    artistsLoading, artistListReady,
    // handlers
    addLink, removeLink,
    handleSave, handleInputChange, handleUpdateLink, handleUpdateHeroField,
    handleAddTag, handleDeleteTag, handleUpdateLinkLabel, handleUpdateLinkImage,
    handleRemoveLinkImage, handleUpdateLinkLayout, handleUpdateLinkPrioritize,
    handleUploadField, handleAddGalleryItem, handleAddMultipleGalleryItems,
    handleRemoveGalleryItem, togglePlatformInSelector, handlePlatformDone,
    handlePickAndCrop, handlePickAndCropBatch,
    saveMobileHeroField, saveMobileLinkField, saveRestaurantHeroEdit,
    fetchLinkMetadata,
    // refs
    artistGalleryInputRef, artistProfilePhotoInputRef, artistBannerPhotoInputRef,
    artistGalleryAddInputRef, restaurantBannerInputRef, restaurantGalleryInputRef,
    restaurantMenuInputRef, genPhotoInputRef, genGalleryInputRef, genDashBannerInputRef,
    genDashPhotoInputRef, genDashChangePhotoInputRef,
    // artist art
    removeGalleryItem, addGalleryItem, setGalleryItemName, closeEdit,
    // general
    generalProfile, generalProfileLoading, generalStep, setGeneralStep,
    generalOnboardingStep, updateGeneralOnboardingStep, isGeneralPlatformSelectorOpen,
    setIsGeneralPlatformSelectorOpen, generalForm, setGeneralForm,
    generalPhotoPreviewUrl, generalBannerPreviewUrl,
    generalSaving, generalSuccess, setGeneralSuccess,
    generalActiveTab, setGeneralActiveTab,
    suggestionsChanged, setSuggestionsChanged,
    profileChanged, setProfileChanged, linksChanged, setLinksChanged,
    usernameCheck, setUsernameCheck, availabilitySuggestions, getFileAfterCropOrPassThrough,
    updateLink, updateSuggestion, handleSuggestionImageUpload,
    handleGeneralFieldSave, handleGeneralPhotoSave, handleGeneralBannerSave,
    handleGeneralSaveAll, handleGeneralCreate, handleGeneralThemeSelect,
    generalDesignSubTab, setGeneralDesignSubTab, generalProfileRef,
    linkCopiedGeneral, setLinkCopiedGeneral,
    generalPhotoFile, setGeneralPhotoFile,
    generalBannerFile, setGeneralBannerFile,
    // restaurant
    restaurantProfile, setRestaurantProfile, restaurantOnboardingStep,
    updateRestaurantOnboardingStep, restaurantActiveTab, setRestaurantActiveTab,
    restaurantSaving, setRestaurantSaving, restaurantChanged, setRestaurantChanged,
    restaurantGalleryUploading, setRestaurantGalleryUploading,
    restaurantBannerUploading, setRestaurantBannerUploading,
    rBioEditing, setRBioEditing, rBioDraft, setRBioDraft,
    rHeroEditingField, setRHeroEditingField,
    rHeroDraftName, setRHeroDraftName, rHeroDraftTagline, setRHeroDraftTagline,
    rLinkSelectorOpen, setRLinkSelectorOpen, rTempPlatforms, setRTempPlatforms,
    rSyncFonts, setRSyncFonts,
    saveRestaurantProfile, handleRestaurantPublish,
    handlePdfUpload, handleRestaurantBannerUpload, handleRestaurantBannerChangeDashboard,
    pdfNumPages, onPdfLoadSuccess, restaurantForm, setRestaurantForm,
    startRestaurantHeroEdit, persistRestaurant, linkCopiedRest, setLinkCopiedRest,
    handleUpdateHeroFieldRest, rLinkEditOpen, setRLinkEditOpen,
    restaurantBannerFile, restaurantGalleryFile,
    setupLoader, getProfileLink,
    artistChanged, setArtistChanged,
    // misc
    GENERAL_THEMES: _gt, visiblePlatforms, setVisiblePlatforms,
  } = props;

  const [formStep, setFormStep] = React.useState(1);

  // General Profile: create form (first-time setup only)
  if (isLoggedIn && isGeneralMode && (generalStep === 'create') && !generalProfileLoading) {
    return (
      <div className="profile-page profile-login-wrap onboarding-screen">
        <div className="general-onboarding-card" style={{ maxWidth: '580px' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '3px', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 2px 0 #C8001A' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#F7F3EE" strokeWidth="2" width="24" height="24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, fontStyle: 'italic', color: '#0A0A0A', margin: '0 0 0.35rem', letterSpacing: '-0.01em' }}>
              {formStep === 1 ? 'Step 1: Your Identity' : formStep === 2 ? 'Step 2: Profile Details' : 'Step 3: Connect Links'}
            </h2>
            <p style={{ color: '#9A9490', fontSize: '0.75rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {formStep === 1 ? 'Set up your name, photo, and link username' : formStep === 2 ? 'Tell us more about yourself' : 'Connect your social links'}
            </p>
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
          <form onSubmit={handleGeneralCreate}>
            {error && <div style={{ background: 'rgba(200,0,26,0.07)', border: '1px solid rgba(200,0,26,0.25)', borderRadius: '2px', color: '#C8001A', padding: '0.7rem 1rem', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 600 }}>{error}</div>}

            {formStep === 1 && (
              <div className="onboarding-fields fade-in">
                {/* Profile Photo */}
                <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
                  <label style={{ display: 'block', marginBottom: '0.65rem', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.06em', color: '#0A0A0A' }}>Profile Photo</label>
                  <div className="image-upload-box" style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="upload-trigger-btn"
                      onClick={() => { if (genPhotoInputRef.current) { genPhotoInputRef.current.value = ''; genPhotoInputRef.current.click(); } }}
                      aria-label="Upload profile photo"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      <div className="upload-preview-circle dash-avatar-trigger" style={{ position: 'relative', overflow: 'hidden', width: '110px', height: '110px', borderRadius: '50%', border: '2px dashed #C8001A', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EDE8E2', transition: 'all 0.2s ease', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                        {(generalForm.photo || generalPhotoFile) ? <img src={generalPhotoPreviewUrl || generalForm.photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#C8001A', fontSize: '2rem', fontWeight: 300 }}>+</span>}
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
                      accept="image/*"
                      onChange={e => handlePickAndCrop(e, 1, (file) => setGeneralPhotoFile(file))}
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="onboarding-field">
                  <label>Name</label>
                  <input className="onboarding-input" name="name" value={generalForm.name} onChange={(e) => setGeneralForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Your name" required />
                </div>

                {/* Username */}
                <div className="onboarding-field">
                  <label>Username (for your link)</label>
                  <div style={{ position: 'relative' }}>
                    <input className="onboarding-input" name="username" value={generalForm.username}
                      style={{ paddingRight: '2.5rem', borderColor: usernameCheck.status === 'available' ? '#10b981' : (usernameCheck.status === 'taken' || usernameCheck.status === 'invalid') ? '#ef4444' : undefined }}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                        setGeneralForm(prev => ({ ...prev, username: val }));
                        clearTimeout(usernameCheckTimer.current);
                        if (!val || val.length < 3) { setUsernameCheck(val ? { status: 'invalid', msg: 'At least 3 characters' } : { status: 'idle', msg: '' }); return; }
                        if (val === generalProfile?.username) { setUsernameCheck({ status: 'available', msg: 'Current username' }); return; }
                        setUsernameCheck({ status: 'checking', msg: '' });
                        usernameCheckTimer.current = setTimeout(async () => {
                          try {
                            const res = await generalProfileAPI.checkAvailability({ username: val });
                            if (res.conflicts && res.conflicts.username) {
                              setUsernameCheck({ status: 'taken', msg: res.conflicts.username });
                            } else {
                              setUsernameCheck({ status: 'available', msg: 'Available!' });
                            }
                          }
                          catch {
                            setUsernameCheck({ status: 'available', msg: 'Available!' });
                          }
                        }, 500);
                      }}
                      placeholder="myprofile" required
                    />
                    {usernameCheck.status === 'checking' && <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}>...</span>}
                    {usernameCheck.status === 'available' && <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontSize: '1rem' }}>✓</span>}
                    {(usernameCheck.status === 'taken' || usernameCheck.status === 'invalid') && <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444', fontSize: '1rem' }}>✕</span>}
                  </div>
                  {usernameCheck.msg && usernameCheck.status !== 'idle' && usernameCheck.status !== 'checking' && (
                    <small style={{ color: usernameCheck.status === 'available' ? '#10b981' : '#ef4444', fontSize: '0.78rem', marginTop: '0.2rem', display: 'block' }}>{usernameCheck.msg}</small>
                  )}
                  <small className="onboarding-tip">Your link: <b>{process.env.REACT_APP_DOMAIN || 'nanoprofile.com'}/link/{generalForm.username || 'username'}</b></small>
                </div>

                {/* Step 1 Actions */}
                <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
                  <button type="button" className="onboarding-btn-primary" onClick={() => setFormStep(2)} disabled={!generalForm.name.trim() || !generalForm.username.trim() || usernameCheck.status !== 'available'}>
                    Next Step →
                  </button>
                </div>
              </div>
            )}

            {formStep === 2 && (
              <div className="onboarding-fields fade-in">
                {/* Title / Tagline / What I Do */}
                <div className="onboarding-field">
                  <label>Tagline / What I Do</label>
                  <input className="onboarding-input" name="title" value={generalForm.title} onChange={(e) => setGeneralForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Creator, Founder" />
                </div>

                {/* Bio */}
                <div className="onboarding-field">
                  <label>Bio / About</label>
                  <textarea className="onboarding-textarea" name="bio" value={generalForm.bio} onChange={(e) => setGeneralForm(prev => ({ ...prev, bio: e.target.value }))} rows={3} placeholder="A short bio about you..." />
                </div>

                {/* Mobile Number */}
                <div className="onboarding-field">
                  <label>Mobile Number</label>
                  <PhoneINInput wrapClassName="onboarding-phone-in" value={generalForm.phone} onChange={(v) => setGeneralForm(prev => ({ ...prev, phone: v }))} />
                </div>

                {/* Email Address (Uneditable) */}
                <div className="onboarding-field">
                  <label>Email (Uneditable)</label>
                  <input className="onboarding-input" value={displayEmail || user?.email || ''} readOnly style={{ opacity: 0.65, cursor: 'not-allowed', background: 'rgba(10,10,10,0.04)', color: '#0A0A0A' }} />
                </div>

                {/* Step 2 Actions */}
                <div className="onboarding-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <button type="button" className="onboarding-btn-primary" onClick={() => setFormStep(1)} style={{ flex: 1, background: '#EDE8E2', color: '#0A0A0A', border: '1px solid #0A0A0A' }}>
                    ← Back
                  </button>
                  <button type="button" className="onboarding-btn-primary" onClick={() => setFormStep(3)} style={{ flex: 2 }}>
                    Next Step →
                  </button>
                </div>
              </div>
            )}

            {formStep === 3 && (
              <div className="onboarding-fields fade-in">
                {/* Links */}
                <div className="onboarding-field">
                  <label>Links</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.65rem' }}>
                    {generalForm.links.map((link, idx) => (
                      <div key={idx} className="general-onboarding-dash-link" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                        <button type="button" onClick={() => removeLink(idx)} className="general-onboarding-dash-remove">✕</button>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <PlatformIconSelect value={link.platform || 'website'} onChange={(val) => updateLink(idx, 'platform', val)} />
                        </div>
                        <input className="onboarding-input" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} placeholder="Title (e.g. My Website)" value={link.title || ''} onChange={(e) => updateLink(idx, 'title', e.target.value)} />
                        {link.platform === 'whatsapp' && (
                          <>
                            <PhoneINInput wrapClassName="onboarding-phone-in" value={toINFullPhone(getINDisplayDigits(link.waPhone || ''))} onChange={(v) => updateLink(idx, 'waPhone', v)} />
                            <input className="onboarding-input" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} placeholder="Pre-filled message (optional)" value={link.waMessage || ''} onChange={(e) => updateLink(idx, 'waMessage', e.target.value)} />
                          </>
                        )}
                        {(link.platform === 'instagram' || link.platform === 'twitter' || link.platform === 'tiktok' || link.platform === 'snapchat' || link.platform === 'threads') && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className="general-onboarding-input-prefix">@</span>
                            <input className="onboarding-input" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} placeholder="username" value={link.platformUsername || ''} onChange={(e) => updateLink(idx, 'platformUsername', e.target.value)} />
                          </div>
                        )}
                        {link.platform === 'telegram' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className="general-onboarding-input-prefix">t.me/</span>
                            <input className="onboarding-input" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} placeholder="username" value={link.platformUsername || ''} onChange={(e) => updateLink(idx, 'platformUsername', e.target.value)} />
                          </div>
                        )}
                        {!SMART_PLATFORMS.includes(link.platform || '') && (
                          <input className="onboarding-input" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} placeholder="https://..." value={link.url || ''} onChange={(e) => updateLink(idx, 'url', e.target.value)} />
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addLink} className="general-onboarding-add-platforms">
                    <span style={{ fontSize: '1.2rem', fontWeight: 400 }}>+</span> Add Link
                  </button>
                </div>

                {/* Step 3 Actions */}
                <div className="onboarding-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <button type="button" className="onboarding-btn-primary" onClick={() => setFormStep(2)} style={{ flex: 1, background: '#EDE8E2', color: '#0A0A0A', border: '1px solid #0A0A0A' }}>
                    ← Back
                  </button>
                  <button type="submit" className="onboarding-btn-primary" disabled={generalSaving} style={{ flex: 2 }}>
                    {generalSaving ? 'Creating profile…' : 'Create profile →'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <button type="button" onClick={handleLogout} className="profile-logout-btn-link" style={{ marginTop: '1rem' }}>Sign out</button>
        </div>

        {cropper.open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000000 }}>
            <ImageCropperModal image={cropper.image} aspect={cropper.aspect} onSave={cropper.onComplete} onCancel={cropper.onCancel} />
          </div>
        )}
      </div>
    );
  }
  return null;
}