import React from 'react';
import { LivePreviewSyncOverlay } from './ProfileHelpers';
import { generalProfileAPI } from '../services/api';

export default function ProfileGeneralProfiles({
  error,
  artistsLoading,
  myArtists,
  saving,
  user,
  getIdToken,
  getFirebaseUser,
  loadMyProfiles,
  setError,
  setSaving,
  handlePickAndCrop,
  handleUploadField,
  editingHeroField,
  heroUpdates,
  setHeroUpdates,
  setEditingHeroField,
  openHeroEditor,
  isAddingTag,
  setIsAddingTag,
  handleAddTag,
  handleUpdateHeroField,
  newTagText,
  setNewTagText,
  handleDeleteTag,
  isUploading,
  mobileHeroEditField,
  setMobileHeroEditField,
  mobileHeroDraft,
  setMobileHeroDraft,
  saveMobileHeroField,
  savingLink,
  setMyArtists,
  setPreviewKey,
  previewKey,
  frontendBase,
  isMobileViewport,
  displayEmail,
  hidePreview
}) {
  return (
    <>
      {error && <div className="profile-error-msg" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {artistsLoading ? (
        <div className="dash-loading">
          <div className="dash-loading-spinner" />
          <span>Loading your profile…</span>
        </div>
      ) : myArtists.length === 0 ? (
        <div className="dash-empty-state" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64" style={{ opacity: 0.4, marginBottom: '1.5rem' }}>
            <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          </svg>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1.3rem' }}>Create Your General Profile</h3>
          <p style={{ marginBottom: '1.5rem', color: 'var(--dash-subtext)', maxWidth: '380px', margin: '0 auto 1.5rem' }}>Set up your profile, connect social links, and get your unique profile link.</p>
          <button
            onClick={async () => {
              try {
                setSaving(true);
                if (user) {
                  await generalProfileAPI.create({ name: user.displayName || 'New Profile', username: `user-${Date.now()}`, profileType: 'general', isSetup: true }, () => getIdToken(), getFirebaseUser);
                }
                await loadMyProfiles();
              } catch (err) {
                setError(err.message || 'Failed to create profile');
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            style={{ padding: '0.9rem 2.5rem', borderRadius: '14px', fontSize: '1rem', fontWeight: 700, background: '#ffffff', color: '#000000', border: 'none', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.45)' }}
          >
            {saving ? 'Creating...' : 'Get Started'}
          </button>
        </div>
      ) : (() => {
        // Only use the first (primary) profile — 1 per email rule
        const artist = myArtists[0];
        return (
          <div className="dash-profile-layout">

            {/* ── LEFT: Profile Info ── */}
            <div className="dash-single-profile">
              {/* Profile Hero */}
              <div className="dash-profile-hero">

                <div className="dash-profile-hero-content">
                  <div className="dash-profile-hero-avatar">
                    <label className="dash-avatar-trigger">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml"
                        onChange={(e) => handlePickAndCrop(e, 1, (file) => handleUploadField('photo', file))}
                        style={{ display: 'none' }}
                      />
                      {artist.photo
                        ? <img src={artist.photo} alt={artist.name} />
                        : <span>{artist.name?.charAt(0) || '?'}</span>
                      }
                      <div className="dash-avatar-overlay">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </div>
                      {isUploading === 'photo' && <div className="dash-avatar-uploading-spinner" />}
                    </label>
                  </div>
                  <div className="dash-profile-hero-info">
                    <div className="dash-hero-editable-wrapper">
                      {editingHeroField === 'name' ? (
                        <div className="dash-hero-edit-row">
                          <input
                            className="dash-hero-inline-input name"
                            autoFocus
                            value={heroUpdates.name !== undefined ? heroUpdates.name : (artist.name || '')}
                            onChange={(e) => setHeroUpdates(prev => ({ ...prev, name: e.target.value }))}
                          />
                          <button onClick={() => handleUpdateHeroField('name', heroUpdates.name)}>Save</button>
                          <button className="cancel" onClick={() => setEditingHeroField(null)}>✕</button>
                        </div>
                      ) : (
                        <h2
                          className="dash-profile-hero-name clickable"
                          onClick={() => openHeroEditor('name', artist)}
                        >
                          <span>{artist.name || 'Unnamed Profile'}</span>
                        </h2>
                      )}
                    </div>

                    <div className="dash-hero-tags-simple" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px' }}>
                      {/* Location Tag */}
                      <div
                        className="dash-hero-tag-item"
                        onClick={() => openHeroEditor('location', artist)}
                        style={{
                          background: 'rgba(0,0,0,0.06)',
                          padding: '6px 14px',
                          borderRadius: '100px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--dash-text)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '6px'
                        }}
                      >
                        <span style={{ opacity: 0.5, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loc:</span>
                        <span>{artist.city || artist.state ? `${artist.city}${artist.city && artist.state ? ', ' : ''}${artist.state}` : 'Add Location'}</span>
                      </div>

                      {/* Custom Dynamic Tags */}
                      {(artist.specialization || '').split(',').map(t => t.trim()).filter(Boolean).map((tag, idx) => (
                        <div
                          className="dash-hero-tag-item"
                          key={idx}
                          style={{
                            background: 'rgba(124, 58, 237, 0.08)',
                            border: '1px solid rgba(124, 58, 237, 0.15)',
                            padding: '6px 14px',
                            borderRadius: '100px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: '#4f46e5',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>{tag}</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTag(tag);
                            }}
                            style={{
                              marginLeft: '6px',
                              fontSize: '1.1rem',
                              fontWeight: 'bold',
                              color: '#ef4444',
                              cursor: 'pointer',
                              lineHeight: '1',
                              display: 'inline-block'
                            }}
                            title="Delete tag"
                          >
                            ×
                          </span>
                        </div>
                      ))}

                      {/* Inline Add Tag Form/Button */}
                      {isAddingTag ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAddTag(newTagText);
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <input
                            type="text"
                            value={newTagText}
                            onChange={(e) => setNewTagText(e.target.value)}
                            placeholder="Add tag..."
                            autoFocus
                            style={{
                              background: '#ffffff',
                              border: '1.5px solid #a855f7',
                              borderRadius: '50px',
                              padding: '5px 12px',
                              fontSize: '0.8rem',
                              outline: 'none',
                              color: '#0f172a',
                              width: '120px',
                              fontFamily: 'Outfit, sans-serif'
                            }}
                          />
                          <button
                            type="submit"
                            style={{
                              border: 'none',
                              background: '#4f46e5',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '26px',
                              height: '26px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 'bold'
                            }}
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingTag(false)}
                            style={{
                              border: 'none',
                              background: 'rgba(0,0,0,0.06)',
                              color: '#4b5563',
                              borderRadius: '50%',
                              width: '26px',
                              height: '26px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 'bold'
                            }}
                          >
                            ✕
                          </button>
                        </form>
                      ) : (
                        <div
                          onClick={() => {
                            setIsAddingTag(true);
                            setNewTagText('');
                          }}
                          style={{
                            background: 'rgba(79, 70, 229, 0.08)',
                            border: '1.5px dashed rgba(79, 70, 229, 0.35)',
                            color: '#4f46e5',
                            padding: '6px 14px',
                            borderRadius: '100px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          + Add Tag
                        </div>
                      )}
                    </div>

                    {/* Mobile inline editors (hidden by default, shown when editing) */}
                    <div className="dash-hero-editable-wrapper" style={{ display: editingHeroField === 'specialization' ? 'block' : 'none' }}>
                      {editingHeroField === 'specialization' && (
                        <div className="dash-hero-edit-row">
                          <input
                            className="dash-hero-inline-input spec"
                            autoFocus
                            value={heroUpdates.specialization !== undefined ? heroUpdates.specialization : (artist.specialization || '')}
                            onChange={(e) => setHeroUpdates(prev => ({ ...prev, specialization: e.target.value }))}
                            placeholder="e.g. Visual Specialist"
                          />
                          <button onClick={() => handleUpdateHeroField('specialization', heroUpdates.specialization)}>Save</button>
                          <button className="cancel" onClick={() => setEditingHeroField(null)}>✕</button>
                        </div>
                      )}
                    </div>
                    <div className="dash-hero-editable-wrapper" style={{ display: editingHeroField === 'experience' ? 'block' : 'none' }}>
                      {editingHeroField === 'experience' && (
                        <div className="dash-hero-edit-row">
                          <input
                            className="dash-hero-inline-input spec"
                            autoFocus
                            value={heroUpdates.experience !== undefined ? heroUpdates.experience : (artist.experience || '')}
                            onChange={(e) => setHeroUpdates(prev => ({ ...prev, experience: e.target.value }))}
                            placeholder="e.g. 2 years experience"
                          />
                          <button onClick={() => handleUpdateHeroField('experience', heroUpdates.experience)}>Save</button>
                          <button className="cancel" onClick={() => setEditingHeroField(null)}>✕</button>
                        </div>
                      )}
                    </div>
                    <div className="dash-hero-editable-wrapper" style={{ display: editingHeroField === 'location' ? 'block' : 'none' }}>
                      {editingHeroField === 'location' && (
                        <div className="dash-hero-edit-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input
                            className="dash-hero-inline-input spec"
                            autoFocus
                            value={heroUpdates.city !== undefined ? heroUpdates.city : (artist.city || '')}
                            onChange={(e) => setHeroUpdates(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="City (e.g. Mumbai)"
                          />
                          <input
                            className="dash-hero-inline-input spec"
                            value={heroUpdates.state !== undefined ? heroUpdates.state : (artist.state || '')}
                            onChange={(e) => setHeroUpdates(prev => ({ ...prev, state: e.target.value }))}
                            placeholder="State (e.g. Maharashtra)"
                          />
                          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                            <button style={{ flex: 1 }} onClick={() => {
                              const c = heroUpdates.city !== undefined ? heroUpdates.city : artist.city;
                              const s = heroUpdates.state !== undefined ? heroUpdates.state : artist.state;
                              handleUpdateHeroField('city', c, { state: s });
                            }}>Save</button>
                            <button className="cancel" style={{ flex: 1 }} onClick={() => setEditingHeroField(null)}>✕</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <LivePreviewSyncOverlay show={isUploading === 'backgroundPhoto'} message="Uploading cover…" />
              </div>

              {mobileHeroEditField && (
                <div
                  className="dash-mobile-edit-overlay"
                  onClick={() => setMobileHeroEditField(null)}
                >
                  <div
                    className="dash-mobile-edit-modal"
                    aria-label={
                      mobileHeroEditField === 'name' ? 'Edit name' :
                        mobileHeroEditField === 'experience' ? 'Edit experience' :
                          'Edit profile tag'
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="dash-mobile-edit-header">
                      <div className="dash-mobile-edit-title">
                        {
                          mobileHeroEditField === 'name' ? 'Edit name' :
                            mobileHeroEditField === 'experience' ? 'Edit experience' :
                              'Edit profile tag'
                        }
                      </div>
                      <button
                        type="button"
                        className="dash-mobile-edit-close"
                        onClick={() => setMobileHeroEditField(null)}
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>
                    <div className="dash-mobile-edit-body">
                      <input
                        className="dash-mobile-edit-input"
                        value={mobileHeroDraft}
                        placeholder={
                          mobileHeroEditField === 'name' ? 'Enter your name' :
                            mobileHeroEditField === 'experience' ? 'Enter experience (e.g. 2 years)' :
                              'Enter your profile tag'
                        }
                        onChange={(e) => setMobileHeroDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setMobileHeroEditField(null);
                          if (e.key === 'Enter') saveMobileHeroField();
                        }}
                      />
                      <div className="dash-mobile-edit-actions">
                        <button
                          type="button"
                          className="dash-mobile-edit-btn ghost"
                          onClick={() => setMobileHeroEditField(null)}
                          disabled={savingLink === mobileHeroEditField}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="dash-mobile-edit-btn primary"
                          onClick={saveMobileHeroField}
                          disabled={savingLink === mobileHeroEditField}
                        >
                          {savingLink === mobileHeroEditField ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* Bio Section */}
              <div className="dash-profile-bio-section">
                <h3 className="dash-section-label">About</h3>
                <div className="dash-hero-editable-wrapper">
                  {editingHeroField === 'about' ? (
                    <div className="dash-hero-edit-row bio" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input
                        className="dash-hero-inline-input spec"
                        autoFocus
                        value={heroUpdates.experience !== undefined ? heroUpdates.experience : (artist.experience || '')}
                        onChange={(e) => setHeroUpdates(prev => ({ ...prev, experience: e.target.value }))}
                        placeholder="Headline (e.g. A passionate creative mind)"
                        style={{ width: '100%', fontFamily: 'Outfit, sans-serif' }}
                      />
                      <textarea
                        className="dash-hero-inline-textarea"
                        rows={4}
                        value={heroUpdates.bio !== undefined ? heroUpdates.bio : (artist.bio || '')}
                        onChange={(e) => setHeroUpdates(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Describe yourself..."
                        style={{ width: '100%', fontFamily: 'Outfit, sans-serif' }}
                      />
                      <div className="dash-bio-actions" style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => {
                          const expVal = heroUpdates.experience !== undefined ? heroUpdates.experience : (artist.experience || '');
                          const bioVal = heroUpdates.bio !== undefined ? heroUpdates.bio : (artist.bio || '');
                          handleUpdateHeroField('experience', expVal, { bio: bioVal });
                        }}>Save About</button>
                        <button className="cancel" onClick={() => { setEditingHeroField(null); setHeroUpdates({}); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="dash-profile-bio clickable"
                      onClick={() => {
                        setHeroUpdates({ experience: artist.experience || '', bio: artist.bio || '' });
                        setEditingHeroField('about');
                      }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}
                    >
                      <h4 style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                        {artist.experience || 'Add an inspiring headline...'}
                      </h4>
                      <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {artist.bio || 'Add a bio describing yourself...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {myArtists.length > 1 && (
                <p className="dash-multi-profile-note">
                  ⚠️ Your account has {myArtists.length} profiles linked. Only one profile per email is allowed. Please contact support to resolve this.
                </p>
              )}
            </div>

            {/* ── RIGHT: Live iframe Preview (desktop / laptop only) ── */}
            {!isMobileViewport && !hidePreview && (
              <div className="dash-preview-panel">
                <div className="dash-full-preview-container">
                  <iframe
                    key={previewKey}
                    title="Profile Preview"
                    src={`${frontendBase}/link/${artist.artistId}?no_redirect=1`}
                    className="dash-preview-iframe"
                  />
                  <LivePreviewSyncOverlay show={isUploading === 'backgroundPhoto'} message="Uploading cover…" />
                </div>
              </div>
            )}

          </div>
        );
      })()}
    </>
  );
}
