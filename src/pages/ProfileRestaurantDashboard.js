/**
 * ProfileRestaurantDashboard.js
 * Auto-split from Profile.js â€” all state and handlers remain in Profile.js
 * and are passed as props. Do NOT add useState/useEffect here.
 */
import React from 'react';
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
import {
  ALL_PLATFORMS, PremiumToggle, LivePreviewSyncOverlay, RestaurantPublicPreviewIframe,
  buildLinkUrl, SMART_PLATFORMS, MAX_PLATFORM_LINKS, titleForRestaurantLinkPlatform,
  extractUploadUrl
} from './ProfileHelpers';
import { generalProfileAPI } from '../services/api';
import { getIdToken } from '../firebase';
import { assertGalleryFileKind } from '../utils/galleryMedia';
import DashProfileLayout from '../components/DashProfileLayout';


export default function ProfileRestaurantDashboard(props) {
  // Destructure all props passed from Profile.js
  const {
    // auth / user
    isLoggedIn, isRestaurantMode,
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
    usernameCheck, availabilitySuggestions,
    updateLink, updateSuggestion, handleSuggestionImageUpload,
    handleGeneralFieldSave, handleGeneralPhotoSave, handleGeneralBannerSave,
    handleGeneralSaveAll, handleGeneralCreate, handleGeneralThemeSelect,
    generalDesignSubTab, setGeneralDesignSubTab, generalProfileRef,
    linkCopiedGeneral, setLinkCopiedGeneral,
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
    pdfNumPages, setPdfNumPages, onPdfLoadSuccess, restaurantForm, setRestaurantForm,
    startRestaurantHeroEdit, persistRestaurant, linkCopiedRest, setLinkCopiedRest,
    handleUpdateHeroFieldRest, rLinkEditOpen, setRLinkEditOpen,
    restaurantBannerFile, restaurantGalleryFile,
    setupLoader, getProfileLink,
    artistChanged, setArtistChanged,
    setProfileMode, setProfileLock, setChoiceSource,
    // misc
    GENERAL_THEMES: _gt, visiblePlatforms, setVisiblePlatforms,
  } = props;

  const restaurantProfileRef = React.useRef(restaurantProfile);
  restaurantProfileRef.current = restaurantProfile;

  if (isLoggedIn && isRestaurantMode && restaurantProfile && restaurantOnboardingStep === 0) {
    return (
      <DashProfileLayout className={`dash-root dash-theme-${dashTheme} dash-font-${dashFont} dash-tab-${restaurantActiveTab}`}>
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
                className={`dash-nav-item ${restaurantActiveTab === 'menu' ? 'dash-nav-active' : ''}`}
                onClick={() => setRestaurantActiveTab('menu')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                Menu
              </button>
            </div>
          </nav>

          <div className="dash-sidebar-bottom" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            {setProfileMode && (
              <button
                className="dash-sidebar-signout-btn"
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  marginBottom: '0.25rem'
                }}
                onClick={() => {
                  try {
                    localStorage.removeItem('profile_type_lock');
                    localStorage.removeItem('profile_mode');
                  } catch (e) {}
                  if (setProfileLock) setProfileLock(null);
                  if (setChoiceSource) setChoiceSource('manual');
                  setProfileMode('choice');
                }}
              >
                Switch Profile Type
              </button>
            )}
            <button className="dash-sidebar-signout-btn" onClick={handleLogout}>Sign out</button>
          </div>
        </aside>

        {/* Main */}
        <main className="dash-main">
          <header className="dash-main-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem', padding: '1.25rem 2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', width: '100%' }}>
              <h1 className="dash-main-title" style={{ margin: 0, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '1.5rem' }}>
                {restaurantActiveTab === 'menu' ? 'Menu' : 'Restaurant Dashboard'}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const url = restaurantProfile?.username ? `${frontendBase}/link/${restaurantProfile.username}` : frontendBase;
                    navigator.clipboard.writeText(url);
                    setLinkCopiedRest(true);
                    setTimeout(() => setLinkCopiedRest(false), 2000);
                  }}
                  className="dash-icon-pill"
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    padding: '0.5rem 1.25rem',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
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
                  href={restaurantProfile.username ? `${frontendBase}/link/${restaurantProfile.username}` : '#'}
                  target={restaurantProfile.username ? "_blank" : undefined}
                  rel="noreferrer"
                  className="dash-icon-pill"
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    padding: '0.5rem 1.25rem',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                  aria-label="Open profile link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                  </svg>
                  <span>Go to Profile</span>
                </a>

                <button
                  onClick={() => {
                    persistRestaurant(restaurantProfile);
                    setRestaurantChanged(false);
                  }}
                  disabled={restaurantSaving}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    background: restaurantChanged ? '#0070f3' : '#ffffff',
                    color: restaurantChanged ? '#ffffff' : '#000000',
                    border: restaurantChanged ? '1px solid #0070f3' : '1px solid #e2e8f0',
                    cursor: restaurantSaving ? 'wait' : 'pointer',
                    opacity: restaurantSaving ? 0.7 : 1,
                    transition: 'all 0.2s',
                    boxShadow: restaurantChanged ? '0 4px 12px 0 rgba(0,118,243,0.3)' : 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {restaurantSaving ? '...' : 'Save Changes'}
                </button>
              </div>
            </div>
            <p className="dash-main-subtitle" style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
              {restaurantActiveTab === 'menu' ? 'Upload and manage your restaurant menu PDF' : 'Manage your restaurant profile and contact information'}
            </p>
          </header>

          <div className="dash-content">
            {/* ── PROFILE & MENU TAB ── */}
            {restaurantActiveTab === 'info' && (
              <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden', minHeight: '0' }}>
                {/* Left: profile info */}
                <div className="dash-single-profile" style={{ padding: '1.5rem 0', overflowY: 'auto' }}>
                  <div style={{ padding: isMobileViewport ? '0' : '0 2.5rem' }}>


                  <div
                    className="dash-profile-hero dash-profile-hero--restaurant"
                    style={{
                      display: 'flex',
                      flexDirection: isMobileViewport ? 'column' : 'row',
                      gap: '2rem',
                      background: 'var(--dash-bg-card)',
                      border: '1px solid var(--dash-border)',
                      borderRadius: '20px',
                      padding: '1.5rem',
                      alignItems: 'stretch',
                      position: 'relative'
                    }}
                  >
                    {/* Left Column: Banner Image */}
                    <div
                      style={{
                        flex: '1.2',
                        width: '100%',
                        aspectRatio: '16/9',
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '12px',
                        border: '1px solid var(--dash-border)'
                      }}
                    >
                      {restaurantProfile.banner ? (
                        <img
                          src={fixImageUrl(restaurantProfile.banner) || restaurantProfile.banner}
                          alt="Restaurant Banner"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            zIndex: 1
                          }}
                        />
                      ) : (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg,#fceabb,#f8b500)', zIndex: 1 }} />
                      )}
                      <LivePreviewSyncOverlay show={restaurantBannerUploading} message="Uploading banner…" />
                    </div>

                    <input
                      ref={restaurantBannerInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                      style={{ display: 'none' }}
                      onChange={(e) => { if (!restaurantBannerUploading) handlePickAndCrop(e, 16 / 9, handleRestaurantBannerChangeDashboard); }}
                    />

                    {/* Right Column: Name, Username, Change Banner, Tagline */}
                    <div
                      style={{
                        flex: '1',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: '0.85rem',
                        alignItems: 'flex-start'
                      }}
                    >
                      {/* Name */}
                      {rHeroEditingField === 'name' ? (
                        <div className="dash-hero-editable-wrapper" style={{ width: '100%' }}>
                          <div className="dash-hero-edit-row" style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                            <input
                              className="dash-hero-inline-input name"
                              autoFocus
                              value={rHeroDraftName}
                              onChange={(e) => setRHeroDraftName(e.target.value)}
                              style={{
                                flex: 1,
                                background: 'var(--dash-bg)',
                                color: 'var(--dash-text)',
                                border: '1px solid var(--dash-border)',
                                borderRadius: '8px',
                                padding: '0.5rem'
                              }}
                            />
                            <button
                              type="button"
                              onClick={saveRestaurantHeroEdit}
                              style={{
                                background: '#6366f1',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                fontWeight: 700
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <h2
                          className="dash-restaurant-hero-name"
                          onClick={() => startRestaurantHeroEdit('name')}
                          style={{
                            cursor: 'pointer',
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            color: 'var(--dash-text)',
                            margin: 0,
                            background: 'transparent',
                            border: 'none',
                            boxShadow: 'none',
                            padding: 0
                          }}
                        >
                          <span style={{ borderBottom: '1px dashed var(--dash-accent)' }}>{restaurantProfile.name || 'Add restaurant name'}</span>
                        </h2>
                      )}

                      {/* Username */}
                      <p style={{ color: 'var(--dash-subtext)', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
                        @{restaurantProfile.username}
                      </p>

                      {/* Change Banner Button */}
                      <button
                        type="button"
                        className="dash-icon-pill upload-trigger-btn"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={() => { if (restaurantBannerInputRef.current) { restaurantBannerInputRef.current.value = ''; restaurantBannerInputRef.current.click(); } }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Change Banner
                      </button>

                      {/* Tagline */}
                      {rHeroEditingField === 'tagline' ? (
                        <div className="dash-hero-editable-wrapper" style={{ width: '100%', marginTop: '0.25rem' }}>
                          <div className="dash-hero-edit-row" style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                            <input
                              className="dash-hero-inline-input tagline"
                              autoFocus
                              value={rHeroDraftTagline}
                              onChange={(e) => setRHeroDraftTagline(e.target.value)}
                              style={{
                                flex: 1,
                                background: 'var(--dash-bg)',
                                color: 'var(--dash-text)',
                                border: '1px solid var(--dash-border)',
                                borderRadius: '8px',
                                padding: '0.5rem'
                              }}
                            />
                            <button
                              type="button"
                              onClick={saveRestaurantHeroEdit}
                              style={{
                                background: '#6366f1',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                fontWeight: 700
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p
                          onClick={() => startRestaurantHeroEdit('tagline')}
                          style={{
                            cursor: 'pointer',
                            margin: '0.25rem 0 0 0',
                            color: 'var(--dash-subtext)',
                            fontSize: '0.95rem',
                            fontWeight: 500
                          }}
                        >
                          <span style={{ borderBottom: '1px dashed var(--dash-accent)' }}>{restaurantProfile.tagline || 'Add tagline...'}</span>
                        </p>
                      )}
                    </div>
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
                          onChange={e => {
                            setRBioDraft(e.target.value);
                            setRestaurantChanged(true);
                          }}
                          placeholder="Tell customers about your restaurant..."
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--dash-accent)', background: 'var(--dash-bg-card)', color: 'var(--dash-text)', fontSize: '0.95rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button type="button" onClick={() => setRBioEditing(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--dash-subtext)', border: '1px solid var(--dash-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Done</button>
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
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ color: 'var(--dash-subtext)', flexShrink: 0, marginTop: '1.35rem' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.72 16z" /></svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--dash-subtext)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Phone</div>
                        <PhoneINInput
                          wrapClassName="dash-hero-phone-in"
                          value={restaurantProfile.phone || ''}
                          onChange={(full) => {
                            const updated = { ...restaurantProfile, phone: full };
                            setRestaurantProfile(updated);
                            setRestaurantChanged(true);
                            persistRestaurant(updated);
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.85rem 1rem', background: 'var(--dash-bg-card)', border: '1px solid var(--dash-border)', borderRadius: '12px' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ color: 'var(--dash-subtext)', flexShrink: 0, marginTop: '0.35rem' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
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
                      {(restaurantProfile.gallery || []).length < 4 && (
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
                                const pickedCount = e.target.files?.length || 0;
                                if (pickedCount === 0) return;

                                const currentLimit = 4;
                                const existingCount = (restaurantProfile.gallery || []).length;
                                if (existingCount >= currentLimit) {
                                  alert(`Only ${currentLimit} images are allowed.`);
                                  e.target.value = '';
                                  return;
                                }

                                handlePickAndCropBatch(e, 1, async (croppedFile) => {
                                  setRestaurantGalleryUploading(true);
                                  try {
                                    // Refresh restaurantProfile within the callback to get latest state
                                    const latest = restaurantProfileRef.current || restaurantProfile;
                                    if ((latest.gallery || []).length >= currentLimit) return;

                                    assertGalleryFileKind(croppedFile);
                                    const up = await generalProfileAPI.uploadPhoto(croppedFile, () => getIdToken());
                                    const url = extractUploadUrl(up);
                                    if (!url) return;

                                    const existing = latest.gallery || [];
                                    const base = (croppedFile.name || '').replace(/\.[^.]+$/, '') || `Gallery ${existing.length + 1}`;
                                    const updated = { ...latest, gallery: [...existing, { url, name: base }] };

                                    setRestaurantProfile(updated);
                                    persistRestaurant(updated);
                                    await handleRestaurantPublish(updated, { silent: true });
                                  } catch (err) {
                                    console.error('Restaurant gallery item upload:', err);
                                  } finally {
                                    setRestaurantGalleryUploading(false);
                                  }
                                });
                              }}
                            />
                            <span style={{ cursor: restaurantGalleryUploading ? 'wait' : 'pointer', color: '#6366f1', fontWeight: 600, fontSize: '0.85rem', opacity: restaurantGalleryUploading ? 0.7 : 1 }}>{restaurantGalleryUploading ? 'Uploading…' : '+ Add images or GIFs'}</span>
                          </button>
                        </>
                      )}
                    </div>
                    {(restaurantProfile.gallery || []).length === 0 ? (
                      <div style={{ padding: '2rem', border: '2px dashed var(--dash-border)', borderRadius: '16px', textAlign: 'center', color: 'var(--dash-subtext)', fontSize: '0.9rem' }}>
                        No gallery images yet. Add up to 4.
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
                </div>

                {/* Right: live preview = same public page as /link/:username (desktop only) */}
                {!isMobileViewport && (
                  <div className="dash-preview-panel">
                    <RestaurantPublicPreviewIframe username={restaurantProfile.username} previewKey={previewKey} bannerSyncing={restaurantBannerUploading} />
                  </div>
                )}
              </div>
            )}



            {/* ── MENU TAB ── */}
            {restaurantActiveTab === 'menu' && (
              <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden', minHeight: '0' }}>
                {/* Left: PDF upload & viewer */}
                <div className="dash-single-profile" style={{ padding: '2.5rem 0', overflowY: 'auto' }}>
                  <div style={{ padding: isMobileViewport ? '0' : '0 2.5rem' }}>
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
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
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
              {setProfileMode && (
                <button
                  type="button"
                  className="dash-mobile-bottom-btn"
                  onClick={() => {
                    try {
                      localStorage.removeItem('profile_type_lock');
                      localStorage.removeItem('profile_mode');
                    } catch (e) {}
                    if (setProfileLock) setProfileLock(null);
                    if (setChoiceSource) setChoiceSource('manual');
                    setProfileMode('choice');
                  }}
                >
                  <div className="dash-mobile-bottom-btn-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 2.1l4 4-4 4" />
                      <path d="M3 12.2v-2a4 4 0 0 1 4-4h14" />
                    </svg>
                  </div>
                  <span>Switch</span>
                </button>
              )}
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
      </DashProfileLayout>
    );
  }
  return null;
}