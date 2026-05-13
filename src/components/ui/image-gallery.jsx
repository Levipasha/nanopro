import React, { useState } from "react";
import "./image-gallery.css";

export default function ImageGallery({ items = [], artistName = "Artist" }) {
  const [selectedFolder, setSelectedFolder] = useState(null);

  // If there's only 1 item, just show its images directly
  const activeItems = items.length === 1 ? [items[0]] : (selectedFolder ? [selectedFolder] : null);

  if (items.length === 0) {
    return (
      <section className="image-gallery-section">
        <div className="gallery-title-wrapper">
          <h1 className="gallery-title">{artistName}'s Art</h1>
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
          <h1 className="gallery-title">{artistName}'s Art</h1>
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
            {selectedFolder ? selectedFolder.title : `${artistName}'s Art`}
          </h1>
          <p className="gallery-desc">
            {selectedFolder ? selectedFolder.description : "Exploring the unique vision and artistic depth through a curated collection."}
          </p>
        </div>

        <div className="gallery-grid">
          {images.map((image, idx) => {
            const rotation = (idx % 2 === 0 ? -1.5 : 1.5) + (idx % 3 === 0 ? 0.5 : -0.5);
            return (
              <div 
                key={idx} 
                className="gallery-polaroid-card"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <div className="gallery-polaroid-frame">
                  <img className="gallery-polaroid-img" src={image.url} alt={image.title} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}



