import React, { useState } from "react";
import { cn } from "../../lib/utils";
import "./image-gallery.css";

export default function ImageGallery({ items = [], artistName = "Artist" }) {
  const [activeIndex, setActiveIndex] = useState(null);

  // Map the dynamic artItems into our gallery format
  const images = items.flatMap((item) => {
    const itemImages = Array.isArray(item.images) ? item.images : [];
    return itemImages.map((src, idx) => ({
      url: src,
      title: item.title || `Artwork ${idx + 1}`,
      description: item.description || "Project detail."
    }));
  });

  if (images.length === 0) {
    return (
      <section className="image-gallery-section">
        <div className="gallery-title-wrapper">
          <h1 className="gallery-title">{artistName}'s Art</h1>
          <p className="gallery-desc">No artwork has been uploaded to this gallery yet.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;600;700&display=swap');
      `}</style>
      
      <section className="image-gallery-section">
        
        <div className="gallery-title-wrapper">
          <h1 className="gallery-title">
            {artistName}'s Art
          </h1>
          <p className="gallery-desc">
            Exploring the unique vision and artistic depth through a curated collection of recent works.
          </p>
        </div>

        <div 
          className="gallery-container"
          onMouseLeave={() => setActiveIndex(null)}
        >
          {images.map((image, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setActiveIndex(idx)}
              className={cn(
                "gallery-item",
                activeIndex === idx && "active"
              )}
            >
              <img
                className="gallery-img"
                src={image.url}
                alt={image.title}
              />
              
              <div className="gallery-overlay">
                <div className="gallery-text-content">
                  <p className="gallery-item-title">
                    <strong style={{ fontWeight: 700, color: '#fff', marginRight: '4px' }}>Art Title:</strong> {image.title}
                  </p>
                  <p className="gallery-item-desc">
                    <strong style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginRight: '4px' }}>Brief Description:</strong> {image.description}
                  </p>
                </div>
              </div>

              {activeIndex !== idx && (
                <div className="gallery-indicator">
                  <div className="indicator-line" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
