import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Film, Pencil, UploadCloud } from 'lucide-react';

import { Modal } from './Modal.jsx';
import { usePortfolio } from '../../context/PortfolioContext.jsx';
import { openUploadWidget } from '../../lib/cloudinary.js';
import { VIDEO_CATEGORIES } from '../../config.js';

export function VideoModal({ video, onClose }) {
  const { addVideo, updateVideo } = usePortfolio();
  const isEditing = Boolean(video?.id);

  const [form, setForm] = useState({
    videoUrl: video?.video_url ?? video?.videoUrl ?? '',
    title: video?.title ?? '',
    description: video?.description ?? '',
    category: video?.category ?? 'Talking Head',
  });
  const [uploaded, setUploaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleCloudinaryUpload() {
    setError(null);
    try {
      const info = await openUploadWidget({ resourceType: 'video' });
      setForm((current) => ({
        ...current,
        videoUrl: info.secure_url,
        title: current.title || (info.original_filename ?? '').split('_').join(' '),
      }));
      setUploaded(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.videoUrl) {
      setError('Add a video URL, or upload one to Cloudinary first.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (isEditing) await updateVideo(video.id, form);
      else await addVideo(form);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={isEditing ? 'Replace Video' : 'Add New Video'}
      icon={isEditing ? Pencil : Film}
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="videoUrl">Video URL (YouTube/Vimeo/Cloudinary)</label>
          <input
            id="videoUrl"
            type="url"
            placeholder="Paste link here..."
            value={form.videoUrl}
            onChange={set('videoUrl')}
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

        <div className="field">
          <label htmlFor="videoTitle">Project Title</label>
          <input
            id="videoTitle"
            type="text"
            placeholder="e.g. Cinematic Showreel 2024"
            value={form.title}
            onChange={set('title')}
          />
        </div>

        <div className="field">
          <label htmlFor="videoCategory">Editing Style</label>
          <div className="cinematic-select-wrapper">
            <select
              id="videoCategory"
              className="cinematic-input"
              value={form.category}
              onChange={set('category')}
            >
              {VIDEO_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="videoDesc">Description</label>
          <textarea
            id="videoDesc"
            rows={3}
            placeholder="Briefly describe the edit..."
            value={form.description}
            onChange={set('description')}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
          {submitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Upload to Database'}
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
