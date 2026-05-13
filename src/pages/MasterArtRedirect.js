import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <DotLottieReact
          src="https://lottie.host/c1b7e87d-cc8f-44a2-b59a-9f00ec8c540b/n7PRg2j8GX.lottie"
          loop
          autoplay
          style={{ width: 250, height: 250 }}
        />
        <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '1rem' }}>Connecting to master art...</p>
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
