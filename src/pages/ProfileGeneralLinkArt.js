import React from 'react';
import '../components/dashProfile.css';
import DashProfileLayout from '../components/DashProfileLayout';
import { extractUploadUrl } from './ProfileHelpers';
import { generalProfileAPI } from '../services/api';
import { getIdToken } from '../firebase';

const ART_THEMES = [
  { id: 'painting', label: 'Painting', icon: '🖼️', color: '#e67e22' },
  { id: 'digital', label: 'Digital Art', icon: '💻', color: '#3498db' },
  { id: 'sculpture', label: 'Sculpture', icon: '🗿', color: '#95a5a6' },
  { id: 'photography', label: 'Photography', icon: '📷', color: '#2c3e50' },
  { id: 'illustration', label: 'Illustration', icon: '✏️', color: '#9b59b6' },
  { id: 'abstract', label: 'Abstract', icon: '🌀', color: '#e74c3c' },
  { id: 'portrait', label: 'Portrait', icon: '👤', color: '#1abc9c' },
  { id: 'landscape', label: 'Landscape', icon: '🏞️', color: '#27ae60' },
  { id: 'miniature', label: 'Miniature', icon: '🔬', color: '#f39c12' },
  { id: 'street', label: 'Street Art', icon: '🏙️', color: '#e91e63' },
  { id: 'mixed', label: 'Mixed Media', icon: '🎭', color: '#673ab7' },
  { id: 'other', label: 'Other', icon: '🎨', color: '#607d8b' },
];

