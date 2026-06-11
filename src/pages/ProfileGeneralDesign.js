import React from 'react';
import { GENERAL_THEMES, AVAILABLE_FONTS, resolveFontFamily } from '../constants/generalThemes';

export default function ProfileGeneralDesign({
  isMobileViewport,
  activeTab,
  setActiveTab,
  previewKey,
  frontendBase,
  designSubTab,
  setDesignSubTab,
  myArtists,
  handleUpdateHeroField,
  syncFonts,
  setSyncFonts,
  hidePreview
}) {
  if (!myArtists || !myArtists[0]) return null;
  const artist = myArtists[0];

  return isMobileViewport ? (
    <div className="dash-design-mobile-page">
      <div className="dash-design-mobile-header">
        <button
          type="button"
          className="dash-design-mobile-back"
          onClick={() => setActiveTab('profiles')}
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="dash-design-mobile-title">Design</span>
      </div>
      <div className="dash-design-mobile-preview-wrap dash-design-mobile-preview-wrap--relative">
        {designSubTab && (
          <button
            type="button"
            className="dash-design-mobile-preview-dismiss"
            aria-label="Close design options"
            onClick={() => setDesignSubTab(null)}
          />
        )}
        <iframe
          key={previewKey}
          title="Profile Design Preview"
          src={`${frontendBase}/link/${artist.artistId}`}
          className="dash-design-mobile-preview-iframe"
        />
      </div>

      <div className="dash-design-mobile-sheet">
        <div className="dash-premium-toggle-container">
          <div className="dash-premium-toggle">
            <button
              type="button"
              className="dash-premium-toggle-btn active"
            >
              <span className="toggle-icon">🎨</span>
              <span>Themes</span>
            </button>
          </div>
        </div>
        {designSubTab && (
          <div className="dash-design-mobile-body">
            {designSubTab === 'theme' && (
              <section className="dash-design-section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--dash-text)' }}>Profile Theme</h2>
                <p style={{ color: 'var(--dash-subtext)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Choose a professional look for your public page</p>
                <div className="dash-design-grid dash-themes-grid">
                  {GENERAL_THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleUpdateHeroField('profileTheme', t.id)}
                      className={`dash-design-card ${artist.profileTheme === t.id ? 'active' : ''}`}
                      style={{
                        border: '2px solid ' + (artist.profileTheme === t.id ? 'var(--dash-accent)' : 'var(--dash-border)'),
                        boxShadow: artist.profileTheme === t.id ? '0 10px 25px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      <div className={`dash-theme-indicator ${t.isAnimated ? t.className : ''}`} style={{ background: t.isAnimated ? undefined : (t.palette || t.bg) }} />
                      <h3 className="dash-design-card-label">{t.label}</h3>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden' }}>
      <div className="dash-single-profile" style={{ padding: '2.5rem', overflowY: 'auto' }}>
        {/* Desktop sub‑toggle: Theme / Font */}
        <div className="dash-premium-toggle-container">
          <div className="dash-premium-toggle">
            <button
              type="button"
              className="dash-premium-toggle-btn active"
            >
              <span className="toggle-icon">🎨</span>
              <span>Theme</span>
            </button>
          </div>
        </div>

        {(!designSubTab || designSubTab === 'theme') && (
          <section className="dash-design-section" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--dash-text)' }}>Profile Theme</h2>
            <p style={{ color: 'var(--dash-subtext)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Choose a professional look for your public page</p>
            <div className="dash-design-grid dash-themes-grid">
              {GENERAL_THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleUpdateHeroField('profileTheme', t.id)}
                  className={`dash-design-card ${artist.profileTheme === t.id ? 'active' : ''}`}
                  style={{
                    border: '2px solid ' + (artist.profileTheme === t.id ? 'var(--dash-accent)' : 'var(--dash-border)'),
                    boxShadow: artist.profileTheme === t.id ? '0 10px 25px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <div className={`dash-theme-indicator ${t.isAnimated ? t.className : ''}`} style={{ background: t.isAnimated ? undefined : (t.palette || t.bg) }} />
                  <h3 className="dash-design-card-label">{t.label}</h3>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Preview on the right (desktop / laptop only) */}
      {!isMobileViewport && !hidePreview && (
        <div className="dash-preview-panel">
          <div className="dash-full-preview-container">
            <iframe
              key={previewKey}
              title="Profile Design Preview"
              src={`${frontendBase}/link/${artist.artistId}`}
              className="dash-preview-iframe"
            />
          </div>
        </div>
      )}
    </div>
  );
}
