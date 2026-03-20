import React from 'react';
import { getLinkIcon } from '../LinkIcons';

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
}) {
  return (

      <div className="profile-page profile-login-wrap onboarding-screen">
        <div className="onboarding-bg-shapes">
          <div className="glass-blob blob-1"></div>
          <div className="glass-blob blob-2"></div>
          <div className="glass-blob blob-3"></div>
        </div>
        <div className="profile-login-card onboarding-card">
          {onboardingStep > 1 && (
            <button className="onboarding-back-arrow" onClick={handleOnboardingBack}>
              ←
            </button>
          )}
          <div className="onboarding-progress-container">
            <div className="onboarding-progress-bar" style={{ width: `${(onboardingStep / 3) * 100}%` }} />
          </div>

          <div className="onboarding-step-content">
            {onboardingStep === 1 && (
              <div className="onboarding-step fade-in">
                <h2>Welcome! Let's get started</h2>
                <p className="onboarding-subtitle">Personalize your artist identity</p>
                <div className="onboarding-fields">
                  <div className="onboarding-field">
                    <label>Full Name</label>
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
                    <label>Username</label>
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
                    <label>Art Form / Specialization</label>
                    <input
                      type="text"
                      className="onboarding-input"
                      value={formData.specialization}
                      onChange={e => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                      placeholder="e.g. Micro Artist, Painter, Musician"
                    />
                  </div>
                  <div className="onboarding-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="onboarding-input"
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. hello@example.com"
                    />
                  </div>
                  <div className="onboarding-field">
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      className="onboarding-input"
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +1 234 567 890"
                    />
                  </div>
                </div>
                <button className="onboarding-btn-primary" onClick={handleOnboardingNext} disabled={!formData.name || !formData.artistId || !formData.specialization}>
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
                          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', marginBottom: '1rem' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>No platforms added yet.<br/>Click below to add some!</p>
                          </div>
                        )}
                        {onboardingPlatforms.map(platformId => {
                          const platform = ALL_PLATFORMS.find(p => p.id === platformId);
                          const inputStyle = { width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.5rem 0.8rem', fontSize: '0.85rem', color: 'var(--dash-text, #f1f5f9)', background: 'rgba(255,255,255,0.06)', boxSizing: 'border-box' };
                          const previewStyle = { fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.35rem', wordBreak: 'break-all' };

                          const renderPlatformInput = () => {
                            if (platformId === 'whatsapp') {
                              const waPhone = formData._wa_phone || '';
                              const waMsg = formData._wa_msg || '';
                              const waLink = waPhone ? `https://wa.me/${waPhone.replace(/[^0-9]/g, '')}${waMsg ? '?text=' + encodeURIComponent(waMsg) : ''}` : '';
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', flexShrink: 0 }}>+</span>
                                    <input type="tel" style={inputStyle} value={waPhone} onChange={e => { const v = e.target.value.replace(/[^0-9+\s-]/g, ''); setFormData(prev => ({ ...prev, _wa_phone: v, whatsapp: v ? `https://wa.me/${v.replace(/[^0-9]/g, '')}${prev._wa_msg ? '?text=' + encodeURIComponent(prev._wa_msg) : ''}` : '' })); }} placeholder="91 98765 43210" />
                                  </div>
                                  <input type="text" style={inputStyle} value={waMsg} onChange={e => { const v = e.target.value; setFormData(prev => { const phone = (prev._wa_phone || '').replace(/[^0-9]/g, ''); return { ...prev, _wa_msg: v, whatsapp: phone ? `https://wa.me/${phone}${v ? '?text=' + encodeURIComponent(v) : ''}` : '' }; }); }} placeholder="Pre-filled message (optional)" />
                                  {waLink && <p style={previewStyle}>{waLink}</p>}
                                </div>
                              );
                            }
                            if (platformId === 'telegram') {
                              const tgUser = formData._tg_user || '';
                              const tgLink = tgUser ? `https://t.me/${tgUser.replace('@', '')}` : '';
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', flexShrink: 0 }}>t.me/</span>
                                    <input type="text" style={inputStyle} value={tgUser} onChange={e => { const v = e.target.value.replace(/\s/g, ''); setFormData(prev => ({ ...prev, _tg_user: v, telegram: v ? `https://t.me/${v.replace('@', '')}` : '' })); }} placeholder="username" />
                                  </div>
                                  {tgLink && <p style={previewStyle}>{tgLink}</p>}
                                </div>
                              );
                            }
                            if (platformId === 'instagram') {
                              const igUser = formData._ig_user || '';
                              const igLink = igUser ? `https://instagram.com/${igUser.replace('@', '')}` : '';
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', flexShrink: 0 }}>@</span>
                                    <input type="text" style={inputStyle} value={igUser} onChange={e => { const v = e.target.value.replace(/\s/g, '').replace('@', ''); setFormData(prev => ({ ...prev, _ig_user: v, instagram: v ? `https://instagram.com/${v}` : '' })); }} placeholder="username" />
                                  </div>
                                  {igLink && <p style={previewStyle}>{igLink}</p>}
                                </div>
                              );
                            }
                            if (platformId === 'twitter') {
                              const twUser = formData._tw_user || '';
                              const twLink = twUser ? `https://x.com/${twUser.replace('@', '')}` : '';
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', flexShrink: 0 }}>@</span>
                                    <input type="text" style={inputStyle} value={twUser} onChange={e => { const v = e.target.value.replace(/\s/g, '').replace('@', ''); setFormData(prev => ({ ...prev, _tw_user: v, twitter: v ? `https://x.com/${v}` : '' })); }} placeholder="handle" />
                                  </div>
                                  {twLink && <p style={previewStyle}>{twLink}</p>}
                                </div>
                              );
                            }
                            if (platformId === 'tiktok') {
                              const ttUser = formData._tt_user || '';
                              const ttLink = ttUser ? `https://tiktok.com/@${ttUser.replace('@', '')}` : '';
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', flexShrink: 0 }}>@</span>
                                    <input type="text" style={inputStyle} value={ttUser} onChange={e => { const v = e.target.value.replace(/\s/g, '').replace('@', ''); setFormData(prev => ({ ...prev, _tt_user: v, tiktok: v ? `https://tiktok.com/@${v}` : '' })); }} placeholder="username" />
                                  </div>
                                  {ttLink && <p style={previewStyle}>{ttLink}</p>}
                                </div>
                              );
                            }
                            if (platformId === 'snapchat') {
                              const scUser = formData._sc_user || '';
                              const scLink = scUser ? `https://snapchat.com/add/${scUser}` : '';
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', flexShrink: 0 }}>add/</span>
                                    <input type="text" style={inputStyle} value={scUser} onChange={e => { const v = e.target.value.replace(/\s/g, ''); setFormData(prev => ({ ...prev, _sc_user: v, snapchat: v ? `https://snapchat.com/add/${v}` : '' })); }} placeholder="username" />
                                  </div>
                                  {scLink && <p style={previewStyle}>{scLink}</p>}
                                </div>
                              );
                            }
                            if (platformId === 'threads') {
                              const thUser = formData._th_user || '';
                              const thLink = thUser ? `https://threads.net/@${thUser.replace('@', '')}` : '';
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', flexShrink: 0 }}>@</span>
                                    <input type="text" style={inputStyle} value={thUser} onChange={e => { const v = e.target.value.replace(/\s/g, '').replace('@', ''); setFormData(prev => ({ ...prev, _th_user: v, threads: v ? `https://threads.net/@${v}` : '' })); }} placeholder="username" />
                                  </div>
                                  {thLink && <p style={previewStyle}>{thLink}</p>}
                                </div>
                              );
                            }
                            return (
                              <input type="text" className="dash-link-inline-input" style={inputStyle} value={formData[platformId] || ''} onChange={e => setFormData(prev => ({ ...prev, [platformId]: e.target.value }))} placeholder="https://" />
                            );
                          };

                          return (
                            <div className="dash-link-card fade-in" key={platformId} style={{ background: 'var(--dash-card-bg, rgba(20,20,30,0.8))', borderRadius: '16px', padding: '0.8rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}>
                               <div className="dash-link-icon-circle" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>
                                 {getLinkIcon({ platform: platform.id })}
                               </div>
                               <div className="dash-link-content" style={{ flex: 1, minWidth: 0 }}>
                                 <div className="dash-link-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                   <span className="dash-link-title" style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{platform.label}</span>
                                   <button 
                                     className="dash-link-remove-btn" 
                                     onClick={() => {
                                        setOnboardingPlatforms(prev => prev.filter(id => id !== platform.id));
                                        setFormData(prev => ({ ...prev, [platform.id]: '' }));
                                     }}
                                     style={{ background: 'rgba(239,68,68,0.15)', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f87171', transition: 'all 0.2s ease' }}
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
                        onClick={() => setIsOnboardingSelectorOpen(true)}
                        style={{ width: '100%', maxWidth: '380px', margin: '0 auto', padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.08)', border: '2px dashed rgba(255,255,255,0.3)', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
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
                        className="onboarding-btn-primary"
                        onClick={() => setIsOnboardingSelectorOpen(false)}
                        style={{ marginTop: '1.25rem' }}
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
                    <div className="upload-preview-circle" onClick={() => document.getElementById('photo-input').click()}>
                      {photoFile ? <img src={URL.createObjectURL(photoFile)} alt="Preview" /> : <span>+</span>}
                    </div>
                    <input id="photo-input" type="file" hidden onChange={e => setPhotoFile(e.target.files[0])} accept="image/*" />
                  </div>
                  <div className="image-upload-box">
                    <label>Banner Image</label>
                    <div className="upload-preview-banner" onClick={() => document.getElementById('bg-input').click()}>
                      {bgFile ? <img src={URL.createObjectURL(bgFile)} alt="Preview" /> : <span>+ Click to upload banner</span>}
                    </div>
                    <input id="bg-input" type="file" hidden onChange={e => setBgFile(e.target.files[0])} accept="image/*" />
                  </div>
                </div>

                <div className="onboarding-field" style={{ marginTop: '2.5rem' }}>
                  <label>Gallery Images / GIFs (up to 3)</label>
                  <div className="upload-preview-banner" onClick={() => document.getElementById('gallery-input').click()} style={{ minHeight: '80px', display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px' }}>
                    {onboardingGalleryFiles.length > 0 ? (
                      onboardingGalleryFiles.map((f, i) => (
                        <div key={i} style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden' }}>
                          <img src={URL.createObjectURL(f)} alt="Gallery preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))
                    ) : (
                      <span style={{ margin: 'auto' }}>+ Click to select up to 3 images</span>
                    )}
                  </div>
                  <input 
                    id="gallery-input" 
                    type="file" 
                    multiple 
                    hidden 
                    onChange={e => {
                      const files = Array.from(e.target.files).slice(0, 3);
                      setOnboardingGalleryFiles(files);
                    }} 
                    accept="image/*,image/gif" 
                  />
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

                {error && <p className="onboarding-error-msg">{error}</p>}
                <div className="onboarding-actions">
                  <button className="onboarding-btn-complete" onClick={handleOnboardingComplete} disabled={saving}>
                    {saving ? 'Setting up...' : 'Complete Setup ✓'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="onboarding-logout-btn">Sign out</button>
        </div>
      </div>
    
  );
}