export default function ProfileGeneralLinkArt({
  myArtists,
  activeTab,
  frontendBase,
  handlePickAndCropBatch,
  artImagePreview,
  setArtImagePreview,
  artSaving,
  setArtSaving,
  newArtTheme,
  setNewArtTheme,
  handleUpdateHeroField,
  isMobileViewport,
  setArtQrModal,
  hidePreview
}) {
  if (!myArtists || !myArtists[0]) return null;
  const artist = myArtists[0];

  const artShowcase = artist.artLinks || [];
  const allItems = Array.isArray(artShowcase) ? artShowcase : [];
  const items = allItems.filter(item => {
    if (activeTab === 'what-i-do') {
      return item.itemType === 'service';
    } else {
      return item.itemType === 'artwork' || !item.itemType;
    }
  });

  const artistToken = artist.artistId || artist._id;
  const getArtUrl = (artId) => `${frontendBase}/link/${artistToken}?art=${artId}`;
  const getQrUrl = (artUrl) => `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(artUrl)}&bgcolor=ffffff&color=1a1a2e&qzone=2`;

  const handleArtImagePick = (e) => {
    handlePickAndCropBatch(e, 3 / 4, async (croppedFile) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setArtImagePreview(prev => [...prev, { file: croppedFile, url: ev.target.result }]);
      };
      reader.readAsDataURL(croppedFile);
    });
  };

  const handleAddArt = async () => {
    const title = document.getElementById('art-title-input')?.value?.trim();
    const desc = document.getElementById('art-desc-input')?.value?.trim();
    const label = activeTab === 'what-i-do' ? 'service' : 'artwork';
    if (!title) return alert(activeTab === 'what-i-do' ? 'Please enter a title for what you do.' : 'Please enter an art title.');
    setArtSaving(true);
    try {
      const uploadedUrls = [];
      for (const img of artImagePreview) {
        const uploaded = await generalProfileAPI.uploadPhoto(img.file, () => getIdToken());
        const u = extractUploadUrl(uploaded);
        if (u) uploadedUrls.push(u);
      }
      if (artImagePreview.length > 0 && uploadedUrls.length === 0) {
        throw new Error('Image upload did not return URLs. Try again.');
      }
      const artId = Date.now();
      const newItem = { id: artId, title, description: desc || '', theme: newArtTheme, images: uploadedUrls, itemType: label };
      await handleUpdateHeroField('artLinks', [...allItems, newItem]);
      
      const titleInput = document.getElementById('art-title-input');
      if (titleInput) titleInput.value = '';
      const descInput = document.getElementById('art-desc-input');
      if (descInput) descInput.value = '';
      
      setArtImagePreview([]);
      setNewArtTheme('painting');
    } catch (err) {
      alert(err.message || (activeTab === 'what-i-do' ? 'Could not save "What I Do" item.' : 'Could not save artwork.'));
    } finally {
      setArtSaving(false);
    }
  };

  const handleRemoveArt = async (itemId) => {
    await handleUpdateHeroField('artLinks', allItems.filter(i => i.id !== itemId));
  };

  const handleSetPrimaryArt = async (itemId) => {
    const updatedAllItems = allItems.map(item => {
      if (item.itemType === 'service') {
        return {
          ...item,
          isPrimary: activeTab === 'what-i-do' ? item.id === itemId : item.isPrimary
        };
      } else {
        return {
          ...item,
          isPrimary: activeTab === 'link-art' ? item.id === itemId : item.isPrimary
        };
      }
    });
    await handleUpdateHeroField('artLinks', updatedAllItems);
  };

  const artPreviewSrc = `${frontendBase}/link/${artistToken}`;

  return (
    <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden' }}>
      {/* ── LEFT: Form + cards ── */}
      <div className="dash-single-profile" style={{ padding: '2rem 2.5rem', overflowY: 'auto' }}>

        {/* ── Add New Art Form ── */}
        <div className="dash-art-add-card">
          

          {/* Multi-image upload */}
          {activeTab !== 'what-i-do' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--dash-subtext)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Artwork Images {artImagePreview.length > 0 && <span style={{ color: 'var(--dash-accent)' }}>({artImagePreview.length} added)</span>}
              </label>

              {/* Thumbnail strip if images picked */}
              {artImagePreview.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {artImagePreview.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '16px', overflow: 'visible', border: '2px solid var(--dash-accent)' }}>
                      <img src={img.url} alt={`art-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                      <button onClick={() => setArtImagePreview(prev => prev.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: '#fff', border: '2px solid var(--dash-bg-card, #1e293b)', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, padding: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.3)', zIndex: 10 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload zone */}
              <label htmlFor="art-image-file" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', border: '2px dashed var(--dash-accent)', borderRadius: '14px', padding: '1.25rem', cursor: 'pointer', background: 'var(--dash-bg)', transition: 'all 0.2s' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28" style={{ color: 'var(--dash-accent)', opacity: 0.7 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <span style={{ fontSize: '0.82rem', color: 'var(--dash-subtext)' }}>{artImagePreview.length > 0 ? '+ Add more images' : 'Click to upload artwork photos'}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--dash-subtext)', opacity: 0.55 }}>Multiple images per showcase — shown as slideshow</span>
                <input id="art-image-file" type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/heif,image/svg+xml" multiple onChange={handleArtImagePick} style={{ display: 'none' }} />
              </label>
            </div>
          )}

          {/* Title + Description */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--dash-subtext)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {activeTab === 'what-i-do' ? 'What I Do Title *' : 'Art Title *'}
            </label>
            <input id="art-title-input" type="text" placeholder={activeTab === 'what-i-do' ? 'e.g. Custom Portrait Commissions, Clay Workshops, Teaching, Designing' : 'e.g. Ocean Blue – Abstract Series No. 4'} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.9rem', border: '1.5px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--dash-subtext)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brief Description</label>
            <textarea id="art-desc-input" rows={3} placeholder={activeTab === 'what-i-do' ? 'Tell viewers about what you do in this area — details, process, tools, or style...' : 'Tell viewers what makes this artwork special — materials, inspiration, story behind it...'} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.9rem', border: '1.5px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>

          <button
            onClick={handleAddArt}
            disabled={artSaving}
            style={{
              padding: '0.85rem 2.25rem',
              borderRadius: '14px',
              fontSize: '0.95rem',
              fontWeight: 700,
              background: '#ffffff',
              color: '#000000',
              border: '1px solid #ffffff',
              cursor: artSaving ? 'wait' : 'pointer',
              opacity: artSaving ? 0.7 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {artSaving ? (<><span>Uploading...</span></>) : (<><span>✦</span><span>{activeTab === 'what-i-do' ? 'Add to "What I Do"' : 'Add to Showcase'}</span></>)}
          </button>
        </div>

        {/* ── Art Cards ── */}
        {items.length > 0 ? (
          <div>
            <div className="dash-art-header">
              <h3 className="dash-art-title">
                {activeTab === 'what-i-do' ? `Your "What I Do" Items (${items.length})` : `Your Art Showcase (${items.length})`}
              </h3>
              <span className="dash-art-subtitle">
                {activeTab === 'what-i-do' ? 'Add the things you do to showcase your skills and offerings' : 'Each card has its own unique URL + QR'}
              </span>
            </div>

            {activeTab === 'what-i-do' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                {items.map(item => (
                  <div key={item.id} className="dash-what-i-do-item-row" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--dash-card-bg, rgba(255,255,255,0.03))',
                    border: '1.5px solid var(--dash-border)',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    gap: '1.5rem',
                    position: 'relative'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--dash-text)', textTransform: 'capitalize' }}>
                        {item.title}
                      </h4>
                      {item.description && (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--dash-subtext)', lineHeight: 1.5 }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveArt(item.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '12px',
                        padding: isMobileViewport ? '8px 12px' : '8px 16px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                    >
                      {isMobileViewport ? '✕' : '✕ Remove'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dash-art-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.25rem',
                alignItems: 'stretch'
              }}>
                {items.map(item => {
                  const theme = ART_THEMES.find(t => t.id === item.theme) || ART_THEMES[ART_THEMES.length - 1];
                  const artUrl = getArtUrl(item.id);
                  const qrUrl = getQrUrl(artUrl);
                  const coverImage = item.image || (Array.isArray(item.images) ? item.images[0] : '');
                  return (
                    <div key={item.id} className="dash-art-card" style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100% !important',
                      minHeight: coverImage ? '400px' : '220px'
                    }}>
                      <button
                        onClick={() => handleRemoveArt(item.id)}
                        style={{ position: 'absolute', top: '0', right: '0', background: '#000', color: '#fff', border: 'none', borderRadius: '0 20px 0 12px', width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'all 0.2s', padding: 0, lineHeight: 1 }}
                        title="Remove artwork"
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#000'; }}
                      >
                        ✕
                      </button>

                      <button
                        onClick={() => handleSetPrimaryArt(item.id)}
                        style={{
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          background: item.isPrimary ? '#22c55e' : 'rgba(0,0,0,0.5)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '20px 0 12px 0',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          zIndex: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          backdropFilter: 'blur(4px)',
                          boxShadow: item.isPrimary ? '0 4px 12px rgba(34, 197, 94, 0.3)' : 'none'
                        }}
                      >
                        {item.isPrimary ? '✦ Primary' : 'Set Primary'}
                      </button>

                      {/* Artwork image */}
                      {coverImage ? (
                        <div style={{ width: '100%', height: '140px', overflow: 'hidden' }}>
                          <img src={coverImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div className="dash-art-placeholder" style={{ background: `linear-gradient(90deg, ${theme.color}, ${theme.color}88)` }} />
                      )}

                      <div style={{
                        padding: '1.25rem',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <h4 style={{ margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: 700, color: 'var(--dash-text)', lineHeight: 1.3 }}>{item.title}</h4>
                        </div>
                        {item.description && (
                          <p style={{
                            fontSize: '0.82rem',
                            color: 'var(--dash-subtext)',
                            lineHeight: 1.55,
                            margin: '0 0 1rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.description}
                          </p>
                        )}

                        <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(artUrl);
                            }}
                            className="dash-art-btn-copy"
                            style={{ width: '85%', maxWidth: '220px', padding: '10px 16px', fontSize: '0.85rem', fontWeight: '700', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: 0 }}
                          >
                            <span>🔗</span> Copy URL
                          </button>
                          <button
                            type="button"
                            onClick={() => setArtQrModal({ url: qrUrl, title: item.title })}
                            className="dash-art-btn-secondary"
                            style={{ width: '85%', maxWidth: '220px', padding: '10px 16px', fontSize: '0.85rem', fontWeight: '700', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: 0 }}
                          >
                            <span>⬇</span> QR Code
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--dash-subtext)', border: '2px dashed var(--dash-border)', borderRadius: '20px' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--dash-text)', marginBottom: '0.5rem' }}>
              {activeTab === 'what-i-do' ? 'No services or offerings added yet' : 'No artworks added yet'}
            </h3>
            <p style={{ fontSize: '0.9rem' }}>
              {activeTab === 'what-i-do' ? 'Add your first service or offering above — you\'ll get a unique URL + QR code for it!' : 'Upload your first artwork above — you\'ll get a unique URL + QR code to place on the physical art!'}
            </p>
          </div>
        )}
      </div>

      {/* ── RIGHT: Phone Preview (desktop / laptop only) ── */}
      {!isMobileViewport && !hidePreview && (
        <div className="dash-preview-panel">
          <div className="dash-full-preview-container">
            {items.length > 0 ? (
              <iframe
                key={artPreviewSrc}
                title="Art Preview"
                src={artPreviewSrc}
                className="dash-preview-iframe"
              />
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--dash-subtext)', gap: '0.75rem', padding: '2rem' }}>
                <span style={{ fontSize: '3rem' }}>📱</span>
                <p style={{ fontSize: '0.82rem', textAlign: 'center', margin: 0 }}>
                  {activeTab === 'what-i-do' ? 'Add a service or offering to see the live preview here' : 'Add an artwork to see the live preview here'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
