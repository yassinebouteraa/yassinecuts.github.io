import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

import { backdropVariants, panelVariants } from '../motion/variants.js';

/**
 * Shared modal shell. Entry/exit is driven by <ModalRoot>'s AnimatePresence;
 * the panel inherits the backdrop's animation state through variant propagation.
 */
export function Modal({ title, icon: Icon, onClose, children }) {
  const panelRef = useRef(null);

  // Move focus into the dialog so keyboard and screen-reader users land there.
  useEffect(() => {
    const focusable = panelRef.current?.querySelector(
      'input, textarea, select, button:not([aria-label="Close"])'
    );
    focusable?.focus();
  }, []);

  return (
    <motion.div
      className="modal-overlay"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={panelRef}
        className="glass-panel modal-content"
        variants={panelVariants}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          <h2>
            {Icon && <Icon size={22} style={{ color: 'var(--primary-color)' }} />}
            {title}
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {children}
      </motion.div>
    </motion.div>
  );
}
