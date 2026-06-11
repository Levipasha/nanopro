import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './GeneralProfileView.css';

import { getThemeById } from '../constants/generalThemes';
import { useShowcaseEmbedHeight } from '../hooks/useShowcaseEmbedHeight';
import { getLinkIcon } from '../components/LinkIcons';
import { fixImageUrl } from '../utils/imageHelper';


function StudentPublicView() {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('id');
  const isMock = searchParams.get('mock') === '1' || studentId === 'mock-student';
  const isEmbed = searchParams.get('embed') === '1';

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useShowcaseEmbedHeight(isEmbed);

  useEffect(() => {
    if (!isMock) {
      // This landing page only supports mock showcase for now.
      setStudent(null);
      setLoading(false);
      return;
    }

    // Hard-coded example student profile for landing page showcase.
    const MOCK_STUDENT = {
      username: 'mock-student',
      name: 'Aarav Patel',
      school: 'Greenwood High',
      title: 'Student • Robotics Club',
      email: 'aarav.patel@example.com',
      backgroundPhoto: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&w=1200&q=80',
      photo: 'https://images.unsplash.com/photo-1519085189623-28400037eb85?auto=format&fit=crop&w=600&h=600&q=80',
      theme: 'ocean',
      font: 'outfit',
      bio: 'Building smarter prototypes with the Robotics Club. Passionate about AI, sensors, and community science challenges.',
      achievements: [
        { title: 'Robotics Champion', desc: 'Inter-school Robotics League (2025)' },
        { title: 'Hackathon Finalist', desc: 'Open Innovation Hack (2024)' },
        { title: 'Volunteer Tutor', desc: 'STEM mentoring for juniors (2023-2026)' }
      ],
      links: []
    };

    setStudent(MOCK_STUDENT);
    setLoading(false);
  }, [isMock, studentId]);

  const theme = getThemeById(student?.theme || 'ocean');
  const sharePrimaryName = (student?.name || '').trim() || 'Student';
  const nanoProfilesPageTitle = `${sharePrimaryName} - ${process.env.REACT_APP_SITE_NAME || 'Nano Profiles'}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => alert('Link copied!'));
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareTitle = `Check out ${sharePrimaryName} Profile on ${process.env.REACT_APP_SITE_NAME || 'Nano Profiles'}`;
    const shareText = `Discover ${sharePrimaryName}'s digital footprint on ${process.env.REACT_APP_SITE_NAME || 'Nano Profiles'}. Smart Digital Identity Solutions for modern creators and professionals. Create yours at ${process.env.REACT_APP_DOMAIN || 'nanoprofiles.com'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url
        });
      } catch (err) {
        if (err.name !== 'AbortError') copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

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


  if (!student) {
    return (
      <div className="gp-view gp-error">
        <h1>Student profile not found</h1>
        <p>Mock showcase is available via `?mock=1`.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{nanoProfilesPageTitle}</title>
        <meta name="description" content={`Check out ${sharePrimaryName} Profile on Nano Profiles. Smart Digital Identity Solutions.`} />

        {/* Open Graph / Facebook / WhatsApp */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={`Check out ${sharePrimaryName} Profile on ${process.env.REACT_APP_SITE_NAME || 'Nano Profiles'}`} />
        <meta property="og:description" content={`Discover ${sharePrimaryName}'s digital footprint. Smart Digital Identity Solutions for modern creators and professionals.`} />
        <meta property="og:image" content={fixImageUrl(student?.photo) || student?.photo} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={window.location.href} />
        <meta name="twitter:title" content={`Check out ${sharePrimaryName} Profile on ${process.env.REACT_APP_SITE_NAME || 'Nano Profiles'}`} />
        <meta name="twitter:description" content={`Discover ${sharePrimaryName}'s digital footprint. Smart Digital Identity Solutions.`} />
        <meta name="twitter:image" content={fixImageUrl(student?.photo) || student?.photo} />
      </Helmet>

      <div className={`gp-view gp-layout${isEmbed ? ' gp-embed-showcase' : ''}`}>
        <div
          className="gp-card gp-student-themed-card"
          style={{
            background: theme.bg,
            color: theme.text,
            '--font-heading': student.font ? student.font : 'outfit'
          }}
        >
          {/* Share button - top right */}
          <button type="button" onClick={handleShare} className="gp-share-btn" aria-label="Share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>

          {/* Cover banner */}
          <div className="gp-photo-header">
            {student.backgroundPhoto && (
              <img src={fixImageUrl(student.backgroundPhoto) || student.backgroundPhoto} alt={student.name || 'Cover'} className="gp-cover-img" />
            )}
          </div>

          {/* Avatar Row (Circle + Name/Tags) */}
          <div className="gp-avatar-row">
            <div className="gp-avatar-circle">
              {student.photo ? (
                <img src={fixImageUrl(student.photo) || student.photo} alt={student.name} className="gp-avatar-img" />
              ) : (
                <div className="gp-avatar-circle-fallback">
                  {student.name?.charAt(0) || '?'}
                </div>
              )}
            </div>

            <div className="gp-avatar-text">
              {student.name && <h1 className="gp-name">{student.name}</h1>}
              {(student.school || student.title) && (
                <div className="gp-artist-badge-wrapper">
                  <div className="Btn">
                    <div className="leftContainer">
                      <span className="like">{student.school || 'Student'}</span>
                    </div>
                    {student.title && (
                      <div className="likeCount">
                        {student.title.split('•')[1]?.trim() || student.title}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="gp-username">@{student.username}</p>

          <p className="gp-bio">{student.bio}</p>

          <div className="gp-section" style={{ marginTop: '1.25rem' }}>
            <h2 className="gp-section-title">Achievements</h2>
            <div className="gp-achievements">
              {student.achievements.map((a, idx) => (
                <div key={idx} className="gp-contact-item" style={{ marginBottom: '0.75rem' }}>
                  <div className="gp-contact-label">{a.title}</div>
                  <div className="gp-contact-value" style={{ color: 'inherit', opacity: 0.9 }}>
                    {a.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {student.links?.length > 0 && (
            <div className="gp-section" style={{ marginTop: '1.25rem' }}>
              <h2 className="gp-section-title">Links</h2>
              <div className="gp-links-grid">
                {student.links.map((l) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gp-link-icon-only"
                    title={l.title}
                    aria-label={l.title}
                    style={{
                      borderColor: theme.text,
                      color: theme.text,
                      background: theme.linkBg
                    }}
                  >
                    <span className="gp-link-icon-only-inner">
                      {getLinkIcon({ platform: l.id, url: l.url, title: l.title })}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default StudentPublicView;

