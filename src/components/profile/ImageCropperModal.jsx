import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import './ImageCropperModal.css';

export default function ImageCropperModal({ image, aspect = 1, onSave, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const rotateLeft  = () => setRotation((r) => (r - 90 + 360) % 360);
  const rotateRight = () => setRotation((r) => (r + 90) % 360);

  const handleSave = () => onSave(croppedAreaPixels, rotation);

  return (
    <div className="crop-modal-overlay" onClick={onCancel}>
      <div className="crop-modal-card" onClick={(e) => e.stopPropagation()}>

        <div className="crop-modal-header">
          <h3>Adjust Photo</h3>
          <p>Move the frame • Zoom • Rotate</p>
        </div>

        <div className="crop-container">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            showGrid={true}
          />
        </div>

        {/* Zoom row */}
        <div className="crop-controls">
          <span className="crop-zoom-label">Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.05}
            aria-label="Zoom"
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="crop-zoom-slider"
          />
        </div>

        {/* Rotate row */}
        <div className="crop-rotate-row">
          <button
            type="button"
            className="crop-rotate-btn"
            onClick={rotateLeft}
            aria-label="Rotate left 90°"
            title="Rotate left"
          >
            {/* Rotate-left icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                 strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-4" />
            </svg>
            <span>Rotate Left</span>
          </button>

          <span className="crop-rotation-badge">{rotation}°</span>

          <button
            type="button"
            className="crop-rotate-btn"
            onClick={rotateRight}
            aria-label="Rotate right 90°"
            title="Rotate right"
          >
            <span>Rotate Right</span>
            {/* Rotate-right icon (mirrored) */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                 strokeLinecap="round" strokeLinejoin="round" width="20" height="20"
                 style={{ transform: 'scaleX(-1)' }}>
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-4" />
            </svg>
          </button>
        </div>

        <div className="crop-modal-footer">
          <button type="button" className="crop-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="crop-btn-save" onClick={handleSave}>
            Save & Crop
          </button>
        </div>

      </div>
    </div>
  );
}
