/**
 * Ensures image URLs are valid and loadable.
 * Fixes relative paths, missing protocols, and dead domains.
 */
export const fixImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // Handle data URLs - return as-is
  if (trimmed.startsWith('data:')) return trimmed;

  // Handle double slash URLs
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

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
  // Guard: ensure the base always has a protocol so it isn't treated as a relative URL
  if (trimmed.startsWith('/')) {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    let base = process.env.REACT_APP_API_URL || (isLocal ? process.env.REACT_APP_LOCAL_API_URL : process.env.REACT_APP_PRODUCTION_API_URL) || (typeof window !== 'undefined' ? window.location.origin : "");
    if (base && !base.startsWith('http://') && !base.startsWith('https://')) {
      base = `https://${base}`;
    }
    return `${base}${trimmed}`;
  }

  // Assume it needs https
  return `https://${trimmed}`;
};
