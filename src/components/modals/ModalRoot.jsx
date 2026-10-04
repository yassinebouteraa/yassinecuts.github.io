import { Suspense, lazy } from 'react';
import { AnimatePresence } from 'motion/react';

import { useModal } from '../../context/ModalContext.jsx';
import { ReviewModal } from './ReviewModal.jsx';
import { HireModal } from './HireModal.jsx';
import { LoginModal } from './LoginModal.jsx';

// Admin-only upload forms: split out so visitors never download them.
const VideoModal = lazy(() => import('./VideoModal.jsx').then((m) => ({ default: m.VideoModal })));
const ScreenshotModal = lazy(() =>
  import('./ScreenshotModal.jsx').then((m) => ({ default: m.ScreenshotModal }))
);

/** Single mount point so exit animations run before a modal unmounts. */
export function ModalRoot() {
  const { modal, closeModal } = useModal();

  return (
    <Suspense fallback={null}>
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
    </Suspense>
  );
}
