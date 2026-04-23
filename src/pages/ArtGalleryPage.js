import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ImageGallery from '../components/ui/image-gallery';
import SphereImageGrid from '../components/ui/image-sphere';

export default function ArtGalleryPage() {
  const location = useLocation();
  const wrapperRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // Measured from the actual DOM — guaranteed to match rendered size
  const [sphereSize, setSphereSize] = useState(null);

  useEffect(() => {
    const measure = () => {
      setIsMobile(window.innerWidth < 768);
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        // Use the smaller dimension so sphere fits without clipping
        setSphereSize(Math.min(rect.width, rect.height));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const artItems = location.state?.artItems || [];
  const artistName = location.state?.artistName || 'Artist';

  // Flatten all gallery image URLs into a simple { id, src, alt } array
  const baseImages = artItems.flatMap((item, i) => {
    const urls = Array.isArray(item.images) ? item.images : [];
    return urls
      .map(src => (typeof src === 'string' ? src : src?.url))
      .filter(Boolean)
      .map((src, j) => ({
        id: `art-${i}-${j}`,
        src,
        alt: item.title || 'Artwork',
        title: item.title || '',
        description: item.description || ''
      }));
  });

  // Pad to at least 40 items so the sphere looks full
  const images = [];
  if (baseImages.length > 0) {
    for (let i = 0; i < Math.max(baseImages.length, 40); i++) {
      const base = baseImages[i % baseImages.length];
      images.push({ ...base, id: `${base.id}-r${i}` });
    }
  }

  // ── MOBILE: fixed full-screen sphere overlay ──────────────────────────
  if (isMobile) {
    return (
      <div
        ref={wrapperRef}
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
          paddingTop: '2rem',
          boxSizing: 'border-box'
        }}
      >
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '0 1.5rem' }}>
          <h1 style={{
            fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 0.75rem',
            letterSpacing: '-0.025em',
            fontFamily: "'Outfit', sans-serif"
          }}>
            {artistName}'s Art
          </h1>
          <p style={{
            fontSize: 'clamp(0.8rem, 3.5vw, 1rem)',
            color: '#94a3b8',
            margin: 0,
            lineHeight: 1.6,
            fontFamily: "'Outfit', sans-serif"
          }}>
            Exploring the unique vision and artistic depth through a curated collection of recent works.
          </p>
        </div>

        {/* Sphere — only render once wrapper is measured */}
        {sphereSize && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%' }}>
            <SphereImageGrid
              images={images}
              containerSize={Math.min(sphereSize, window.innerWidth)}
              sphereRadius={Math.min(sphereSize, window.innerWidth) * 0.38}
              autoRotate={true}
              autoRotateSpeed={0.3}
              baseImageScale={0.12}
              dragSensitivity={0.5}
              momentumDecay={0.95}
              maxRotationSpeed={5}
              hoverScale={1.2}
              perspective={1000}
            />
          </div>
        )}
      </div>
    );
  }

  // ── DESKTOP: normal scrollable document flow ───────────────────────────
  return <ImageGallery items={artItems} artistName={artistName} />;
}
