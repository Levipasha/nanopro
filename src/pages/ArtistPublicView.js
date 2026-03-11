import React from 'react';
import { useSearchParams } from 'react-router-dom';
import './GeneralProfileView.css';

/**
 * Minimal public artist profile route used for NFC / share links.
 * URL shape: /artist?id=<artistId>&art=<optionalArtId>
 *
 * NOTE: This is a placeholder visual shell so that
 * /artist does NOT fall back to the landing page.
 * You can later enhance it to fetch real public data from the backend.
 */
function ArtistPublicView() {
  const [searchParams] = useSearchParams();
  const artistId = searchParams.get('id');
  const artId = searchParams.get('art');

  if (!artistId) {
    return (
      <div className="gp-view gp-error">
        <div className="gp-error-icon">🔗</div>
        <h1>Artist profile link is missing an id.</h1>
        <p>Please check the link or regenerate it from your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="gp-view gp-layout">
      <div className="gp-card">
        <h1 style={{ marginBottom: '0.75rem' }}>Artist Profile</h1>
        <p style={{ opacity: 0.8, marginBottom: '0.25rem' }}>
          Artist ID: <strong>{artistId}</strong>
        </p>
        {artId && (
          <p style={{ opacity: 0.8, marginBottom: '0.75rem' }}>
            Artwork: <strong>{artId}</strong>
          </p>
        )}
        <p style={{ opacity: 0.75 }}>
          The public artist profile view is set up and routed correctly.
          You can now extend this page to load the full artist data from your backend.
        </p>
      </div>
    </div>
  );
}

export default ArtistPublicView;

