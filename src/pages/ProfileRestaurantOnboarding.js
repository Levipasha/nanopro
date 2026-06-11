/**
 * ProfileRestaurantOnboarding.js
 * The onboarding flow for the restaurant profile.
 * Receives state/handlers from Profile.js via props.
 */
import React from 'react';
import { Document, Page } from 'react-pdf';
import PhoneINInput from '../components/PhoneINInput';
import { GENERAL_THEMES } from '../constants/generalThemes';
import { fixImageUrl } from '../utils/imageHelper';
import { getLinkIcon } from '../components/LinkIcons';
import { ALL_PLATFORMS, extractUploadUrl } from './ProfileHelpers';
import { assertGalleryFileKind, assertVideoMaxDuration } from '../utils/galleryMedia';
import { generalProfileAPI } from '../services/api';
import { getIdToken } from '../firebase';
import ImageCropperModal from '../components/profile/ImageCropperModal';

export default function ProfileRestaurantOnboarding(props) {
  const {
    // auth / user
    user, displayEmail, handleLogout,
    // shared state
    cropper, isMobileViewport,
    // restaurant onboarding state
    restaurantForm, setRestaurantForm,
    restaurantOnboardingStep, updateRestaurantOnboardingStep,
    restaurantSaving, setRestaurantSaving,
    restaurantGalleryUploading, setRestaurantGalleryUploading,
    restaurantBannerUploading, setRestaurantBannerUploading,
    usernameCheck, setUsernameCheck,
    availabilitySuggestions, setAvailabilitySuggestions,
    usernameCheckTimer,
    // handlers passed from Profile.js
    handlePdfUpload, removePdf, onPdfLoadSuccess, pdfNumPages,
    handleRestaurantBannerUpload, handlePickAndCrop,
    saveRestaurantProfile, setupLoader, getFileAfterCropOrPassThrough,
    // refs
    restaurantBannerInputRef, restaurantGalleryInputRef, restaurantMenuInputRef,
    // link selector
    rLinkSelectorOpen, setRLinkSelectorOpen,
    rTempPlatforms, setRTempPlatforms,
  } = props;

  const rStep = restaurantOnboardingStep;

  return (
    <div className="profile-page profile-login-wrap onboarding-screen">
      <div className="profile-login-card profile-choice-card general-onboarding-card">
        {rStep > 1 && (
          <button type="button" className="profile-back-btn" onClick={() => updateRestaurantOnboardingStep(rStep - 1)}>← Back</button>
        )}
        <div className="general-onboarding-progress">
          <div className="general-onboarding-progress-bar" style={{ width: `${(rStep / 5) * 100}%` }} />
        </div>

        {rStep === 1 && (
          <div className="onboarding-step fade-in">
            <h2>Step 1 – Identity</h2>
            <p className="onboarding-subtitle">Restaurant name and details</p>
            <div className="onboarding-fields">
              <div className="onboarding-field">
                <label>Restaurant name</label>
                <input type="text" className="onboarding-input" value={restaurantForm.name} onChange={e => setRestaurantForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. My Cafe" required autoFocus />
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
                    value={restaurantForm.username || ""}
                    onChange={e => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                      setRestaurantForm(prev => ({ ...prev, username: val }));
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
                    placeholder="restaurant_name"
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
                              setRestaurantForm(p => ({ ...p, username: s }));
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
                <small className="onboarding-tip">Your link: <b>{process.env.REACT_APP_DOMAIN || 'nanoprofile.com'}/link/{restaurantForm.username || 'username'}</b></small>
              </div>
              <div className="onboarding-field">
                <label>Tagline</label>
                <input type="text" className="onboarding-input" value={restaurantForm.tagline} onChange={e => setRestaurantForm(prev => ({ ...prev, tagline: e.target.value }))} placeholder="e.g. Fresh food, fast" />
              </div>
              <div className="onboarding-field">
                <label>Bio / Description</label>
                <textarea className="onboarding-textarea" rows={3} value={restaurantForm.bio} onChange={e => setRestaurantForm(prev => ({ ...prev, bio: e.target.value }))} placeholder="Tell customers about your restaurant..." />
              </div>
              <div className="onboarding-field" style={{ marginTop: '1.5rem' }}>
                <label>Banner Image</label>
                <button
                  type="button"
                  className="upload-trigger-btn"
                  onClick={() => { if (restaurantBannerInputRef.current) { restaurantBannerInputRef.current.value = ''; restaurantBannerInputRef.current.click(); } }}
                >
                  <div className="upload-preview-banner" style={{ height: '140px' }}>
                    {restaurantForm.banner ? <img src={fixImageUrl(restaurantForm.banner)} alt="Preview" /> : <span>+ Tap to upload banner</span>}
                  </div>
                </button>
                <input
                  ref={restaurantBannerInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={e => handlePickAndCrop(e, 16 / 9, handleRestaurantBannerUpload)}
                  accept="image/*"
                />
              </div>
            </div>
            <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="onboarding-btn-primary" onClick={() => {
                setRestaurantForm(prev => ({ ...prev, email: prev.email || displayEmail }));
                updateRestaurantOnboardingStep(2);
              }} disabled={!restaurantForm.name.trim() || !restaurantForm.username || usernameCheck.status !== 'available'}>Next Step →</button>
            </div>
          </div>
        )}

        {rStep === 2 && (
          <div className="onboarding-step fade-in">
            <h2>Step 2 – Contact info</h2>
            <p className="onboarding-subtitle">Phone and email contact</p>
            <div className="onboarding-fields">
              <div className="onboarding-field">
                <label>Phone</label>
                <PhoneINInput
                  wrapClassName="onboarding-phone-in"
                  value={restaurantForm.phone}
                  onChange={(v) => setRestaurantForm((prev) => ({ ...prev, phone: v }))}
                  autoFocus
                />
              </div>
              <div className="onboarding-field">
                <label>Email</label>
                <input type="email" className="onboarding-input" value={displayEmail || restaurantForm.email} readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
              </div>
            </div>
            <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="onboarding-btn-primary" onClick={() => updateRestaurantOnboardingStep(3)}>Next Step →</button>
            </div>
          </div>
        )}

        {rStep === 3 && (
          <div className="onboarding-step fade-in">
            <h2>Step 3 – Menu</h2>
            <p className="onboarding-subtitle">Upload your menu PDF</p>
            <div className="onboarding-fields">
              <div className="onboarding-field">
                <label style={{ color: '#1a1b2e' }}>Menu PDF</label>
                {!restaurantForm.menuPdf ? (
                  <div style={{ padding: '2rem', border: '2px dashed rgba(0,0,0,0.15)', borderRadius: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.02)' }}>
                    <input
                      ref={restaurantMenuInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="upload-trigger-btn"
                      style={{ width: 'auto', display: 'inline-block' }}
                      onClick={() => { if (restaurantMenuInputRef.current) { restaurantMenuInputRef.current.value = ''; restaurantMenuInputRef.current.click(); } }}
                    >
                      <span style={{ cursor: 'pointer', color: '#6366f1', fontWeight: 600, display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(99,102,241,0.1)', borderRadius: '8px' }}>
                        Upload PDF
                      </span>
                    </button>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>Max file size: 5MB</p>
                  </div>
                ) : (
                  <div style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                    <button
                      type="button"
                      onClick={removePdf}
                      aria-label="Remove PDF"
                      className="dash-pdf-remove-btn"
                    >
                      ×
                    </button>
                    <div className="hide-scrollbar" style={{ maxHeight: 400, overflowY: 'auto', background: '#f1f5f9', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <Document
                        file={restaurantForm.menuPdf}
                        onLoadSuccess={onPdfLoadSuccess}
                        loading={<div style={{ padding: '2rem', color: '#64748b' }}>Loading PDF...</div>}
                        error={<div style={{ padding: '2rem', color: '#ef4444' }}>Failed to load PDF. Try another.</div>}
                      >
                        {pdfNumPages && Array.from(new Array(pdfNumPages), (el, index) => (
                          <div key={`page_${index + 1}`} style={{ marginBottom: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                            <Page
                              pageNumber={index + 1}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                              width={280}
                            />
                          </div>
                        ))}
                      </Document>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="onboarding-btn-primary" onClick={() => updateRestaurantOnboardingStep(4)}>
                Next Step →
              </button>
            </div>
          </div>
        )}

        {rStep === 4 && (
          <div className="onboarding-step fade-in">
            <h2>Step 4 – Gallery</h2>
            <p className="onboarding-subtitle">Add up to 3 photos or GIFs (optional). You can select several files at once in the picker.</p>
            <div className="onboarding-fields">
              <div className="onboarding-field">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <label style={{ color: '#1a1b2e', margin: 0 }}>Gallery images</label>
                  {(restaurantForm.gallery || []).length < 4 && (
                    <>
                      <input
                        ref={restaurantGalleryInputRef}
                        type="file"
                        accept="image/*,image/gif"
                        multiple
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const picked = Array.from(e.target.files || []);
                          if (restaurantGalleryInputRef.current) restaurantGalleryInputRef.current.value = '';
                          if (picked.length === 0) return;
                          let latest = restaurantForm;
                          const maxAdd = Math.max(0, 4 - (latest.gallery || []).length);
                          const slice = picked.slice(0, maxAdd);
                          if (slice.length === 0) {
                            alert('Only 3 images are allowed.');
                            return;
                          }
                          setRestaurantGalleryUploading(true);
                          try {
                            for (const file of slice) {
                              if ((latest.gallery || []).length >= 4) break;
                              let finalFile;
                              try {
                                finalFile = await getFileAfterCropOrPassThrough(file, 1);
                              } catch (err) {
                                if (err?.message === 'CROP_CANCEL') break;
                                throw err;
                              }
                              assertGalleryFileKind(finalFile);
                              await assertVideoMaxDuration(finalFile);
                              const up = await generalProfileAPI.uploadPhoto(finalFile, () => getIdToken());
                              const url = extractUploadUrl(up);
                              if (!url) continue;
                              const existing = latest.gallery || [];
                              const base = (file.name || '').replace(/\.[^.]+$/, '') || `Gallery ${existing.length + 1}`;
                              latest = { ...latest, gallery: [...existing, { url, name: base }] };
                              setRestaurantForm(latest);
                            }
                          } catch (err) {
                            console.error('Onboarding gallery upload:', err);
                            alert(err.message || 'Could not upload image. Try a smaller file.');
                          } finally {
                            setRestaurantGalleryUploading(false);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="upload-trigger-btn"
                        style={{ width: 'auto' }}
                        onClick={() => { if (restaurantGalleryInputRef.current) { restaurantGalleryInputRef.current.value = ''; restaurantGalleryInputRef.current.click(); } }}
                        disabled={restaurantGalleryUploading}
                        aria-label="Add images or GIFs"
                      >
                        <span style={{ cursor: restaurantGalleryUploading ? 'wait' : 'pointer', color: '#6366f1', fontWeight: 600, fontSize: '0.85rem', opacity: restaurantGalleryUploading ? 0.7 : 1 }}>
                          {restaurantGalleryUploading ? 'Uploading…' : '+ Add images or GIFs'}
                        </span>
                      </button>
                    </>
                  )}
                </div>
                {(restaurantForm.gallery || []).length === 0 ? (
                  <div style={{ padding: '2rem', border: '2px dashed rgba(0,0,0,0.15)', borderRadius: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', background: 'rgba(0,0,0,0.02)' }}>
                    No gallery images yet. Add up to 4.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    {(restaurantForm.gallery || []).map((item, idx) => (
                      <div key={`${item.url}-${idx}`} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                        <img src={item.url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                        <div style={{ padding: '0.35rem', background: 'rgba(0,0,0,0.65)' }}>
                          <input
                            type="text"
                            value={item.name || ''}
                            placeholder="Caption"
                            onChange={(e) => {
                              const g = [...(restaurantForm.gallery || [])];
                              g[idx] = { ...g[idx], name: e.target.value };
                              setRestaurantForm((prev) => ({ ...prev, gallery: g }));
                            }}
                            style={{ width: '100%', fontSize: '0.75rem', padding: '0.25rem 0.35rem', borderRadius: '6px', border: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <button
                          type="button"
                          aria-label="Remove image"
                          onClick={() => {
                            setRestaurantForm((prev) => ({
                              ...prev,
                              gallery: (prev.gallery || []).filter((_, i) => i !== idx)
                            }));
                          }}
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            background: 'none',
                            border: 'none',
                            color: '#111827',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            lineHeight: 1,
                            padding: '2px 4px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="onboarding-btn-primary" onClick={() => updateRestaurantOnboardingStep(5)}>
                Next Step →
              </button>
            </div>
          </div>
        )}

        {rStep === 5 && (
          <div className="onboarding-step fade-in">
            <h2>Step 5 – Links</h2>
            <p className="onboarding-subtitle">Add social links and platforms customers can tap (optional)</p>
            <div className="onboarding-fields">
              <div className="onboarding-field">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <label style={{ color: '#1a1b2e', margin: 0 }}>Links</label>
                  <button
                    type="button"
                    onClick={() => {
                      setRTempPlatforms(Object.keys(restaurantForm.links || {}));
                      setRLinkSelectorOpen(true);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(0,0,0,0.2)',
                      background: '#fff',
                      color: '#1a1b2e',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> Add Platforms
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {ALL_PLATFORMS.filter((p) => p.id in (restaurantForm.links || {})).map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '10px',
                        padding: '0.35rem 0.5rem 0.35rem 0.65rem',
                        background: 'rgba(0,0,0,0.02)',
                        minHeight: '40px'
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          color: '#1a1b2e',
                          fontSize: '0.8rem',
                          flexShrink: 0,
                          maxWidth: '92px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={p.label}
                      >
                        {p.label}
                      </span>
                      <input
                        className="onboarding-input"
                        placeholder="URL / handle"
                        value={(restaurantForm.links || {})[p.id] || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setRestaurantForm((prev) => ({
                            ...prev,
                            links: { ...(prev.links || {}), [p.id]: v }
                          }));
                        }}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          margin: 0,
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.85rem',
                          borderRadius: '999px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setRestaurantForm((prev) => {
                            const next = { ...(prev.links || {}) };
                            delete next[p.id];
                            return { ...prev, links: next };
                          });
                        }}
                        style={{
                          flexShrink: 0,
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          fontSize: '1.05rem',
                          lineHeight: 1,
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        aria-label={`Remove ${p.label}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {Object.keys(restaurantForm.links || {}).length === 0 && (
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 0' }}>Tap “Add Platforms” to choose Instagram, WhatsApp, website, and more.</p>
                )}
              </div>
            </div>
            <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="onboarding-btn-complete" onClick={saveRestaurantProfile} disabled={restaurantSaving}>
                {restaurantSaving ? <><span>Setting up...</span>{setupLoader}</> : 'Save Restaurant ✓'}
              </button>
            </div>
          </div>
        )}

        {rLinkSelectorOpen && (
          <div className="dash-selector-overlay" style={{ zIndex: 100001 }}>
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
                      onClick={() => setRTempPlatforms((prev) => (isActive ? prev.filter((x) => x !== p.id) : [...prev, p.id]))}
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
                <button
                  type="button"
                  className="dash-selector-btn-done"
                  onClick={() => {
                    setRestaurantForm((prev) => {
                      const currentLinks = prev.links || {};
                      const newLinks = { ...currentLinks };
                      rTempPlatforms.forEach((id) => {
                        if (!(id in newLinks)) newLinks[id] = '';
                      });
                      Object.keys(newLinks).forEach((id) => {
                        if (!rTempPlatforms.includes(id)) delete newLinks[id];
                      });
                      return { ...prev, links: newLinks };
                    });
                    setRLinkSelectorOpen(false);
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
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
