import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Briefcase } from 'lucide-react';

import { Modal } from './Modal.jsx';
import { getSupabase } from '../../lib/supabase.js';
import { CONTACT_EMAIL, PACKAGE_OPTIONS } from '../../config.js';

export function HireModal({ preselectedPackage, onClose }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    package: preselectedPackage ?? 'General Inquiry',
    message: '',
  });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  // Close automatically a few seconds after a successful send.
  useEffect(() => {
    if (status !== 'sent') return undefined;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [status, onClose]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          package: form.package,
          message: form.message,
          _subject: `New Inquiry: ${form.package} from YassineCuts Portfolio!`,
        }),
      });

      if (!response.ok) throw new Error('Email sending failed');

      // Belt and braces: keep a copy in Supabase. A failure here must not
      // make a successfully sent inquiry look like it failed.
      try {
        const supabase = await getSupabase();
        await supabase.from('messages').insert([
          { name: form.name, email: form.email, package: form.package, message: form.message },
        ]);
      } catch (dbError) {
        console.warn('Inquiry sent, but could not be stored in Supabase:', dbError);
      }

      setStatus('sent');
    } catch (error) {
      console.error('Submission error:', error);
      setStatus('error');
    }
  }

  const sending = status === 'sending';

  return (
    <Modal title="Let's Work Together" icon={Briefcase} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="hireName">Name *</label>
          <input
            id="hireName"
            className="cinematic-input"
            type="text"
            placeholder="Your Name or Company"
            value={form.name}
            onChange={set('name')}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="hireEmail">Email *</label>
          <input
            id="hireEmail"
            className="cinematic-input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="hirePackage">Package *</label>
          <div className="cinematic-select-wrapper">
            <select
              id="hirePackage"
              className="cinematic-input"
              value={form.package}
              onChange={set('package')}
            >
              {PACKAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="hireMessage">Project Details *</label>
          <textarea
            id="hireMessage"
            className="cinematic-input"
            rows={4}
            placeholder="Tell me about your project, timeline, and goals..."
            value={form.message}
            onChange={set('message')}
            required
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%' }}
          disabled={sending || status === 'sent'}
        >
          {sending ? 'Sending…' : 'Send Inquiry'}
        </button>

        <AnimatePresence mode="wait">
          {status === 'sent' && (
            <motion.p
              key="sent"
              className="form-note form-note-success"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Message sent successfully! I&apos;ll be in touch soon.
            </motion.p>
          )}
          {status === 'error' && (
            <motion.p
              key="error"
              className="form-note form-note-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Oops, something went wrong. Please try again.
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </Modal>
  );
}
