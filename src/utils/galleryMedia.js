/**
 * Client-side checks for onboarding gallery files (images, GIFs, short videos).
 */

const MAX_VIDEO_SECONDS = 30;

export function assertGalleryFileKind(file) {
  if (!file || !file.type) {
    throw new Error('Invalid file.');
  }
  const t = file.type;
  if (t.startsWith('image/') || t.startsWith('video/')) return;
  throw new Error('Only images, GIFs, or videos are allowed.');
}

/**
 * @returns {Promise<void>}
 */
export function assertVideoMaxDuration(file, maxSeconds = MAX_VIDEO_SECONDS) {
  if (!file || !file.type.startsWith('video/')) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      v.removeAttribute('src');
      v.load();
    };

    v.onloadedmetadata = () => {
      const d = v.duration;
      cleanup();
      if (!Number.isFinite(d) || d <= 0) {
        reject(new Error('Could not read video length.'));
        return;
      }
      if (d > maxSeconds + 0.25) {
        reject(new Error(`Video must be ${maxSeconds} seconds or shorter.`));
        return;
      }
      resolve();
    };

    v.onerror = () => {
      cleanup();
      reject(new Error('Could not load this video file.'));
    };

    v.src = url;
  });
}

export { MAX_VIDEO_SECONDS };
