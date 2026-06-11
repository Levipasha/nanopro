import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function ProfileChoiceScreen({
  displayName,
  displayEmail,
  profileLock,
  choiceSource,
  generalProfile,
  restaurantProfile,
  handleSelectArtistMode,
  handleSelectGeneralMode,
  handleSelectRestaurantMode,
}) {
  return (
    <div className="profile-page profile-login-wrap">
      <div className="profile-login-card profile-choice-card">
        <div className="profile-login-header" style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {displayEmail ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <h1 className="profile-header-email" title={displayEmail} style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', fontWeight: 600, letterSpacing: '0.01em', fontFamily: 'system-ui, sans-serif' }}>
                {displayEmail}
              </h1>
            </div>
          ) : null}
        </div>

        <div className="profile-choice-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '3.5rem' }}>
          {profileLock !== 'general_restaurant' && (
            <button
              onClick={handleSelectArtistMode}
              type="button"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.querySelector('.circle-icon').style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.querySelector('.circle-icon').style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)'; }}
            >
              <div className="circle-icon" style={{
                borderRadius: '50%',
                width: '140px',
                height: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
                marginBottom: '1.25rem',
                transition: 'box-shadow 0.2s ease'
              }}>
                <DotLottieReact
                  src="https://lottie.host/75811a70-e9d1-4465-89bc-8aff9bd05750/7UvjqSPxpy.lottie"
                  loop
                  autoplay
                  style={{ width: 80, height: 80 }}
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Artist</p>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Portfolio &amp; Digital ID</div>
              </div>
            </button>
          )}

          {profileLock !== 'artist' && (
            <>
              <button
                onClick={handleSelectGeneralMode}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.querySelector('.circle-icon').style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.querySelector('.circle-icon').style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)'; }}
              >
                <div className="circle-icon" style={{
                  borderRadius: '50%',
                  width: '140px',
                  height: '140px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ffffff',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
                  marginBottom: '1.25rem',
                  transition: 'box-shadow 0.2s ease'
                }}>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <DotLottieReact
                      src="https://lottie.host/223b0f35-cc35-4c8d-ac2d-f1a5e32ea252/Fv4iWhFxAn.lottie"
                      loop
                      autoplay
                      style={{ width: 80, height: 80 }}
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>General Profile</p>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Link-in-Bio</div>
                </div>
              </button>

              <button
                onClick={handleSelectRestaurantMode}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.querySelector('.circle-icon').style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.querySelector('.circle-icon').style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)'; }}
              >
                <div className="circle-icon" style={{
                  borderRadius: '50%',
                  width: '140px',
                  height: '140px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ffffff',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
                  marginBottom: '1.25rem',
                  transition: 'box-shadow 0.2s ease'
                }}>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <DotLottieReact
                      src="https://lottie.host/7b2741a5-d683-4e73-b32e-443e7e3f6725/SgfvqmX4Vv.lottie"
                      loop
                      autoplay
                      style={{ width: 80, height: 80, transform: 'scale(1.8)' }}
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Restaurant</p>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Tap to Order</div>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

