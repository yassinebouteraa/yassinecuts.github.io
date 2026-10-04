import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ModalContext = createContext(null);

/**
 * One modal at a time, addressed by name, with an optional payload
 * (e.g. the video being edited, or the package a visitor clicked).
 */
export function ModalProvider({ children }) {
  const [modal, setModal] = useState({ name: null, payload: null });

  const openModal = useCallback((name, payload = null) => setModal({ name, payload }), []);
  const closeModal = useCallback(() => setModal({ name: null, payload: null }), []);

  // Escape closes, and the page behind stops scrolling while a modal is up.
  useEffect(() => {
    if (!modal.name) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [modal.name, closeModal]);

  const value = useMemo(
    () => ({ modal, openModal, closeModal, isOpen: (name) => modal.name === name }),
    [modal, openModal, closeModal]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used inside <ModalProvider>');
  return ctx;
}
