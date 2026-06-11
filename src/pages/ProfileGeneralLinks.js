import React from 'react';
import ReactDOM from 'react-dom';
import { ALL_PLATFORMS } from './ProfileHelpers';
import { getLinkIcon } from '../components/LinkIcons';
import ProfileGeneralPlatformCard from './ProfileGeneralPlatformCard';

export default function ProfileGeneralLinks(props) {
  const {
    generalActiveTab,
    error,
    generalForm,
    updateLink,
    removeLink,
    duplicateLink,
    addLink,
    isMobileViewport,
    generalProfile,
    previewKey,
    getProfileLink,
    hidePreview,
    forceShow,
    isGeneralPlatformSelectorOpen,
    setIsGeneralPlatformSelectorOpen,
    tempPlatforms,
    setTempPlatforms,
    toggleGeneralPlatformInSelector,
    handleGeneralPlatformDone,
  } = props;

  if (generalActiveTab !== 'links' && !forceShow) return null;

  const gProfileLink = getProfileLink ? getProfileLink() : '#';
  const links = Array.isArray(generalForm?.links) ? generalForm.links : [];

  const openSelector = () => {
    // Pre-select platforms already in the links list
    const existing = links.map(l => l.platform).filter(Boolean);
    setTempPlatforms(existing);
    setIsGeneralPlatformSelectorOpen(true);
  };

  return (
    <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden' }}>
      <div className="dash-single-profile" style={{ padding: '1.5rem', overflowY: 'auto' }}>
        {error && <div className="profile-error-msg" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        {/* Section header — identical to artist "Links" header */}
        <div className="dash-section-header">
          <h3 className="dash-section-label">Links</h3>
          <button
            type="button"
            className="dash-add-platform-btn"
            onClick={openSelector}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Platforms
          </button>
        </div>

        {/* Link Cards — 1:1 copy of artist platform card */}
        <div className="dash-links-section" style={{ marginBottom: '2rem' }}>
          {links.length === 0 && (
            <div className="dash-empty-state" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.3rem' }}>
                No links yet. Click "Add Platforms" to get started.
              </h3>
            </div>
          )}

          {links.map((link, idx) => {
            const platformObj =
              ALL_PLATFORMS.find(p => p.id === (link.platform || 'website')) ||
              { id: link.platform || 'website', label: link.title || 'Link', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' };

            return (
              <ProfileGeneralPlatformCard
                key={link._id || `${link.platform}-${idx}`}
                platform={platformObj}
                linkItem={link}
                idx={idx}
                updateLink={updateLink}
                removeLink={removeLink}
                duplicateLink={duplicateLink}
              />
            );
          })}
        </div>
      </div>

      {/* Desktop Preview Panel */}
      {!isMobileViewport && !hidePreview && (
        <div className="dash-preview-panel">
          <div className="dash-full-preview-container">
            <iframe
              key={`gp-links-${generalProfile?.username}-${previewKey}`}
              title="General Profile Preview"
              src={gProfileLink}
              className="dash-preview-iframe"
            />
          </div>
        </div>
      )}

      {/* ── Platform Selector Modal (1:1 copy of artist selector) ── */}
      {isGeneralPlatformSelectorOpen && ReactDOM.createPortal(
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
              from { opacity: 0; transform: scale(0.97); }
              to   { opacity: 1; transform: scale(1); }
            }
            .gplt-row { transition: background 0.15s; box-sizing: border-box; }
            .gplt-row:hover { background: #f8fafc !important; }
            .gplt-row.gplt-active { background: #f0fdf4 !important; }
            .gplt-row.gplt-active:hover { background: #dcfce7 !important; }
            .gplt-search:focus { border-color: #2563eb !important; outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important; }
            .gplt-cancel:hover { background: #f1f5f9 !important; }
            .gplt-done:hover { filter: brightness(1.08); }
            .gplt-list::-webkit-scrollbar { width: 4px; }
            .gplt-list::-webkit-scrollbar-track { background: transparent; }
            .gplt-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
            .gplt-list { overflow-x: hidden !important; }
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
                  onClick={() => setIsGeneralPlatformSelectorOpen(false)}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#64748b', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}
                >×</button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  className="gplt-search"
                  type="text"
                  placeholder="Search..."
                  onChange={e => {
                    const q = e.target.value.toLowerCase();
                    document.querySelectorAll('.gplt-row').forEach(r => {
                      r.style.display = (r.dataset.name || '').includes(q) ? 'flex' : 'none';
                    });
                  }}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 1rem 0.65rem 2.4rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '0.88rem', color: '#0f172a', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                />
              </div>
            </div>

            {/* Platform List */}
            <div className="gplt-list" style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>
              {ALL_PLATFORMS.map((p, idx) => {
                const isActive = tempPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    data-name={p.label.toLowerCase()}
                    className={`gplt-row${isActive ? ' gplt-active' : ''}`}
                    type="button"
                    onClick={() => toggleGeneralPlatformInSelector(p.id)}
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
                    {/* Platform icon */}
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

                    {/* Active indicator */}
                    {isActive ? (
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 8px rgba(34,197,94,0.35)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                    ) : (
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
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
                className="gplt-cancel"
                onClick={() => setIsGeneralPlatformSelectorOpen(false)}
                style={{ flex: 1, padding: '0.8rem', borderRadius: '11px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'background 0.15s' }}
              >Cancel</button>
              <button
                type="button"
                className="gplt-done"
                onClick={handleGeneralPlatformDone}
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
    </div>
  );
}
