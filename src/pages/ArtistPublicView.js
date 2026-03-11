import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './GeneralProfileView.css';
import { landingArtistAPI } from '../services/api';
import { getLinkIcon } from '../components/LinkIcons';

/**
 * Public artist profile route used for NFC / share links.
 * URL shape: /artist?id=<artistId>&art=<optionalArtId>
 */
function ArtistPublicView() {
  const [searchParams] = useSearchParams();
  const artistId = searchParams.get('id');
  const artId = searchParams.get('art');

  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!artistId) {
      setError('Artist profile link is missing an id.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    landingArtistAPI
      .getPublicProfile(artistId)
      .then((data) => {
        if (cancelled) return;
        setArtist(data.data || data); // backend may wrap in { success, data }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Artist profile not found.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [artistId]);

  if (!artistId) {
    return (
      <div className="gp-view gp-error">
        <div className="gp-error-icon">🔗</div>
        <h1>Artist profile link is missing an id.</h1>
        <p>Please check the link or regenerate it from your dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="gp-view gp-loading">
        <div className="gp-spinner" />
        <p>Loading artist profile...</p>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="gp-view gp-error">
        <div className="gp-error-icon">🔗</div>
        <h1>Artist profile not found</h1>
        <p>{error || 'This artist profile does not exist.'}</p>
      </div>
    );
  }

  const primaryLinks = [];
  const linkFields = ['website', 'instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp'];
  linkFields.forEach((field) => {
    const val = artist[field];
    if (!val) return;
    let url = val;
    if (field === 'instagram' && !val.startsWith('http')) url = `https://instagram.com/${val.replace('@', '')}`;
    if (field === 'facebook' && !val.startsWith('http')) url = `https://facebook.com/${val}`;
    if (field === 'twitter' && !val.startsWith('http')) url = `https://x.com/${val.replace('@', '')}`;
    if (field === 'linkedin' && !val.startsWith('http')) url = `https://linkedin.com/in/${val}`;
    if (field === 'whatsapp' && !val.includes('wa.me')) {
      const clean = val.replace(/\D/g, '');
      if (clean) url = `https://wa.me/${clean}`;
    }
    primaryLinks.push({
      id: field,
      title: field.charAt(0).toUpperCase() + field.slice(1),
      url,
    });
  });

  return (
    <div className="gp-view gp-layout">
      <div className="gp-card">
        <div className="gp-photo-header">
          {artist.photo ? (
            <img src={artist.photo} alt={artist.name} className="gp-avatar-img" />
          ) : (
            <div className="gp-avatar-placeholder gp-avatar-placeholder-header">
              {artist.name?.charAt(0) || '?'}
            </div>
          )}
          <div className="gp-photo-overlay">
            {artist.name && <h1 className="gp-name">{artist.name}</h1>}
            {artist.specialization && <p className="gp-title-overlay">{artist.specialization}</p>}
          </div>
        </div>

        <p className="gp-username">@{artist.artistId || artist.username || artistId}</p>

        {artist.bio && <p className="gp-bio">{artist.bio}</p>}

        {artId && (
          <p style={{ opacity: 0.75, marginBottom: '12px' }}>
            Viewing artwork: <strong>{artId}</strong>
          </p>
        )}

        {primaryLinks.length > 0 && (
          <div className="gp-links">
            {primaryLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="gp-link"
              >
                <span className="gp-link-icon">{getLinkIcon({ platform: link.id })}</span>
                <span className="gp-link-text">{link.title}</span>
              </a>
            ))}
          </div>
        )}

        <div className="gp-footer">
          <span>
            Powered by{' '}
            <a href="https://nanoprofiles.com" target="_blank" rel="noopener noreferrer">
              NanoProfiles
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

export default ArtistPublicView;

