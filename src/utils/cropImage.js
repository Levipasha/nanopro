/**
 * cropImage.js
 * Utility to process cropping using HTML5 Canvas.
 */

export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    // Only set crossOrigin for remote http(s) URLs.
    // For blob: URLs (local files), setting crossOrigin causes a CORS
    // error on mobile browsers that makes the canvas draw a black frame.
    if (url && url.startsWith('http')) {
      image.setAttribute('crossOrigin', 'anonymous');
    }
    image.src = url;
  });

export default async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Cap output size to avoid memory issues on mobile (max 1200px on either side)
  const scale = Math.min(1, 1200 / Math.max(pixelCrop.width, pixelCrop.height));
  canvas.width  = Math.round(pixelCrop.width  * scale);
  canvas.height = Math.round(pixelCrop.height * scale);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL('image/jpeg', 0.85);
}
