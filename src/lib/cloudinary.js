import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config.js';

// Opens the Cloudinary widget and resolves with the uploaded asset info.
// Rejects if the widget script has not loaded.
export function openUploadWidget({ resourceType = 'video', sources } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof window.cloudinary === 'undefined') {
      reject(new Error('Cloudinary widget has not loaded yet. Check your connection and try again.'));
      return;
    }

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
