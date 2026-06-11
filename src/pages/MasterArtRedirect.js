import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { landingArtistAPI } from '../services/api';

/**
 * MasterArtRedirect handles the "Master Art URL" logic.
 * Scanning an NFC tag with /a/:artistId/art will hit this component.
 * It fetches the primary-marked art for the artist and opens the Art Gallery.
 */
function MasterArtRedirect() {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!artistId) {
      setError('Artist ID is missing.');
      setLoading(false);
      return;
    }

    landingArtistAPI.getPublicProfile(artistId)
      .then(res => {
        const artist = res.data || res;
        const artItems = Array.isArray(artist.artLinks) ? artist.artLinks : [];
        
        // Find primary art or use the first one as fallback
        const primaryArt = artItems.find(item => item.isPrimary) || artItems[0];

        if (!primaryArt) {
          // If no art found, just show the profile
          navigate(`/artist/${artistId}`);
          return;
        }

        // Navigate to the Art Gallery view with the primary item
        navigate('/show-my-art', {
          state: {
            artItems: [primaryArt], // Show ONLY the primary one via Master URL
            artistName: artist.name,
            isMasterUrl: true
          },
          replace: true
        });
      })
      .catch(err => {
        console.error('Master art error:', err);
        setError('Artist or art showcase not found.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [artistId, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', position: 'relative', overflowX: 'hidden' }}>
        <style>{`
          @keyframes skeleton-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .skeleton-shimmer-box {
            background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
            background-size: 200% 100%;
            animation: skeleton-shimmer 1.5s infinite linear;
          }
        `}</style>
        
        {/* Banner Skeleton */}
        <div className="skeleton-shimmer-box" style={{ width: '100%', height: '220px' }} />
        
        {/* Profile Info Container */}
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', marginTop: '-60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          {/* Avatar Skeleton */}
          <div className="skeleton-shimmer-box" style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid #0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
          
          {/* Name & Title */}
          <div className="skeleton-shimmer-box" style={{ width: '50%', height: '24px', borderRadius: '6px', marginTop: '0.5rem' }} />
          <div className="skeleton-shimmer-box" style={{ width: '35%', height: '14px', borderRadius: '4px' }} />
          
          {/* Bio/Description */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div className="skeleton-shimmer-box" style={{ width: '80%', height: '12px', borderRadius: '4px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '60%', height: '12px', borderRadius: '4px' }} />
          </div>
          
          {/* Platforms/Links Grid */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem', marginBottom: '3rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-shimmer-box" style={{ width: '100%', height: '54px', borderRadius: '16px' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', textAlign: 'center', padding: '20px' }}>
        <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</span>
        <h1>Showcase Not Found</h1>
        <p style={{ color: '#94a3b8' }}>{error}</p>
        <button 
          onClick={() => navigate('/')}
          style={{ marginTop: '20px', padding: '12px 24px', borderRadius: '12px', background: '#fff', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer' }}
        >
          Go Home
        </button>
      </div>
    );
  }

  return null;
}

export default MasterArtRedirect;
