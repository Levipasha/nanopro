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
    <div 
      className="crop-modal-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 select-none touch-none" 
      onClick={onCancel}
    >
      <div 
        className="crop-modal-card bg-white text-slate-800 rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg flex flex-col overflow-visible animate-in fade-in zoom-in-95 duration-200 max-h-[92dvh]" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="crop-modal-header p-6 text-center border-b border-slate-100 flex-shrink-0">
          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Adjust Photo</h3>
          <p className="text-sm text-slate-500 mt-1">Move the frame • Zoom • Rotate</p>
        </div>

        {/* Cropper Viewport */}
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

        {/* Zoom controls */}
        <div className="crop-controls px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center gap-4 shrink-0">
          <span className="crop-zoom-label text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.05}
            aria-label="Zoom"
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="crop-zoom-slider cursor-pointer"
          />
        </div>

        {/* Rotate controls */}
        <div className="crop-rotate-row">
          <button
            type="button"
            className="crop-rotate-btn"
            onClick={rotateLeft}
            aria-label="Rotate left 90°"
            title="Rotate left"
          >
            {/* Counter-clockwise arrow */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                 strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M2.5 2v6h6" />
              <path d="M2.66 15.57a10 10 0 1 0 .57-8.38" />
            </svg>
          </button>

          <span className="crop-rotation-badge">{rotation}°</span>

          <button
            type="button"
            className="crop-rotate-btn"
            onClick={rotateRight}
            aria-label="Rotate right 90°"
            title="Rotate right"
          >
            {/* Clockwise arrow */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                 strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M21.5 2v6h-6" />
              <path d="M21.34 15.57a10 10 0 1 1-.57-8.38" />
            </svg>
          </button>
        </div>


        {/* Footer actions */}
        <div className="crop-modal-footer p-6 flex gap-4 shrink-0 bg-slate-50/50 border-t border-slate-100 rounded-b-3xl">
          <button 
            type="button" 
            className="crop-btn-cancel flex-1 py-3.5 px-6 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-base hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="crop-btn-save flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-base shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap" 
            onClick={handleSave}
          >
            Save & Crop
          </button>
        </div>

      </div>
    </div>
  );
}
