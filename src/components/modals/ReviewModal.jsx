import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Star } from 'lucide-react';

import { Modal } from './Modal.jsx';
import { usePortfolio } from '../../context/PortfolioContext.jsx';

export function ReviewModal({ onClose }) {
  const { addTestimonial } = usePortfolio();
  const [form, setForm] = useState({ name: '', role: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await addTestimonial({
        type: 'text',
        name: `${form.name} - ${form.role}`,
        text: form.text,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Add Testimonial" icon={Star} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="reviewerName">Your Name *</label>
          <input
            id="reviewerName"
            type="text"
            placeholder="e.g. Alex R."
            value={form.name}
            onChange={set('name')}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="reviewerRole">Role / Platform *</label>
          <input
            id="reviewerRole"
            type="text"
            placeholder="e.g. YouTuber"
            value={form.role}
            onChange={set('role')}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="reviewerText">Your Review *</label>
          <textarea
            id="reviewerText"
            rows={4}
            placeholder="Finding Yassine was a gamechanger..."
            value={form.text}
            onChange={set('text')}
            required
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Testimonial'}
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
