/**
 * ProfileGeneralOnboarding.js
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


const formatSentenceCase = (text) => {
  if (!text) return '';
  let formatted = text.replace(/,([^\s])/g, ', $1');
  formatted = formatted.replace(/^(\s*)([a-z])/i, (match, space, letter) => space + letter.toUpperCase());
  formatted = formatted.replace(/(\.\s*)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
  return formatted;
};

export default function ProfileGeneralOnboarding(props) {
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
    generalPhotoFile, setGeneralPhotoFile, generalBannerFile, setGeneralBannerFile,
    generalPhotoPreviewUrl, generalBannerPreviewUrl,
    generalSaving, generalSuccess, setGeneralSuccess,
    generalActiveTab, setGeneralActiveTab,
    suggestionsChanged, setSuggestionsChanged,
    profileChanged, setProfileChanged, linksChanged, setLinksChanged,
    usernameCheck, setUsernameCheck, availabilitySuggestions, setAvailabilitySuggestions, getFileAfterCropOrPassThrough,
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
    pdfNumPages, onPdfLoadSuccess, restaurantForm, setRestaurantForm,
    startRestaurantHeroEdit, persistRestaurant, linkCopiedRest, setLinkCopiedRest,
    handleUpdateHeroFieldRest, rLinkEditOpen, setRLinkEditOpen,
    restaurantBannerFile, restaurantGalleryFile,
    setupLoader, getProfileLink,
    artistChanged, setArtistChanged,
    // misc
    GENERAL_THEMES: _gt, visiblePlatforms, setVisiblePlatforms,
  } = props;

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
            <div className="general-onboarding-progress-bar" style={{ width: `${(genStep / 3) * 100}%` }} />
          </div>

          {genStep === 1 && (
            <div className="onboarding-step fade-in">
              <h2>Step 1 – Identity</h2>
              <p className="onboarding-subtitle">Your name and profile link</p>
              <div className="onboarding-fields">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="onboarding-field">
                    <label>First Name</label>
                    <input type="text" className="onboarding-input" style={{ textTransform: 'uppercase' }} value={generalForm.name ? (generalForm.name.includes('|') ? generalForm.name.split('|')[0] : generalForm.name.split(' ')[0]) : ''} onChange={e => {
                      const currentName = generalForm.name || '';
                      const lastName = currentName.includes('|') ? currentName.split('|')[1] || '' : currentName.split(' ').slice(1).join(' ') || '';
                      setGeneralForm(prev => ({ ...prev, name: `${e.target.value.toUpperCase()}|${lastName.toUpperCase()}` }));
                    }} placeholder="FIRST NAME" required autoFocus />
                  </div>
                  <div className="onboarding-field">
                    <label>Last Name</label>
                    <input type="text" className="onboarding-input" style={{ textTransform: 'uppercase' }} value={generalForm.name ? (generalForm.name.includes('|') ? generalForm.name.split('|')[1] : generalForm.name.split(' ').slice(1).join(' ')) : ''} onChange={e => {
                      const currentName = generalForm.name || '';
                      const firstName = currentName.includes('|') ? currentName.split('|')[0] || '' : currentName.split(' ')[0] || '';
                      setGeneralForm(prev => ({ ...prev, name: `${firstName.toUpperCase()}|${e.target.value.toUpperCase()}` }));
                    }} placeholder="LAST NAME" />
                  </div>
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
                          setAvailabilitySuggestions([]);
                          return;
                        }
                        setUsernameCheck({ status: 'checking', msg: '' });
                        usernameCheckTimer.current = setTimeout(async () => {
                          try {
                            const res = await generalProfileAPI.checkAvailability({ username: val });
                            if (res.conflicts?.username) {
                              setUsernameCheck({ status: 'taken', msg: res.conflicts.username });
                              if (res.suggestions) {
                                setAvailabilitySuggestions(res.suggestions);
                              }
                            } else {
                              setUsernameCheck({ status: 'available', msg: 'Available!' });
                              setAvailabilitySuggestions([]);
                            }
                          } catch (err) {
                            setUsernameCheck({ status: 'idle', msg: '' });
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
                    <>
                      <small style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block', paddingLeft: '0.5rem' }}>{usernameCheck.msg}</small>
                      {availabilitySuggestions.length > 0 && (
                        <div className="onboarding-suggestions" style={{ paddingLeft: '0.5rem' }}>
                          <span>Try:</span>
                          {availabilitySuggestions.map(s => (
                            <button
                              key={s}
                              type="button"
                              className="onboarding-suggestion-btn"
                              onClick={() => {
                                setGeneralForm(p => ({ ...p, username: s }));
                                setUsernameCheck({ status: 'available', msg: 'Available!' });
                                setAvailabilitySuggestions([]);
                              }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {usernameCheck.status === 'invalid' && (
                    <small style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block', paddingLeft: '0.5rem' }}>{usernameCheck.msg}</small>
                  )}
                  {usernameCheck.status === 'available' && (
                    <small style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block', paddingLeft: '0.5rem' }}>{usernameCheck.msg}</small>
                  )}
                  <small className="onboarding-tip">Your link: <b>{process.env.REACT_APP_DOMAIN || 'nanoprofile.com'}/link/{generalForm.username || 'username'}</b></small>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="onboarding-field">
                    <label>Headline (White Text) (optional)</label>
                    <textarea
                      rows={2}
                      className="onboarding-textarea"
                      style={{ textTransform: 'uppercase', resize: 'vertical' }}
                      value={(generalForm.title || '').split('|')[0] || ''}
                      onChange={e => {
                        const titleVal = generalForm.title || '';
                        const part2 = titleVal.split('|').slice(1).join('|');
                        setGeneralForm(prev => ({ ...prev, title: part2 ? `${e.target.value.toUpperCase()}|${part2}` : e.target.value.toUpperCase() }));
                      }}
                      placeholder="E.G. A PASSIONATE"
                    />
                  </div>
                  <div className="onboarding-field">
                    <label>Headline (Red Text) (optional)</label>
                    <input
                      type="text"
                      className="onboarding-input"
                      style={{ textTransform: 'uppercase' }}
                      value={(generalForm.title || '').split('|').slice(1).join('|') || ''}
                      onChange={e => {
                        const titleVal = generalForm.title || '';
                        const part1 = titleVal.split('|')[0] || '';
                        setGeneralForm(prev => ({ ...prev, title: `${part1}|${e.target.value.toUpperCase()}` }));
                      }}
                      placeholder="E.G. CREATIVE MIND"
                    />
                  </div>
                </div>
              </div>
              <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="onboarding-btn-primary" onClick={() => updateGeneralOnboardingStep(2)} disabled={!generalForm.name.trim() || !generalForm.username.trim() || usernameCheck.status !== 'available'}>Next Step →</button>
              </div>
            </div>
          )}

          {genStep === 2 && (
            <div className="onboarding-step fade-in">
              <h2>Step 2 – Photo &amp; bio</h2>
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
                  <label>Bio Description (optional)</label>
                  <textarea className="onboarding-textarea" value={generalForm.bio} onChange={e => setGeneralForm(prev => ({ ...prev, bio: formatSentenceCase(e.target.value) }))} rows={5} placeholder="Describe yourself..." />
                </div>
              </div>
              <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="onboarding-btn-primary" onClick={() => updateGeneralOnboardingStep(3)}>Next Step →</button>
              </div>
            </div>
          )}

          {genStep === 3 && (
            <form className="onboarding-step fade-in" onSubmit={handleGeneralCreate}>
              {!isGeneralPlatformSelectorOpen ? (
                <>
                  <h2>Connect Your Digital World</h2>
                  <p className="onboarding-subtitle">Link your social media and other platforms</p>

                  <div className="onboarding-fields">
                    <div className="dash-links-section onboarding-added-links" style={{ marginBottom: '1.5rem' }}>
                      {generalForm.links.length === 0 ? (
                        <div className="general-onboarding-artist-empty">
                          <p>No platforms added yet.<br />Click below to add some!</p>
                        </div>
                      ) : (
                        generalForm.links.map((link, idx) => {
                          const platform = ALL_PLATFORMS.find(p => p.id === link.platform) || { id: 'custom', label: 'Custom' };
                          return (
                            <div className="dash-link-card fade-in general-onboarding-dash-link" key={idx}>
                              <div className="dash-link-icon-circle">
                                {getLinkIcon({ platform: platform.id })}
                              </div>
                              <div className="dash-link-content" style={{ flex: 1, minWidth: 0 }}>
                                <div className="dash-link-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                  <span className="dash-link-title">{platform.label}</span>
                                  <button
                                    type="button"
                                    className="dash-link-remove-btn general-onboarding-dash-remove"
                                    onClick={() => removeLink(idx)}
                                  >✕</button>
                                </div>
                                <div className="dash-link-url">
                                  <input
                                    className="onboarding-input"
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderRadius: '8px', marginBottom: '0.5rem' }}
                                    placeholder="Link Title (e.g. My Website)"
                                    value={link.title}
                                    onChange={e => updateLink(idx, 'title', e.target.value)}
                                  />
                                  {link.platform === 'whatsapp' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                      <PhoneINInput
                                        wrapClassName="onboarding-phone-in"
                                        value={toINFullPhone(getINDisplayDigits(link.waPhone || ''))}
                                        onChange={(v) => updateLink(idx, 'waPhone', v)}
                                      />
                                      <input className="onboarding-input" style={{ width: '100%', boxSizing: 'border-box', padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderRadius: '8px' }} placeholder="Pre-filled message (optional)" value={link.waMessage || ''} onChange={e => updateLink(idx, 'waMessage', e.target.value)} />
                                    </div>
                                  )}
                                  {(link.platform === 'telegram') && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span className="general-onboarding-input-prefix">t.me/</span>
                                      <input className="onboarding-input" style={{ width: '100%', boxSizing: 'border-box', padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderRadius: '8px' }} placeholder="username" value={link.platformUsername || ''} onChange={e => updateLink(idx, 'platformUsername', e.target.value)} />
                                    </div>
                                  )}
                                  {(link.platform === 'instagram' || link.platform === 'twitter' || link.platform === 'tiktok' || link.platform === 'threads') && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span className="general-onboarding-input-prefix">@</span>
                                      <input className="onboarding-input" style={{ width: '100%', boxSizing: 'border-box', padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderRadius: '8px' }} placeholder="username" value={link.platformUsername || ''} onChange={e => updateLink(idx, 'platformUsername', e.target.value)} />
                                    </div>
                                  )}
                                  {link.platform === 'snapchat' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span className="general-onboarding-input-prefix">add/</span>
                                      <input className="onboarding-input" style={{ width: '100%', boxSizing: 'border-box', padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderRadius: '8px' }} placeholder="username" value={link.platformUsername || ''} onChange={e => updateLink(idx, 'platformUsername', e.target.value)} />
                                    </div>
                                  )}
                                  {(!['whatsapp', 'telegram', 'instagram', 'twitter', 'tiktok', 'snapchat', 'threads'].includes(link.platform)) && (
                                    <input className="onboarding-input" style={{ width: '100%', boxSizing: 'border-box', padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderRadius: '8px' }} placeholder="https://" value={link.url} onChange={e => updateLink(idx, 'url', e.target.value)} />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <button
                      type="button"
                      className="general-onboarding-add-platforms"
                      onClick={() => setIsGeneralPlatformSelectorOpen(true)}
                    >
                      <span style={{ fontSize: '1.2rem', fontWeight: 400 }}>+</span> Add Platforms
                    </button>

                    <div className="onboarding-actions" style={{ marginTop: '2.5rem' }}>
                      <button type="submit" className="onboarding-btn-primary" disabled={generalSaving} style={{ width: '100%' }}>
                        {generalSaving ? <><span>Setting up...</span>{setupLoader}</> : 'Complete'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="onboarding-selector-view fade-in">
                  <div className="selector-header">
                    <h3>Select Platforms</h3>
                    <button
                      type="button"
                      className="selector-close-btn"
                      onClick={() => setIsGeneralPlatformSelectorOpen(false)}
                    >←</button>
                  </div>
                  <p className="selector-subtitle">Choose the platforms you want on your profile</p>

                  <div className="dash-selector-grid">
                    {ALL_PLATFORMS.map((p) => {
                      const isActive = generalForm.links.some(l => l.platform === p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={`dash-selector-item ${isActive ? 'is-active' : ''}`}
                          onClick={() => {
                            if (isActive) {
                              setGeneralForm(prev => ({ ...prev, links: prev.links.filter(l => l.platform !== p.id) }));
                            } else {
                              addLink(p.id);
                            }
                          }}
                        >
                          <div className="dash-selector-icon">
                            {getLinkIcon({ platform: p.id })}
                          </div>
                          <span className="dash-selector-label">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="onboarding-actions" style={{ marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      className="onboarding-btn-primary"
                      onClick={() => setIsGeneralPlatformSelectorOpen(false)}
                      style={{ width: '100%', borderRadius: '24px' }}
                    >
                      Selected ({generalForm.links.length})
                    </button>
                  </div>
                </div>
              )}
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
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return null;
}