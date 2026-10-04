import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config.js';

const WIDGET_SRC = 'https://upload-widget.cloudinary.com/global/all.js';
let widgetPromise = null;

// The upload widget is admin-only, so its script is fetched the first time
// an upload is started instead of on every visitor's page load.
function loadWidget() {
  if (typeof window.cloudinary !== 'undefined') return Promise.resolve();
  if (!widgetPromise) {
    widgetPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = WIDGET_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        widgetPromise = null;
        reject(new Error('Cloudinary widget could not load. Check your connection and try again.'));
      };
      document.head.appendChild(script);
    });
  }
  return widgetPromise;
}

// Opens the Cloudinary widget and resolves with the uploaded asset info.
export async function openUploadWidget({ resourceType = 'video', sources } = {}) {
  await loadWidget();
  return new Promise((resolve, reject) => {

    window.cloudinary.openUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: sources ?? (resourceType === 'image' ? ['local', 'url', 'camera'] : ['local', 'url']),
        resourceType,
        multiple: false,
      },
      (error, result) => {
        if (error) {
          reject(error instanceof Error ? error : new Error(error.message || 'Upload failed'));
          return;
        }
        if (result && result.event === 'success') resolve(result.info);
      }
    );
  });
}

/**
 * Asks Cloudinary for a resized, auto-format (WebP/AVIF), auto-quality copy
 * of an uploaded image. Review screenshots are stored at phone resolution
 * (~1170px wide) but shown around 350px, so the grid was decoding three
 * times the pixels it needed. Non-Cloudinary URLs pass through untouched.
 */
export function cloudinaryThumb(url, width) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/c_limit,w_${width},f_auto,q_auto/`);
}
