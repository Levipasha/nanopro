import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { getLinkIcon } from '../LinkIcons';
import PhoneINInput from '../PhoneINInput';
import { buildWhatsAppUrlFromFullINPhone } from '../../utils/indianPhone';

function OnboardingGalleryTilePreview({ file }) {
  // Create/revoke in an effect only. useMemo + revoke cleanup breaks under React Strict Mode
  // (cleanup revokes the URL while useMemo still returns the same stale string).
  const [url, setUrl] = React.useState(null);
  React.useLayoutEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  const isVideo = file.type.startsWith('video/');
  if (!url) return null;
  return isVideo ? (
    <video src={url} muted playsInline preload="metadata" />
  ) : (
    <img src={url} alt="" />
  );
}

function useBlobUrl(file) {
  const [url, setUrl] = React.useState(null);
  React.useLayoutEffect(() => {
    if (!file) { setUrl(null); return; }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

export default function ProfileArtistOnboardingWizard({
  onboardingStep,
  handleOnboardingBack,
  handleOnboardingNext,
  handleOnboardingComplete,
  formData,
  setFormData,
  isOnboardingSelectorOpen,
  setIsOnboardingSelectorOpen,
  onboardingPlatforms,
  setOnboardingPlatforms,
  ALL_PLATFORMS,
  photoFile,
  setPhotoFile,
  bgFile,
  setBgFile,
  onboardingGalleryFiles,
  setOnboardingGalleryFiles,
  error,
  saving,
  handleLogout,
  handlePickAndCrop,
}) {
  const photoPreviewUrl = useBlobUrl(photoFile);
  const bgPreviewUrl = useBlobUrl(bgFile);

  const isArtistStep1Valid =
    String(formData.name || '').trim() &&
    String(formData.artistId || '').trim() &&
    String(formData.specialization || '').trim() &&
    String(formData.email || '').trim() &&
    String(formData.phone || '').trim();

  const setupLoader = (
    <span className="onboarding-inline-loader" aria-hidden="true">
      <DotLottieReact
        src="https://lottie.host/de82363b-b18e-4bef-9661-ec050f25006c/2wfqQErbPL.lottie"
        loop
        autoplay
      />
    </span>
  );

  return (
      <div className="profile-page profile-login-wrap onboarding-screen">
        <div className="profile-login-card profile-choice-card general-onboarding-card">
          {onboardingStep > 1 && (
            <button type="button" className="profile-back-btn" onClick={handleOnboardingBack}>← Back</button>
          )}
          <div className="general-onboarding-progress">
            <div className="general-onboarding-progress-bar" style={{ width: `${(onboardingStep / 3) * 100}%` }} />
          </div>
            {onboardingStep === 1 && (
              <div className="onboarding-step fade-in">
                <h2>Welcome! Let's get started</h2>
                <p className="onboarding-subtitle">Personalize your artist identity</p>
                <div className="onboarding-fields">
                  <div className="onboarding-field">
                    <label>Full Name <span className="onboarding-required-star">*</span></label>
                    <input
                      type="text"
                      className="onboarding-input"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Vamshi Krishna"
                      autoFocus
                    />
                  </div>
                  <div className="onboarding-field">
                    <label>Username <span className="onboarding-required-star">*</span></label>
                    <div className="artist-id-input-wrapper">
                      <input
                        type="text"
                        className="onboarding-input-id"
                        style={{ paddingLeft: '1.25rem' }}
                        value={formData.artistId}
                        onChange={e => setFormData(prev => ({ ...prev, artistId: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                        placeholder="Enter your nickname"
                      />
                    </div>
                    <small className="onboarding-tip">Your profile URL will be: <b>nanoprofile.com/artist/{formData.artistId || 'username'}</b></small>
                  </div>
                  <div className="onboarding-field">
                    <label>Art Form / Specialization <span className="onboarding-required-star">*</span></label>
                    <input
                      type="text"
                      className="onboarding-input"
                      value={formData.specialization}
                      onChange={e => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                      placeholder="e.g. Micro Artist, Painter, Musician"
                    />
                  </div>
                  <div className="onboarding-field">
                    <label>Email Address <span className="onboarding-required-star">*</span></label>
                    <input
                      type="email"
                      className="onboarding-input"
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. hello@example.com"
                    />
                  </div>
                  <div className="onboarding-field">
                    <label>Mobile Number <span className="onboarding-required-star">*</span></label>
                    <PhoneINInput
                      wrapClassName="onboarding-phone-in"
                      value={formData.phone}
                      onChange={(v) => setFormData((prev) => ({ ...prev, phone: v }))}
                    />
                  </div>
                </div>
                <button className="onboarding-btn-primary" onClick={handleOnboardingNext} disabled={!isArtistStep1Valid}>
                  Next Step →
                </button>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="onboarding-step fade-in">
                <h2>Connect Your Digital World</h2>
                <p className="onboarding-subtitle">Link your social media and other platforms</p>
                <div className="onboarding-fields">
                  {!isOnboardingSelectorOpen ? (
                    <>
                      <div className="dash-links-section onboarding-added-links" style={{ marginBottom: '1.5rem' }}>
                        {onboardingPlatforms.length === 0 && (
                          <div className="general-onboarding-artist-empty">
                            <p>No platforms added yet.<br/>Click below to add some!</p>
                          </div>
                        )}
                        {onboardingPlatforms.map(platformId => {
                          const platform = ALL_PLATFORMS.find(p => p.id === platformId);
                          const inputClass = 'onboarding-input';
                          const inputExtra = { width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.8rem', fontSize: '0.85rem', borderRadius: '10px' };

                          const renderPlatformInput = () => {
                            if (platformId === 'whatsapp') {
                              const waMsg = formData._wa_msg || '';
                              const waStored = formData._wa_phone || '';
                              const waLink = buildWhatsAppUrlFromFullINPhone(waStored, waMsg);
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  <PhoneINInput
                                    wrapClassName="onboarding-phone-in"
                                    inputClassName={inputClass}
                                    style={inputExtra}
                                    value={waStored}
                                    onChange={(v) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        _wa_phone: v,
                                        whatsapp: buildWhatsAppUrlFromFullINPhone(v, prev._wa_msg || '')
                                      }))
                                    }
                                  />
                                  <input type="text" className={inputClass} style={inputExtra} value={waMsg} onChange={e => { const v = e.target.value; setFormData(prev => ({ ...prev, _wa_msg: v, whatsapp: buildWhatsAppUrlFromFullINPhone(prev._wa_phone || '', v) })); }} placeholder="Pre-filled message (optional)" />
                                  {waLink && <p className="general-onboarding-url-preview">{waLink}</p>}
                                </div>
                              );
                            }
                            if (platformId === 'telegram') {
                              const tgUser = formData._tg_user || '';
                              const tgLink = tgUser ? `https://t.me/${tgUser.replace('@', '')}` : '';
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span className="general-onboarding-input-prefix">t.me/</span>
                                    <input type="text" className={inputClass} style={inputExtra} value={tgUser} onChange={e => { const v = e.target.value.replace(/\s/g, ''); setFormData(prev => ({ ...prev, _tg_user: v, telegram: v ? `https://t.me/${v.replace('@', '')}` : '' })); }} placeholder="username" />
                                  </div>
                                  {tgLink && <p className="general-onboarding-url-preview">{tgLink}</p>}
                                </div>
                              );
                            }
                            if (platformId === 'instagram') {
                              const igUser = formData._ig_user || '';
                              const igLink = igUser ? `https://instagram.com/${igUser.replace('@', '')}` : '';
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span className="general-onboarding-input-prefix">@</span>
                                    <input type="text" className={inputClass} style={inputExtra} value={igUser} onChange={e => { const v = e.target.value.replace(/\s/g, '').replace('@', ''); setFormData(prev => ({ ...prev, _ig_user: v, instagram: v ? `https://instagram.com/${v}` : '' })); }} placeholder="username" />
                                  </div>
                                  {igLink && <p className="general-onboarding-url-preview">{igLink}</p>}
                                </div>
                              );
                            }
                            if (platformId === 'twitter') {
                              const twUser = formData._tw_user || '';
                              const twLink = twUser ? `https://x.com/${twUser.replace('@', '')}` : '';
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span className="general-onboarding-input-prefix">@</span>
                                    <input type="text" className={inputClass} style={inputExtra} value={twUser} onChange={e => { const v = e.target.value.replace(/\s/g, '').replace('@', ''); setFormData(prev => ({ ...prev, _tw_user: v, twitter: v ? `https://x.com/${v}` : '' })); }} placeholder="handle" />
                                  </div>
                                  {twLink && <p className="general-onboarding-url-preview">{twLink}</p>}
                                </div>
                              );
                            }
                            if (platformId === 'tiktok') {
                              const ttUser = formData._tt_user || '';
                              const ttLink = ttUser ? `https://tiktok.com/@${ttUser.replace('@', '')}` : '';
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span className="general-onboarding-input-prefix">@</span>
                                    <input type="text" className={inputClass} style={inputExtra} value={ttUser} onChange={e => { const v = e.target.value.replace(/\s/g, '').replace('@', ''); setFormData(prev => ({ ...prev, _tt_user: v, tiktok: v ? `https://tiktok.com/@${v}` : '' })); }} placeholder="username" />
                                  </div>
                                  {ttLink && <p className="general-onboarding-url-preview">{ttLink}</p>}
                                </div>
                              );
                            }
                            if (platformId === 'snapchat') {
                              const scUser = formData._sc_user || '';
                              const scLink = scUser ? `https://snapchat.com/add/${scUser}` : '';
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span className="general-onboarding-input-prefix">add/</span>
                                    <input type="text" className={inputClass} style={inputExtra} value={scUser} onChange={e => { const v = e.target.value.replace(/\s/g, ''); setFormData(prev => ({ ...prev, _sc_user: v, snapchat: v ? `https://snapchat.com/add/${v}` : '' })); }} placeholder="username" />
                                  </div>
                                  {scLink && <p className="general-onboarding-url-preview">{scLink}</p>}
                                </div>
                              );
                            }
                            if (platformId === 'threads') {
                              const thUser = formData._th_user || '';
                              const thLink = thUser ? `https://threads.net/@${thUser.replace('@', '')}` : '';
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span className="general-onboarding-input-prefix">@</span>
                                    <input type="text" className={inputClass} style={inputExtra} value={thUser} onChange={e => { const v = e.target.value.replace(/\s/g, '').replace('@', ''); setFormData(prev => ({ ...prev, _th_user: v, threads: v ? `https://threads.net/@${v}` : '' })); }} placeholder="username" />
                                  </div>
                                  {thLink && <p className="general-onboarding-url-preview">{thLink}</p>}
                                </div>
                              );
                            }
                            return (
                              <input type="text" className={`dash-link-inline-input ${inputClass}`} style={inputExtra} value={formData[platformId] || ''} onChange={e => setFormData(prev => ({ ...prev, [platformId]: e.target.value }))} placeholder="https://" />
                            );
                          };

                          return (
                            <div className="dash-link-card fade-in general-onboarding-dash-link" key={platformId}>
                               <div className="dash-link-icon-circle">
                                 {getLinkIcon({ platform: platform.id })}
                               </div>
                               <div className="dash-link-content" style={{ flex: 1, minWidth: 0 }}>
                                 <div className="dash-link-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                   <span className="dash-link-title">{platform.label}</span>
                                   <button
                                     type="button"
                                     className="dash-link-remove-btn general-onboarding-dash-remove"
                                     onClick={() => {
                                        setOnboardingPlatforms(prev => prev.filter(id => id !== platform.id));
                                        setFormData(prev => ({ ...prev, [platform.id]: '' }));
                                     }}
                                   >✕</button>
                                 </div>
                                 <div className="dash-link-url">
                                   {renderPlatformInput()}
                                 </div>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <button
                        type="button"
                        className="general-onboarding-add-platforms"
                        onClick={() => setIsOnboardingSelectorOpen(true)}
                      >
                        <span style={{ fontSize: '1.2rem', fontWeight: 400 }}>+</span> Add Platforms
                      </button>
                    </>
                  ) : (
                    <div className="onboarding-selector-view fade-in">
                      <div className="selector-header">
                        <h3>Select Platforms</h3>
                        <button 
                          type="button"
                          className="selector-close-btn"
                          onClick={() => setIsOnboardingSelectorOpen(false)}
                        >←</button>
                      </div>
                      <p className="selector-subtitle">Choose the platforms you want on your profile</p>
                      
                      <div className="dash-selector-grid">
                        {ALL_PLATFORMS.map((p) => {
                          const isActive = onboardingPlatforms.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              className={`dash-selector-item ${isActive ? 'is-active' : ''}`}
                              onClick={() => {
                                if (isActive) {
                                  setOnboardingPlatforms(prev => prev.filter(id => id !== p.id));
                                  setFormData(prev => ({ ...prev, [p.id]: '' }));
                                } else {
                                  setOnboardingPlatforms(prev => [...prev, p.id]);
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
                      
                      <button
                        type="button"
                        className="onboarding-btn-primary onboarding-selector-done-btn"
                        onClick={() => setIsOnboardingSelectorOpen(false)}
                      >
                        Selected ({onboardingPlatforms.length})
                      </button>
                    </div>
                  )}
                </div>
                {!isOnboardingSelectorOpen && (
                  <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
                    <button className="onboarding-btn-primary" onClick={handleOnboardingNext}>Next Step →</button>
                  </div>
                )}
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="onboarding-step fade-in">
                <h2>Show your style</h2>
                <p className="onboarding-subtitle">Upload your profile, banner, and gallery images</p>
                <div className="onboarding-images">
                  <div className="image-upload-box">
                    <label>Profile Image</label>
                    <label htmlFor="photo-input" style={{ display: 'block', cursor: 'pointer' }}>
                      <div className="upload-preview-circle">
                        {photoPreviewUrl ? <img src={photoPreviewUrl} alt="Preview" /> : <span>+</span>}
                      </div>
                    </label>
                    <input id="photo-input" type="file" hidden onChange={e => handlePickAndCrop(e, 1, file => setPhotoFile(file))} accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml" />
                  </div>
                  <div className="image-upload-box">
                    <label>Banner Image</label>
                    <label htmlFor="bg-input" style={{ display: 'block', cursor: 'pointer' }}>
                      <div className="upload-preview-banner">
                        {bgPreviewUrl ? <img src={bgPreviewUrl} alt="Preview" /> : <span>+ Click to upload banner</span>}
                      </div>
                    </label>
                    <input id="bg-input" type="file" hidden onChange={e => handlePickAndCrop(e, 16 / 9, file => setBgFile(file))} accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml" />
                  </div>
                </div>

                <div className="onboarding-field" style={{ marginTop: '2.5rem' }}>
                  <label>Gallery — images, GIFs, or videos up to 30s (max 3)</label>
                  <p className="onboarding-gallery-hint">Add one or many at a time (up to 3 total). Videos must be 30 seconds or less. Tap <span aria-hidden="true">x</span> on a preview to remove it.</p>
                  <input
                    id="gallery-input"
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => {
                      handlePickAndCrop(e, 2, (file) => {
                        setOnboardingGalleryFiles((prev) => [...prev, file].slice(0, 3));
                      });
                    }}
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                  />
                  <label
                    htmlFor={onboardingGalleryFiles.length < 3 ? 'gallery-input' : undefined}
                    className="upload-preview-banner onboarding-gallery-grid"
                    style={{ cursor: onboardingGalleryFiles.length >= 3 ? 'default' : 'pointer', display: 'grid' }}
                  >
                    {onboardingGalleryFiles.length > 0 ? (
                      onboardingGalleryFiles.map((f, i) => {
                        const isVideo = f.type.startsWith('video/');
                        return (
                        <div
                          key={`${f.name}-${f.lastModified}-${i}`}
                          className="onboarding-gallery-tile"
                          onClick={(e) => e.preventDefault()}
                        >
                          <div className="onboarding-gallery-tile-crop">
                            <OnboardingGalleryTilePreview file={f} />
                          </div>
                          <button
                            type="button"
                            className="onboarding-gallery-remove"
                            aria-label={`Remove ${isVideo ? 'video' : 'image'} ${i + 1}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setOnboardingGalleryFiles((prev) => prev.filter((_, j) => j !== i));
                            }}
                          >
                            x
                          </button>
                        </div>
                        );
                      })
                    ) : null}
                    {onboardingGalleryFiles.length < 3 && (
                      <span
                        className={
                          onboardingGalleryFiles.length > 0
                            ? 'onboarding-gallery-add-more'
                            : 'onboarding-gallery-placeholder'
                        }
                        style={
                          onboardingGalleryFiles.length > 0
                            ? { gridColumn: `span ${3 - onboardingGalleryFiles.length}` }
                            : undefined
                        }
                      >
                        {onboardingGalleryFiles.length > 0
                          ? `+ Add more (${3 - onboardingGalleryFiles.length} left)`
                          : '+ Click to add images (up to 3)'}
                      </span>
                    )}
                  </label>
                </div>

                <div className="onboarding-fields" style={{ marginTop: '1.5rem' }}>
                  <div className="onboarding-field">
                    <label>Short Bio</label>
                    <textarea
                      className="onboarding-textarea"
                      value={formData.bio}
                      onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                </div>

                {error && <p className="profile-error-msg">{error}</p>}
                <div className="onboarding-actions">
                  <button className="onboarding-btn-complete" onClick={handleOnboardingComplete} disabled={saving}>
                    {saving ? <><span>Setting up...</span>{setupLoader}</> : 'Complete Setup ✓'}
                  </button>
                </div>
              </div>
            )}

          <button type="button" onClick={handleLogout} className="profile-logout-btn-link" style={{ marginTop: 16 }}>Sign out</button>
        </div>
      </div>
  );
}
