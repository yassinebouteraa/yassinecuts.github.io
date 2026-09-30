import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Image as ImageIcon, UploadCloud } from 'lucide-react';

import { Modal } from './Modal.jsx';
import { usePortfolio } from '../../context/PortfolioContext.jsx';
import { openUploadWidget } from '../../lib/cloudinary.js';

export function ScreenshotModal({ onClose }) {
  const { addTestimonial } = usePortfolio();
  const [imageUrl, setImageUrl] = useState('');
  const [uploaded, setUploaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleCloudinaryUpload() {
    setError(null);
    try {
      const info = await openUploadWidget({ resourceType: 'image' });
      setImageUrl(info.secure_url);
      setUploaded(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!imageUrl) {
      setError('Provide an image URL, or upload one first.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await addTestimonial({ type: 'image', image_url: imageUrl });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Add Screenshot" icon={ImageIcon} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="imageUrl">Image URL</label>
          <input
            id="imageUrl"
            type="url"
            placeholder="Paste link here..."
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            required
          />
        </div>

        <div className="upload-dropzone">
          <p>OR upload directly to your cloud storage</p>
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', background: '#3448c5' }}
            onClick={handleCloudinaryUpload}
          >
            <UploadCloud size={18} />
            <span>Upload to Cloudinary</span>
          </button>

          <AnimatePresence>
            {uploaded && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ fontSize: '0.75rem', color: 'var(--primary-color)', marginTop: '0.5rem' }}
              >
                Upload successful!
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
          {submitting ? 'Adding…' : 'Add to Testimonials'}
        </button>

        <AnimatePresence>
          {error && (
            <motion.p
              className="form-note form-note-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </Modal>
  );
}
