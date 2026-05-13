import React from 'react';
import { useLocation } from 'react-router-dom';
import ImageGallery from '../components/ui/image-gallery';

export default function ArtGalleryPage() {
  const location = useLocation();

  const artItems = location.state?.artItems || [];
  const artistName = location.state?.artistName || 'Artist';

  return <ImageGallery items={artItems} artistName={artistName} />;
}

