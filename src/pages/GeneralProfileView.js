import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { generalProfileAPI } from '../services/api';
import { fixImageUrl } from '../utils/imageHelper';
import { getLinkIcon } from '../components/LinkIcons';
import { getThemeById } from '../constants/generalThemes';
import './GeneralProfileView.css';

function GeneralProfileView() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await generalProfileAPI.getByUsername(username);
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          setError('Profile not found');
        }
      } catch (err) {
        setError(err.message || 'Profile not found');
      } finally {
        setLoading(false);
      }
    };
    if (username) fetchProfile();
  }, [username]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.name || 'Profile',
          text: profile?.bio || '',
          url
        });
      } catch (err) {
        if (err.name !== 'AbortError') copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => alert('Link copied!'));
  };

  if (loading) {
    return (
      <div className="gp-view gp-loading">
        <div className="gp-spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="gp-view gp-error">
        <div className="gp-error-icon">🔗</div>
        <h1>Profile not found</h1>
        <p>{error || 'This profile does not exist.'}</p>
      </div>
    );
  }

  const links = (profile.links || []).filter(l => l.url).sort((a, b) => (a.order || 0) - (b.order || 0));
  const theme = getThemeById(profile.theme || 'mint');

  return (
    <div className="gp-view gp-layout" style={{ background: theme.bg }}>
      <div className="gp-card gp-card-themed" style={{ background: theme.bg, color: theme.text }}>
        {/* Share button - top right */}
        <button type="button" onClick={handleShare} className="gp-share-btn" aria-label="Share">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>

        {/* Profile photo - centered */}
        <div className="gp-photo-wrap">
          {profile.photo && !imgError ? (
            <img
              src={fixImageUrl(profile.photo) || profile.photo}
              alt={profile.name}
              className="gp-avatar"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="gp-avatar-placeholder">
              {profile.name?.charAt(0) || '?'}
            </div>
          )}
        </div>

        {/* Username - @username */}
        <h1 className="gp-username">@{profile.username}</h1>

        {/* Tagline / Title */}
        {profile.title && (
          <p className="gp-title">{profile.title}</p>
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="gp-bio">{profile.bio}</p>
        )}

        {/* Link buttons - light green bg, black border, icon + text */}
        <div className="gp-links">
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="gp-link"
              style={{ background: theme.linkBg || theme.bg, color: theme.text, borderColor: theme.text }}
            >
              <span className="gp-link-icon">{getLinkIcon(link)}</span>
              <span className="gp-link-text">{link.title || link.url}</span>
            </a>
          ))}
        </div>

        <div className="gp-footer">
          <span>Powered by <a href="https://nanoprofiles.com" target="_blank" rel="noopener noreferrer">NanoProfiles</a></span>
        </div>
      </div>
    </div>
  );
}

export default GeneralProfileView;
