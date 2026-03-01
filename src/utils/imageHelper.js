/**
 * Ensures image URLs are valid and loadable.
 * Fixes relative paths, missing protocols, and dead domains.
 */
export const fixImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // Already a full URL - force https for Cloudinary to avoid mixed content
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    if (trimmed.includes('cloudinary.com') && trimmed.startsWith('http://')) {
      return trimmed.replace('http://', 'https://');
    }
    return trimmed;
  }

  // Cloudinary path without protocol
  if (trimmed.startsWith('res.cloudinary.com') || trimmed.includes('cloudinary.com')) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }

  // Relative path - resolve against API/base
  if (trimmed.startsWith('/')) {
    const base = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
    return `${base}${trimmed}`;
  }

  // Assume it needs https
  return `https://${trimmed}`;
};
