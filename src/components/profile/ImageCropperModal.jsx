import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import './ImageCropperModal.css';

/**
 * ImageCropperModal
 * A versatile image cropper for profile photos, art, and events.
 * 
 * @param {string} image - The source image URL (data-url or online URL)
 * @param {number} aspect - Aspect ratio (e.g., 1 for square, 16/9 for wide)
 * @param {function} onSave - Callback with the cropped image dataUrl
 * @param {function} onCancel - Callback to close the modal
 */
export default function ImageCropperModal({ image, aspect = 1, onSave, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = () => {
    onSave(croppedAreaPixels);
  };

  return (
    <div className="crop-modal-overlay" onClick={onCancel}>
      <div className="crop-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="crop-modal-header">
          <h3>Adjust Photo</h3>
          <p>Drag to reposition, use the slider to zoom</p>
        </div>

        <div className="crop-container">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            showGrid={true}
          />
        </div>

        <div className="crop-controls">
          <span className="crop-zoom-label">Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="crop-zoom-slider"
          />
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
