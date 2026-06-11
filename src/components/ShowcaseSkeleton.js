import React from 'react';

export default function ShowcaseSkeleton({ type = 'home' }) {
  // Determine accent color and theme properties based on type
  let accentColor = '#C8001A'; // Crimson Red default
  let accentBg = 'rgba(200, 0, 26, 0.05)';
  let taglineText = 'ONE TAP IDENTITY';

  if (type === 'professional') {
    accentColor = '#7c3aed'; // Royal Violet
    accentBg = 'rgba(124, 58, 237, 0.05)';
    taglineText = 'PROFESSIONAL PORTFOLIO';
  } else if (type === 'student') {
    accentColor = '#0284c7'; // Sky Blue
    accentBg = 'rgba(2, 132, 199, 0.05)';
    taglineText = 'STUDENT IDENTITY';
  } else if (type === 'restaurant') {
    accentColor = '#b45309'; // Warm Orange
    accentBg = 'rgba(180, 83, 9, 0.05)';
    taglineText = 'RESTAURANT PORTAL';
  } else if (type === 'home') {
    accentColor = 'linear-gradient(135deg, #C8001A 0%, #7c3aed 100%)';
    accentBg = 'rgba(200, 0, 26, 0.04)';
  }

  // Common Header/Navbar Skeleton
  const renderNavbar = () => (
    <div className="sk-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="skeleton-shimmer-box" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
        <div className="skeleton-shimmer-box" style={{ width: '110px', height: '20px' }} />
      </div>
      <div className="sk-nav-links">
        <div className="skeleton-shimmer-box" style={{ width: '60px', height: '14px' }} />
        <div className="skeleton-shimmer-box" style={{ width: '60px', height: '14px' }} />
        <div className="skeleton-shimmer-box" style={{ width: '60px', height: '14px' }} />
        <div className="skeleton-shimmer-box" style={{ width: '60px', height: '14px' }} />
      </div>
      <div className="skeleton-shimmer-box" style={{ width: '90px', height: '36px', borderRadius: '24px' }} />
    </div>
  );

  // Common Footer Skeleton
  const renderFooter = () => (
    <div className="sk-footer">
      <div className="sk-footer-top">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: '1' }}>
          <div className="skeleton-shimmer-box" style={{ width: '130px', height: '20px' }} />
          <div className="skeleton-shimmer-box" style={{ width: '220px', height: '14px' }} />
          <div className="skeleton-shimmer-box" style={{ width: '180px', height: '14px' }} />
        </div>
        <div style={{ display: 'flex', gap: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="skeleton-shimmer-box" style={{ width: '70px', height: '14px', marginBottom: '4px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '50px', height: '12px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '60px', height: '12px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="skeleton-shimmer-box" style={{ width: '70px', height: '14px', marginBottom: '4px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '80px', height: '12px' }} />
            <div className="skeleton-shimmer-box" style={{ width: '50px', height: '12px' }} />
          </div>
        </div>
      </div>
      <div className="sk-footer-bottom">
        <div className="skeleton-shimmer-box" style={{ width: '200px', height: '12px' }} />
        <div className="skeleton-shimmer-box" style={{ width: '120px', height: '12px' }} />
      </div>
    </div>
  );

  // Render correct content depending on page type
  const renderContent = () => {
    switch (type) {
      case 'home':
        return (
          <div className="sk-home-container">
            <div className="sk-home-left">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div className="skeleton-shimmer-box" style={{ width: '12px', height: '1.5px', background: typeof accentColor === 'string' ? accentColor : '#C8001A' }} />
                <span className="sk-tagline" style={{ color: typeof accentColor === 'string' ? accentColor : '#C8001A' }}>{taglineText}</span>
              </div>
              <div className="skeleton-shimmer-box sk-home-title" />
              <div className="skeleton-shimmer-box sk-home-title-2" />
              <div className="skeleton-shimmer-box" style={{ width: '90%', height: '18px', marginTop: '20px' }} />
              <div className="skeleton-shimmer-box" style={{ width: '75%', height: '18px', marginTop: '8px', marginBottom: '36px' }} />

              <div className="sk-home-cards">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="sk-home-card">
                    <div className="sk-home-card-icon" style={{ background: accentBg }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1' }}>
                      <div className="skeleton-shimmer-box" style={{ width: '90px', height: '16px' }} />
                      <div className="skeleton-shimmer-box" style={{ width: '170px', height: '12px' }} />
                    </div>
                    <div className="skeleton-shimmer-box" style={{ width: '14px', height: '14px', borderRadius: '50%' }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="sk-home-right">
              <div className="sk-orbit-outer">
                <div className="sk-orbit-inner">
                  <div className="sk-orbit-center">
                    <div className="skeleton-shimmer-box" style={{ width: '70px', height: '70px', borderRadius: '50%' }} />
                    <div className="skeleton-shimmer-box" style={{ width: '100px', height: '14px', marginTop: '12px' }} />
                    <div className="skeleton-shimmer-box" style={{ width: '70px', height: '10px', marginTop: '6px' }} />
                  </div>
                </div>
                {/* Orbit dots */}
                <div className="sk-orbit-dot dot-1" style={{ background: '#3b82f6' }} />
                <div className="sk-orbit-dot dot-2" style={{ background: '#7c3aed' }} />
                <div className="sk-orbit-dot dot-3" style={{ background: '#C8001A' }} />
              </div>
            </div>
          </div>
        );

      case 'artist':
      case 'professional':
      case 'restaurant':
      case 'student':
        return (
          <div className="sk-showcase-container">
            {/* Hero Section */}
            <div className="sk-showcase-hero">
              <div className="skeleton-shimmer-box" style={{ width: '65%', height: '48px', borderRadius: '12px' }} />
              <div className="skeleton-shimmer-box" style={{ width: '45%', height: '48px', borderRadius: '12px', marginTop: '8px' }} />
              <div className="skeleton-shimmer-box" style={{ width: '70%', height: '18px', marginTop: '20px' }} />
              <div className="skeleton-shimmer-box" style={{ width: '50%', height: '18px', marginTop: '8px' }} />
              <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                <div className="skeleton-shimmer-box" style={{ width: '150px', height: '46px', borderRadius: '99px' }} />
                <div className="skeleton-shimmer-box" style={{ width: '150px', height: '46px', borderRadius: '99px' }} />
              </div>
            </div>

            {/* Features Grid */}
            <div className="sk-showcase-features">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="sk-feat-card">
                  <div className="sk-feat-icon" style={{ background: accentBg }} />
                  <div className="skeleton-shimmer-box" style={{ width: '110px', height: '18px', marginTop: '16px' }} />
                  <div className="skeleton-shimmer-box" style={{ width: '90%', height: '12px', marginTop: '12px' }} />
                  <div className="skeleton-shimmer-box" style={{ width: '70%', height: '12px', marginTop: '6px' }} />
                </div>
              ))}
            </div>

            {/* Preview Section (Mock Iframe container) */}
            <div className="sk-showcase-preview">
              <div className="skeleton-shimmer-box" style={{ width: '180px', height: '24px', margin: '0 auto 28px auto' }} />
              <div className="sk-phone-simulator">
                <div className="sk-phone-screen">
                  {/* Inside simulator */}
                  <div className="skeleton-shimmer-box" style={{ width: '74px', height: '74px', borderRadius: '50%', margin: '24px auto 14px auto' }} />
                  <div className="skeleton-shimmer-box" style={{ width: '110px', height: '18px', margin: '0 auto 8px auto' }} />
                  <div className="skeleton-shimmer-box" style={{ width: '170px', height: '12px', margin: '0 auto 24px auto' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 20px' }}>
                    <div className="skeleton-shimmer-box" style={{ width: '100%', height: '42px', borderRadius: '24px' }} />
                    <div className="skeleton-shimmer-box" style={{ width: '100%', height: '42px', borderRadius: '24px' }} />
                    <div className="skeleton-shimmer-box" style={{ width: '100%', height: '42px', borderRadius: '24px' }} />
                  </div>

                  <div className="sk-phone-card-detail">
                    <div className="skeleton-shimmer-box" style={{ width: '60px', height: '14px' }} />
                    <div className="skeleton-shimmer-box" style={{ width: '100%', height: '12px', marginTop: '10px' }} />
                    <div className="skeleton-shimmer-box" style={{ width: '80%', height: '12px', marginTop: '6px' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Banner CTA section */}
            <div className="sk-banner-cta">
              <div className="skeleton-shimmer-box" style={{ width: '50%', height: '28px', margin: '0 auto' }} />
              <div className="skeleton-shimmer-box" style={{ width: '65%', height: '16px', margin: '12px auto 24px auto' }} />
              <div className="skeleton-shimmer-box" style={{ width: '160px', height: '48px', borderRadius: '99px', margin: '0 auto' }} />
            </div>
          </div>
        );

      case 'login':
        return (
          <div className="sk-login-container">
            <div className="sk-login-card">
              <div className="sk-back-btn">
                <div className="skeleton-shimmer-box" style={{ width: '64px', height: '24px' }} />
              </div>
              <div className="skeleton-shimmer-box" style={{ width: '160px', height: '28px', margin: '20px auto 32px auto' }} />
              <div className="skeleton-shimmer-box" style={{ width: '100%', height: '46px', borderRadius: '8px', marginBottom: '24px' }} />
              <div className="skeleton-shimmer-box" style={{ width: '220px', height: '14px', margin: '0 auto' }} />
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="sk-dashboard-container">
            {/* Sidebar */}
            <div className="sk-sidebar">
              <div className="skeleton-shimmer-box" style={{ width: '80%', height: '28px', marginBottom: '32px' }} />
              <div className="sk-sidebar-items">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton-shimmer-box" style={{ width: '90%', height: '36px', borderRadius: '8px' }} />
                ))}
              </div>
            </div>
            {/* Main Area */}
            <div className="sk-main-area">
              <div className="sk-main-header">
                <div className="skeleton-shimmer-box" style={{ width: '220px', height: '28px' }} />
                <div className="skeleton-shimmer-box" style={{ width: '80px', height: '36px', borderRadius: '18px' }} />
              </div>
              <div className="sk-dashboard-grid">
                <div className="sk-editor-panel">
                  <div className="skeleton-shimmer-box" style={{ width: '140px', height: '20px', marginBottom: '20px' }} />
                  <div className="sk-input-group">
                    <div className="skeleton-shimmer-box" style={{ width: '70px', height: '12px' }} />
                    <div className="skeleton-shimmer-box" style={{ width: '100%', height: '40px', borderRadius: '6px' }} />
                  </div>
                  <div className="sk-input-group" style={{ marginTop: '16px' }}>
                    <div className="skeleton-shimmer-box" style={{ width: '90px', height: '12px' }} />
                    <div className="skeleton-shimmer-box" style={{ width: '100%', height: '80px', borderRadius: '6px' }} />
                  </div>
                  <div className="skeleton-shimmer-box" style={{ width: '120px', height: '40px', borderRadius: '20px', marginTop: '24px' }} />
                </div>
                <div className="sk-preview-panel">
                  <div className="sk-phone-simulator" style={{ transform: 'scale(0.85)', margin: '0 auto' }}>
                    <div className="sk-phone-screen">
                      <div className="skeleton-shimmer-box" style={{ width: '64px', height: '64px', borderRadius: '50%', margin: '24px auto 14px auto' }} />
                      <div className="skeleton-shimmer-box" style={{ width: '90px', height: '16px', margin: '0 auto 20px auto' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '0 20px' }}>
                        <div className="skeleton-shimmer-box" style={{ width: '100%', height: '36px', borderRadius: '18px' }} />
                        <div className="skeleton-shimmer-box" style={{ width: '100%', height: '36px', borderRadius: '18px' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'public-artist':
      case 'public-general':
      case 'public-student':
        return (
          <div className="sk-public-profile-container">
            <div className="sk-public-card">
              <div className="skeleton-shimmer-box" style={{ width: '110px', height: '110px', borderRadius: '50%', margin: '0 auto 16px auto' }} />
              <div className="skeleton-shimmer-box" style={{ width: '160px', height: '24px', margin: '0 auto 10px auto' }} />
              <div className="skeleton-shimmer-box" style={{ width: '220px', height: '14px', margin: '0 auto 24px auto' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '380px', margin: '0 auto' }}>
                <div className="skeleton-shimmer-box" style={{ width: '100%', height: '48px', borderRadius: '8px' }} />
                <div className="skeleton-shimmer-box" style={{ width: '100%', height: '48px', borderRadius: '8px' }} />
                <div className="skeleton-shimmer-box" style={{ width: '100%', height: '48px', borderRadius: '8px' }} />
              </div>

              <div className="sk-public-card-details" style={{ width: '100%', maxWidth: '380px', margin: '24px auto 0 auto', padding: '16px', boxSizing: 'border-box', border: '1px solid rgba(15, 23, 42, 0.06)', borderRadius: '12px' }}>
                <div className="skeleton-shimmer-box" style={{ width: '80px', height: '14px', marginBottom: '10px' }} />
                <div className="skeleton-shimmer-box" style={{ width: '100%', height: '12px' }} />
                <div className="skeleton-shimmer-box" style={{ width: '70%', height: '12px', marginTop: '6px' }} />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="sk-generic-container" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div className="skeleton-shimmer-box" style={{ width: '200px', height: '32px', margin: '0 auto 20px auto' }} />
            <div className="skeleton-shimmer-box" style={{ width: '80%', height: '16px', margin: '0 auto 8px auto' }} />
            <div className="skeleton-shimmer-box" style={{ width: '60%', height: '16px', margin: '0 auto 40px auto' }} />
            <div className="skeleton-shimmer-box" style={{ width: '100%', height: '200px', borderRadius: '12px' }} />
          </div>
        );
    }
  };

  return (
    <div className="sk-page-wrapper">
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-shimmer-box {
          background: linear-gradient(90deg, #f3f2ef 25%, #e6e5e1 50%, #f3f2ef 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.6s infinite linear;
          border-radius: 6px;
        }

        /* Layout wrappers */
        .sk-page-wrapper {
          background: #FAF9F6;
          min-height: 100vh;
          width: 100%;
          box-sizing: border-box;
          font-family: 'Outfit', sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* Header Navbar Skeleton styling */
        .sk-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 72px;
          padding: 0 5%;
          border-bottom: 1px solid rgba(15, 23, 42, 0.05);
          background: rgba(250, 249, 246, 0.8);
          box-sizing: border-box;
        }
        .sk-nav-links {
          display: none;
          gap: 32px;
        }
        @media (min-width: 768px) {
          .sk-nav-links {
            display: flex;
          }
        }

        /* Home Skeleton layout */
        .sk-home-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          padding: 60px 5%;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        @media (min-width: 992px) {
          .sk-home-container {
            grid-template-columns: 1.2fr 0.8fr;
            padding: 80px 5%;
          }
        }
        .sk-tagline {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .sk-home-title {
          width: 80%;
          height: 44px;
          border-radius: 8px;
        }
        .sk-home-title-2 {
          width: 60%;
          height: 44px;
          margin-top: 8px;
          border-radius: 8px;
        }
        .sk-home-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sk-home-card {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .sk-home-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          flex-shrink: 0;
        }

        /* Orbit Right Side */
        .sk-home-right {
          display: none;
          justify-content: center;
          align-items: center;
        }
        @media (min-width: 992px) {
          .sk-home-right {
            display: flex;
          }
        }
        .sk-orbit-outer {
          width: 320px;
          height: 320px;
          border-radius: 50%;
          border: 1px dashed rgba(15, 23, 42, 0.06);
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .sk-orbit-inner {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          border: 1px solid rgba(15, 23, 42, 0.05);
          display: flex;
          justify-content: center;
          align-items: center;
          background: #ffffff;
          box-shadow: 0 15px 35px rgba(15, 23, 42, 0.04);
        }
        .sk-orbit-center {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .sk-orbit-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          position: absolute;
        }
        .sk-orbit-dot.dot-1 { top: 15%; left: 15%; }
        .sk-orbit-dot.dot-2 { bottom: 20%; right: 10%; }
        .sk-orbit-dot.dot-3 { top: 40%; right: 5%; }

        /* Showcase Skeletons (artist, professional, restaurant, student) */
        .sk-showcase-container {
          padding: 48px 5%;
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 60px;
        }
        .sk-showcase-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-top: 20px;
        }
        .sk-showcase-features {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 576px) {
          .sk-showcase-features {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 992px) {
          .sk-showcase-features {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .sk-feat-card {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 16px;
          padding: 24px;
        }
        .sk-feat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
        }
        
        /* Simulator Mockup */
        .sk-showcase-preview {
          text-align: center;
        }
        .sk-phone-simulator {
          width: 320px;
          height: 580px;
          border-radius: 36px;
          border: 12px solid #0f172a;
          margin: 0 auto;
          background: #FAF9F6;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          position: relative;
        }
        .sk-phone-screen {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        .sk-phone-card-detail {
          margin: auto 20px 24px 20px;
          padding: 16px;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.05);
          border-radius: 12px;
          text-align: left;
        }

        /* Banner CTA */
        .sk-banner-cta {
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 20px;
          padding: 40px 24px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.02);
        }

        /* Login Layout */
        .sk-login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
          padding: 60px 20px;
        }
        .sk-login-card {
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 20px;
          box-shadow: 0 15px 45px rgba(15, 23, 42, 0.04);
          width: 100%;
          max-width: 440px;
          padding: 40px;
          box-sizing: border-box;
          position: relative;
        }
        .sk-back-btn {
          position: absolute;
          top: 24px;
          left: 24px;
        }

        /* Dashboard Layout */
        .sk-dashboard-container {
          display: flex;
          flex: 1;
          min-height: calc(100vh - 72px);
        }
        .sk-sidebar {
          width: 240px;
          border-right: 1px solid rgba(15, 23, 42, 0.06);
          padding: 24px;
          box-sizing: border-box;
          display: none;
          background: #ffffff;
        }
        @media (min-width: 768px) {
          .sk-sidebar {
            display: block;
          }
        }
        .sk-sidebar-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sk-main-area {
          flex: 1;
          padding: 24px;
          box-sizing: border-box;
          background: #f8fafc;
        }
        .sk-main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .sk-dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 992px) {
          .sk-dashboard-grid {
            grid-template-columns: 1.2fr 0.8fr;
          }
        }
        .sk-editor-panel {
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.01);
        }
        .sk-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sk-preview-panel {
          display: none;
          align-items: flex-start;
          justify-content: center;
        }
        @media (min-width: 992px) {
          .sk-preview-panel {
            display: flex;
          }
        }

        /* Public Profiles Layout */
        .sk-public-profile-container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          flex: 1;
          padding: 40px 20px;
        }
        .sk-public-card {
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.05);
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.05);
          padding: 40px 24px;
          box-sizing: border-box;
          text-align: center;
        }

        /* Footer skeleton styling */
        .sk-footer {
          margin-top: auto;
          background: #ffffff;
          border-top: 1px solid rgba(15, 23, 42, 0.06);
          padding: 48px 5% 24px 5%;
          box-sizing: border-box;
        }
        .sk-footer-top {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 32px;
          padding-bottom: 24px;
        }
        .sk-footer-bottom {
          border-top: 1px solid rgba(15, 23, 42, 0.05);
          padding-top: 24px;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
      `}</style>

      {/* Render Common Navbar (except for profile and public views which have custom or no navbars of this type) */}
      {type !== 'profile' && type !== 'public-artist' && type !== 'public-general' && type !== 'public-student' && renderNavbar()}

      {/* Render Dynamic Page Content */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        {renderContent()}
      </div>

      {/* Render Common Footer (except for profile, login and public views) */}
      {type !== 'profile' && type !== 'login' && type !== 'public-artist' && type !== 'public-general' && type !== 'public-student' && renderFooter()}
    </div>
  );
}
