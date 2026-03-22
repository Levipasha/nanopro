import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './GeneralProfileView.css';

import { getThemeById } from '../constants/generalThemes';
import { useShowcaseEmbedHeight } from '../hooks/useShowcaseEmbedHeight';
import { getLinkIcon } from '../components/LinkIcons';

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
      photo:
        'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=900&h=900&fit=crop',
      theme: 'ocean',
      font: 'outfit',
      bio:
        'Building smarter prototypes with the Robotics Club. Passionate about AI, sensors, and community science challenges.',
      achievements: [
        { title: 'Robotics Champion', desc: 'Inter-school Robotics League (2025)' },
        { title: 'Hackathon Finalist', desc: 'Open Innovation Hack (2024)' },
        { title: 'Volunteer Tutor', desc: 'STEM mentoring for juniors (2023-2026)' }
      ],
      links: [
        { id: 'website', title: 'Portfolio', url: 'https://example.com' },
        { id: 'instagram', title: 'Instagram', url: 'https://instagram.com/exampleinsta' },
        { id: 'whatsapp', title: 'WhatsApp', url: 'https://wa.me/9183746501' }
      ]
    };

    setStudent(MOCK_STUDENT);
    setLoading(false);
  }, [isMock, studentId]);

  const theme = getThemeById(student?.theme || 'ocean');

  if (loading) {
    return (
      <div className="gp-view gp-loading">
        <p>Loading student profile...</p>
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
        <title>{`${student.name} | Nano Profiles`}</title>
        <meta name="description" content="Example student profile showcase" />
      </Helmet>

      <div className={`gp-view gp-layout${isEmbed ? ' gp-embed-showcase' : ''}`}>
        <div
          className="gp-card gp-card-themed"
          style={{
            background: theme.bg,
            color: theme.text,
            '--font-heading': student.font ? student.font : 'outfit'
          }}
        >
          <div className="gp-photo-header">
            {student.photo ? (
              <img src={student.photo} alt={student.name} className="gp-avatar-img" />
            ) : (
              <div className="gp-avatar-placeholder gp-avatar-placeholder-header">
                {student.name?.charAt(0) || '?'}
              </div>
            )}

            <div className="gp-photo-overlay">
              {student.name && <h1 className="gp-name">{student.name}</h1>}
              {student.school && <p className="gp-title-overlay">{student.school}</p>}
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

