import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Lock } from 'lucide-react';

import { Modal } from './Modal.jsx';
import { useAdmin } from '../../context/AdminContext.jsx';

/**
 * Replaces the old prompt()-plus-SHA-256 admin toggle. The real gate is
 * Supabase Auth and the Row Level Security policies behind it, so a visitor
 * finding this form gains nothing without credentials.
 */
export function LoginModal({ onClose }) {
  const { signIn } = useAdmin();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(form.email, form.password);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Admin Sign In" icon={Lock} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="adminEmail">Email</label>
          <input
            id="adminEmail"
            className="cinematic-input"
            type="email"
            autoComplete="username"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="adminPassword">Password</label>
          <input
            id="adminPassword"
            className="cinematic-input"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={set('password')}
            required
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign In'}
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
