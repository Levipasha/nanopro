import React from 'react';
import { ALL_PLATFORMS } from './ProfileHelpers';
import ProfileArtistPlatformCard from './ProfileArtistPlatformCard';

export default function ProfileArtistPlatforms(props) {
  const {
    artist,
    myArtists,
    frontendBase,
    isMobileViewport,
    error,
    artistsLoading,
    visiblePlatforms,
    openSubPanel,
    setOpenSubPanel,
    setIsSelectorOpen,
    setTempPlatforms,
    previewKey,
    // props for card
    pendingLinks,
    openLinkPopup,
    handleUpdateLink,
    handleUpdateHeroField,
    handleUpdateLinkLayout,
    handleUpdateLinkImage,
    handleRemoveLinkImage,
    handleUpdateLinkPrioritize,
    handleDuplicateLink,
    hidePreview
  } = props;

  return (
    <>
      {error && <div className="profile-error-msg" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {artistsLoading ? (
        <div className="dash-loading">
          <div className="dash-loading-spinner" />
          <span>Loading digital platforms…</span>
        </div>
      ) : myArtists.length === 0 ? (
        <div className="dash-empty-state" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1.3rem' }}>Please set up your profile first.</h3>
        </div>
      ) : (() => {
        return (
          <div className="dash-profile-layout">
            <div className="dash-single-profile" style={{ padding: '1.5rem' }}>
              {/* Links Section Header */}
              <div className="dash-section-header">
                <h3 className="dash-section-label">Links</h3>
                <button
                  type="button"
                  className="dash-add-platform-btn"
                  onClick={() => {
                    setTempPlatforms([...visiblePlatforms]);
                    setIsSelectorOpen(true);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Platforms
                </button>
              </div>

              {/* Link Cards Section */}
              <div className="dash-links-section" style={{ marginBottom: '2rem' }}>
                {(() => {
                  const renderedCards = [];
                  const existingLinks = Array.isArray(artist.links) ? artist.links : [];

                  // Render cards for existing links
                  existingLinks.forEach((linkItem, idx) => {
                    const platformObj = ALL_PLATFORMS.find(p => p.id === linkItem.platform);
                    if (platformObj) {
                      renderedCards.push(
                        <ProfileArtistPlatformCard
                          key={linkItem._id || `${linkItem.platform}-${idx}`}
                          platform={platformObj}
                          linkItem={linkItem}
                          artist={artist}
                          pendingLinks={pendingLinks}
                          openSubPanel={openSubPanel}
                          setOpenSubPanel={setOpenSubPanel}
                          openLinkPopup={openLinkPopup}
                          handleUpdateLink={handleUpdateLink}
                          handleUpdateHeroField={handleUpdateHeroField}
                          handleUpdateLinkLayout={handleUpdateLinkLayout}
                          handleUpdateLinkImage={handleUpdateLinkImage}
                          handleRemoveLinkImage={handleRemoveLinkImage}
                          handleUpdateLinkPrioritize={handleUpdateLinkPrioritize}
                          handleDuplicateLink={handleDuplicateLink}
                          isMobileViewport={isMobileViewport}
                        />
                      );
                    }
                  });

                  // Render placeholder cards for visible platforms that have no links at all
                  visiblePlatforms.forEach((platformId) => {
                    const hasLink = existingLinks.some(l => (l.platform || '').toLowerCase() === platformId.toLowerCase());
                    if (!hasLink) {
                      const platformObj = ALL_PLATFORMS.find(p => p.id === platformId);
                      if (platformObj) {
                        renderedCards.push(
                          <ProfileArtistPlatformCard
                            key={platformId}
                            platform={platformObj}
                            linkItem={null}
                            artist={artist}
                            pendingLinks={pendingLinks}
                            openSubPanel={openSubPanel}
                            setOpenSubPanel={setOpenSubPanel}
                            openLinkPopup={openLinkPopup}
                            handleUpdateLink={handleUpdateLink}
                            handleUpdateHeroField={handleUpdateHeroField}
                            handleUpdateLinkLayout={handleUpdateLinkLayout}
                            handleUpdateLinkImage={handleUpdateLinkImage}
                            handleRemoveLinkImage={handleRemoveLinkImage}
                            handleUpdateLinkPrioritize={handleUpdateLinkPrioritize}
                            handleDuplicateLink={handleDuplicateLink}
                            isMobileViewport={isMobileViewport}
                          />
                        );
                      }
                    }
                  });

                  return renderedCards;
                })()}
              </div>
            </div>

            {/* Desktop Preview Panel */}
            {!isMobileViewport && !hidePreview && (
              <div className="dash-preview-panel">
                <div className="dash-full-preview-container">
                  <iframe
                    key={previewKey}
                    title="Profile Preview"
                    src={`${frontendBase}/artist/${artist.artistId}?no_redirect=1`}
                    className="dash-preview-iframe"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}
