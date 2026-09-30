import { AnimatePresence } from 'motion/react';

import { useModal } from '../../context/ModalContext.jsx';
import { VideoModal } from './VideoModal.jsx';
import { ScreenshotModal } from './ScreenshotModal.jsx';
import { ReviewModal } from './ReviewModal.jsx';
import { HireModal } from './HireModal.jsx';
import { LoginModal } from './LoginModal.jsx';

/** Single mount point so exit animations run before a modal unmounts. */
export function ModalRoot() {
  const { modal, closeModal } = useModal();

  return (
    <AnimatePresence mode="wait">
      {modal.name === 'video' && (
        <VideoModal key="video" video={modal.payload} onClose={closeModal} />
      )}
      {modal.name === 'screenshot' && <ScreenshotModal key="screenshot" onClose={closeModal} />}
      {modal.name === 'review' && <ReviewModal key="review" onClose={closeModal} />}
      {modal.name === 'hire' && (
        <HireModal key="hire" preselectedPackage={modal.payload?.package} onClose={closeModal} />
      )}
      {modal.name === 'login' && <LoginModal key="login" onClose={closeModal} />}
    </AnimatePresence>
  );
}
