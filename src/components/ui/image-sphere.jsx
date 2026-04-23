import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

const toRad = (d) => d * Math.PI / 180;
const normalizeAngle = (a) => {
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  return a;
};

const SphereImageGrid = ({
  images = [],
  containerSize = 400,
  sphereRadius,
  dragSensitivity = 0.5,
  momentumDecay = 0.95,
  maxRotationSpeed = 5,
  baseImageScale = 0.12,
  hoverScale = 1.2,
  perspective = 1000,
  autoRotate = false,
  autoRotateSpeed = 0.3,
  className = ''
}) => {
  const containerRef = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const velocityRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const [rotation, setRotation] = useState({ x: 15, y: 15, z: 0 });
  const [imagePositions, setImagePositions] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const actualRadius = sphereRadius != null ? sphereRadius : containerSize * 0.45;
  const baseImgSize = containerSize * baseImageScale;

  // ── Generate Fibonacci sphere positions ──────────────────────────────────
  useEffect(() => {
    const count = images.length;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleInc = 2 * Math.PI / goldenRatio;
    const positions = [];

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleInc * i;

      let phi = inclination * (180 / Math.PI);
      let theta = (azimuth * (180 / Math.PI)) % 360;

      const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35;
      if (phi < 90) phi = Math.max(5, phi - poleBonus);
      else phi = Math.min(175, phi + poleBonus);
      phi = 15 + (phi / 180) * 150;
      theta = (theta + (Math.random() - 0.5) * 20) % 360;
      phi = Math.max(0, Math.min(180, phi + (Math.random() - 0.5) * 10));

      positions.push({ theta, phi, radius: actualRadius });
    }
    setImagePositions(positions);
  }, [images.length, actualRadius]);

  // ── Project sphere positions to 2D using current rotation ───────────────
  const getWorldPositions = useCallback(() => {
    return imagePositions.map((pos, index) => {
      const thetaR = toRad(pos.theta);
      const phiR = toRad(pos.phi);
      const rotXR = toRad(rotation.x);
      const rotYR = toRad(rotation.y);

      let x = pos.radius * Math.sin(phiR) * Math.cos(thetaR);
      let y = pos.radius * Math.cos(phiR);
      let z = pos.radius * Math.sin(phiR) * Math.sin(thetaR);

      // Y-axis rotation
      const x1 = x * Math.cos(rotYR) + z * Math.sin(rotYR);
      const z1 = -x * Math.sin(rotYR) + z * Math.cos(rotYR);
      x = x1; z = z1;

      // X-axis rotation
      const y2 = y * Math.cos(rotXR) - z * Math.sin(rotXR);
      const z2 = y * Math.sin(rotXR) + z * Math.cos(rotXR);
      y = y2; z = z2;

      const isVisible = z > -30;
      let fadeOpacity = 1;
      if (z <= -10) fadeOpacity = Math.max(0, (z - (-30)) / (-10 - (-30)));

      const isPole = pos.phi < 30 || pos.phi > 150;
      const dist2D = Math.sqrt(x * x + y * y);
      const distRatio = Math.min(dist2D / pos.radius, 1);
      const centerScale = Math.max(0.3, 1 - distRatio * (isPole ? 0.4 : 0.7));
      const depthScale = (z + pos.radius) / (2 * pos.radius);
      const scale = centerScale * Math.max(0.5, 0.8 + depthScale * 0.3);

      return { x, y, z, scale, zIndex: Math.round(1000 + z), isVisible, fadeOpacity };
    });
  }, [imagePositions, rotation]);

  // ── Animation loop ───────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      if (!isDraggingRef.current) {
        velocityRef.current = {
          x: velocityRef.current.x * momentumDecay,
          y: velocityRef.current.y * momentumDecay
        };
        setRotation(prev => {
          const vx = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, velocityRef.current.x));
          const vy = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, velocityRef.current.y));
          return {
            x: normalizeAngle(prev.x + vx),
            y: normalizeAngle(prev.y + vy + (autoRotate ? autoRotateSpeed : 0)),
            z: prev.z
          };
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [momentumDecay, maxRotationSpeed, autoRotate, autoRotateSpeed]);

  // ── Mouse / Touch handlers ───────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      const vx = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, -dy * dragSensitivity));
      const vy = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, dx * dragSensitivity));
      velocityRef.current = { x: vx, y: vy };
      setRotation(prev => ({
        x: normalizeAngle(prev.x + vx),
        y: normalizeAngle(prev.y + vy),
        z: prev.z
      }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => { isDraggingRef.current = false; };

    const onTouchMove = (e) => {
      if (!isDraggingRef.current || !e.touches[0]) return;
      if (e.cancelable) e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - lastMousePos.current.x;
      const dy = t.clientY - lastMousePos.current.y;
      const vx = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, -dy * dragSensitivity));
      const vy = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, dx * dragSensitivity));
      velocityRef.current = { x: vx, y: vy };
      setRotation(prev => ({
        x: normalizeAngle(prev.x + vx),
        y: normalizeAngle(prev.y + vy),
        z: prev.z
      }));
      lastMousePos.current = { x: t.clientX, y: t.clientY };
    };

    const onTouchEnd = () => { isDraggingRef.current = false; };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragSensitivity, maxRotationSpeed]);

  const worldPositions = getWorldPositions();

  if (!images.length) return null;

  return (
    <>
      <style>{`
        @keyframes sphereFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sphereScaleIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* ── Sphere Container ── */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          e.preventDefault();
          isDraggingRef.current = true;
          velocityRef.current = { x: 0, y: 0 };
          lastMousePos.current = { x: e.clientX, y: e.clientY };
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          isDraggingRef.current = true;
          velocityRef.current = { x: 0, y: 0 };
          lastMousePos.current = { x: t.clientX, y: t.clientY };
        }}
        style={{
          position: 'relative',   /* ← CRITICAL: containing block for absolutes */
          width: containerSize,
          height: containerSize,
          perspective: `${perspective}px`,
          touchAction: 'none',
          cursor: 'grab',
          userSelect: 'none',
          flexShrink: 0,
          overflow: 'visible'     /* allow images to breathe at the edges */
        }}
      >
        {worldPositions.map((pos, index) => {
          if (!pos || !pos.isVisible) return null;
          const image = images[index];
          if (!image) return null;

          const imgSize = baseImgSize * pos.scale;
          const isHovered = hoveredIndex === index;
          const finalScale = isHovered ? Math.min(hoverScale, hoverScale / pos.scale) : 1;

          return (
            <div
              key={image.id || index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => setSelectedImage(image)}
              style={{
                // ── CRITICAL: All positioning as inline styles, zero Tailwind ──
                position: 'absolute',
                width: `${imgSize}px`,
                height: `${imgSize}px`,
                // calc(50% + offset) centers on the container, always correct
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y}px)`,
                transform: `translate(-50%, -50%) scale(${finalScale})`,
                opacity: pos.fadeOpacity,
                zIndex: pos.zIndex,
                cursor: 'pointer',
                transition: 'transform 0.15s ease-out',
              }}
            >
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.25)',
                boxShadow: isHovered
                  ? '0 0 20px rgba(255,255,255,0.35), 0 4px 20px rgba(0,0,0,0.6)'
                  : '0 4px 16px rgba(0,0,0,0.5)',
              }}>
                <img
                  src={image.src || image.url}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    pointerEvents: 'none'
                  }}
                  draggable={false}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal ── */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
            animation: 'sphereFadeIn 0.25s ease-out'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#18181b', borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              maxWidth: '340px', width: '100%', overflow: 'hidden',
              animation: 'sphereScaleIn 0.25s ease-out'
            }}
          >
            <div style={{ position: 'relative', aspectRatio: '1/1' }}>
              <img src={selectedImage.src || selectedImage.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button
                onClick={() => setSelectedImage(null)}
                style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.65)', border: 'none',
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>
            {(selectedImage.title || selectedImage.description) && (
              <div style={{ padding: '20px' }}>
                {selectedImage.title && <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: 700, margin: '0 0 8px' }}>{selectedImage.title}</h3>}
                {selectedImage.description && <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{selectedImage.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SphereImageGrid;
