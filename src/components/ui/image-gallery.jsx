import React, { useState, useEffect } from "react";
import "./image-gallery.css";
import { fixImageUrl } from "../../utils/imageHelper";

export default function ImageGallery({ items = [], artistName = "Artist" }) {
  const cleanArtistName = artistName ? artistName.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim() : 'Artist';
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Lock background scroll when modal open
  useEffect(() => {
    if (!selectedImage) return;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, [selectedImage]);

  // If there's only 1 item, just show its images directly
  const activeItems = items.length === 1 ? [items[0]] : (selectedFolder ? [selectedFolder] : null);

  if (items.length === 0) {
    return (
      <section className="image-gallery-section">
        <div className="gallery-title-wrapper">
          <h1 className="gallery-title">{cleanArtistName}'s Art</h1>
          <p className="gallery-desc">No artwork has been uploaded to this gallery yet.</p>
        </div>
      </section>
    );
  }

  // View 1: List of Showcases (Folders)
  if (!activeItems) {
    return (
      <section className="image-gallery-section">
        <div className="gallery-title-wrapper">
          <h1 className="gallery-title">{cleanArtistName}'s Art</h1>
          <p className="gallery-desc">Select a showcase to view the collection.</p>
        </div>

        <div className="gallery-grid">
          {items.map((item, idx) => {
            const coverImage = Array.isArray(item.images) ? item.images[0] : "";
            const rotation = (idx % 2 === 0 ? -1.5 : 1.5);
            
            return (
              <div 
                key={item.id || idx} 
                className="gallery-polaroid-card"
                style={{ transform: `rotate(${rotation}deg)` }}
                onClick={() => setSelectedFolder(item)}
              >
                <div className="gallery-polaroid-frame">
                  {coverImage ? (
                    <img className="gallery-polaroid-img" src={coverImage} alt={item.title} />
                  ) : (
                    <div className="gallery-placeholder">No Image</div>
                  )}
                </div>
                <div className="gallery-folder-label">
                   {item.title}
                </div>

              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // View 2: Images inside a Showcase
  const images = activeItems.flatMap((item) => {
    const itemImages = Array.isArray(item.images) ? item.images : [];
    return itemImages.map((src, idx) => ({
      url: src,
      title: item.title || `Artwork ${idx + 1}`
    }));
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;600;700&display=swap');
      `}</style>
      
      <section className="image-gallery-section">
        <div className="gallery-title-wrapper">
          {items.length > 1 && (
            <button className="gallery-back-btn" onClick={() => setSelectedFolder(null)}>
              ← Back to Gallery
            </button>
          )}
          <h1 className="gallery-title">
            {selectedFolder ? selectedFolder.title : (items.length === 1 ? items[0].title : `${cleanArtistName}'s Art`)}
          </h1>
          {!(selectedFolder || items.length === 1) && (
            <p className="gallery-desc">
              Exploring the unique vision and artistic depth through a curated collection.
            </p>
          )}
        </div>

        {selectedFolder || items.length === 1 ? (
          <>
            <div className="gallery-zigzag-list">
              {(() => {
                // --- Flow-based Line Chunking Logic ---
                const rawDescription = selectedFolder ? (selectedFolder.description || "") : (items[0]?.description || "");
                
                // Split entire text into words
                const words = rawDescription.split(/\s+/).filter(Boolean);
                const charsPerLine = 32;
                const linesPerImage = 9; // Fit exactly 9 lines of text next to the polaroid card

                // Build text lines
                const lines = [];
                let currentLine = [];
                let currentLineLen = 0;

                words.forEach(word => {
                  if (currentLineLen + word.length + (currentLineLen > 0 ? 1 : 0) <= charsPerLine) {
                    currentLine.push(word);
                    currentLineLen += word.length + (currentLineLen > 0 ? 1 : 0);
                  } else {
                    lines.push(currentLine.join(' '));
                    currentLine = [word];
                    currentLineLen = word.length;
                  }
                });
                if (currentLine.length > 0) {
                  lines.push(currentLine.join(' '));
                }

                // Group lines into chunks of linesPerImage size
                const finalParas = [];
                for (let i = 0; i < lines.length; i += linesPerImage) {
                  const chunkLines = lines.slice(i, i + linesPerImage);
                  finalParas.push(chunkLines.join(' '));
                }

                // --- Mismatch Logic ---
                const numZigzags = Math.min(images.length, finalParas.length);
                const extraParas = finalParas.slice(numZigzags);
                const extraImages = images.slice(numZigzags);

                return (
                  <>
                    {/* 1. Zigzag Section */}
                    {images.slice(0, numZigzags).map((image, idx) => (
                      <div key={idx} className="zigzag-item">
                        <div className="zigzag-image-wrap">
                          <div 
                            className="gallery-polaroid-card"
                            style={{ 
                              transform: `rotate(${idx % 2 === 0 ? -2 : 2}deg)`,
                              cursor: 'zoom-in' 
                            }}
                            onClick={() => setSelectedImage(image)}
                          >
                            <div className="gallery-polaroid-frame">
                              <img className="gallery-polaroid-img" src={fixImageUrl(image.url) || image.url} alt={image.title} />
                            </div>
                          </div>
                        </div>
                        <div className="zigzag-content">
                          <p className="zigzag-text">{finalParas[idx]}</p>
                        </div>
                      </div>
                    ))}

                    {/* 2. Extra Text (If text > images) */}
                    {extraParas.length > 0 && (
                      <div className="gallery-extra-text-list">
                        {extraParas.map((para, idx) => (
                          <p key={idx} className="zigzag-text">{para}</p>
                        ))}
                      </div>
                    )}

                    {/* 3. Extra Images (If images > text) */}
                    {extraImages.length > 0 && (
                      <div className="gallery-extra-images-grid">
                        {extraImages.map((image, idx) => (
                          <div 
                            key={idx} 
                            className="gallery-polaroid-card"
                            style={{ transform: `rotate(${(idx % 2 === 0 ? -1.5 : 1.5)}deg)`, cursor: 'zoom-in' }}
                            onClick={() => setSelectedImage(image)}
                          >
                            <div className="gallery-polaroid-frame">
                              <img className="gallery-polaroid-img" src={fixImageUrl(image.url) || image.url} alt={image.title} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </>
        ) : (
          <div className="gallery-grid">
            {images.map((image, idx) => {
              const rotation = (idx % 2 === 0 ? -1.5 : 1.5) + (idx % 3 === 0 ? 0.5 : -0.5);
              return (
                <div 
                  key={idx} 
                  className="gallery-polaroid-card"
                  style={{ transform: `rotate(${rotation}deg)`, cursor: 'zoom-in' }}
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="gallery-polaroid-frame">
                    <img className="gallery-polaroid-img" src={fixImageUrl(image.url) || image.url} alt={image.title} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedImage && (
        <div className="gallery-modal" onClick={() => setSelectedImage(null)}>
          <div className="gallery-modal-overlay" />
          <button type="button" className="gallery-modal-close" onClick={() => setSelectedImage(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={fixImageUrl(selectedImage.url) || selectedImage.url} 
              alt={selectedImage.title} 
              className="gallery-modal-img" 
            />
            {selectedImage.title && <p className="gallery-modal-caption">{selectedImage.title}</p>}
          </div>
        </div>
      )}
    </>
  );
}



