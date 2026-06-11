import React, { useRef } from 'react';
import { getLinkIcon } from '../LinkIcons';
import PhoneINInput from '../PhoneINInput';
import { buildWhatsAppUrlFromFullINPhone } from '../../utils/indianPhone';
import { generalProfileAPI } from '../../services/api';

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

export default function ProfileGeneralOnboardingWizard({
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

  error,
  saving,
  handleLogout,
  handlePickAndCrop,
  handlePickAndCropBatch,
}) {
  const [availabilityConflicts, setAvailabilityConflicts] = React.useState({ username: null, email: null });
  const [availabilitySuggestions, setAvailabilitySuggestions] = React.useState([]);
  const lastChecked = React.useRef({ username: "", email: "" });
  const lastSuggestionsUsername = React.useRef("");

  React.useEffect(() => {
    const u = formData.artistId || "";
    const e = formData.email || "";

    if (u === lastChecked.current.username && e === lastChecked.current.email) return;

    const timer = setTimeout(async () => {
      if (u !== lastSuggestionsUsername.current) {
        setAvailabilitySuggestions([]);
      }
      
      lastChecked.current = { username: u, email: e };

      if (!u && !e) {
        setAvailabilityConflicts({ username: null, email: null });
        return;
      }

      try {
        const res = await generalProfileAPI.checkAvailability({ username: u, email: e });
        setAvailabilityConflicts(res.conflicts || { username: null, email: null });
        if (res.suggestions && u !== lastSuggestionsUsername.current) {
          setAvailabilitySuggestions(res.suggestions);
          lastSuggestionsUsername.current = u;
        }
      } catch (err) {
        console.warn("Availability check failed", err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.artistId, formData.email]);

  const photoPreviewUrl = useBlobUrl(photoFile);
  const photoInputRef = useRef(null);

  const isGeneralStep1Valid =
    String(formData.name || '').trim() &&
    String(formData.artistId || '').trim() && !availabilityConflicts.username &&
    String(formData.specialization || '').trim() &&
    String(formData.email || '').trim() && !availabilityConflicts.email &&
    String(formData.phone || '').trim();

  const setupLoader = (
    <span className="onboarding-inline-loader" aria-hidden="true" style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
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
                <p className="onboarding-subtitle">Personalize your profile identity</p>
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
                    {availabilityConflicts.username && (
                      <>
                        <p className="onboarding-field-error">{availabilityConflicts.username}</p>
                        {availabilitySuggestions.length > 0 && (
                          <div className="onboarding-suggestions">
                            <span>Try:</span>
                            {availabilitySuggestions.map(s => (
                              <button 
                                key={s} 
                                type="button" 
                                className="onboarding-suggestion-btn"
                                onClick={() => setFormData(p => ({ ...p, artistId: s }))}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    <small className="onboarding-tip">Your profile URL will be: <b>{process.env.REACT_APP_DOMAIN || 'nanoprofile.com'}/link/{formData.artistId || 'username'}</b></small>

                  </div>
                  <div className="onboarding-field">
                    <label>Profession / Specialization <span className="onboarding-required-star">*</span></label>
                    <input
                      type="text"
                      className="onboarding-input"
                      value={formData.specialization}
                      onChange={e => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                      placeholder="e.g. Designer, Developer, Creator"
                    />
                  </div>
                  <div className="onboarding-field">
                    <label>Years of Experience</label>
                    <input
                      type="text"
                      className="onboarding-input"
                      value={formData.experience}
                      onChange={e => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                      placeholder="e.g. 2 years, 5+ years"
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
                    {availabilityConflicts.email && <p className="onboarding-field-error">{availabilityConflicts.email}</p>}
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
                <button className="onboarding-btn-primary" onClick={handleOnboardingNext} disabled={!isGeneralStep1Valid}>
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
                <p className="onboarding-subtitle">Upload your profile image</p>
                <div className="onboarding-images">
                  <div className="image-upload-box">
                    <label>Profile Image</label>
                    <button
                      type="button"
                      className="upload-trigger-btn"
                      onClick={() => { if (photoInputRef.current) { photoInputRef.current.value = ''; photoInputRef.current.click(); } }}
                      aria-label="Upload profile image"
                    >
                      <div className="upload-preview-circle">
                        {photoPreviewUrl ? <img src={photoPreviewUrl} alt="Preview" /> : <span>+</span>}
                      </div>
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      style={{ display: 'none' }}
                      onChange={e => handlePickAndCrop(e, 1, file => setPhotoFile(file))}
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                    />
                  </div>

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
