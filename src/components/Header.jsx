import { useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useReducedMotion } from 'motion/react';
import { Briefcase, LogOut, Menu, Plus, PlaySquare, X } from 'lucide-react';

import { useAdmin } from '../context/AdminContext.jsx';
import { useModal } from '../context/ModalContext.jsx';
import { useActiveSection } from '../hooks/useActiveSection.js';
import { MagneticButton } from './motion/MagneticButton.jsx';
import { EASE, SPRING } from './motion/variants.js';

const NAV_ITEMS = [
  { id: 'showreel', label: 'Showreel' },
  { id: 'packages', label: 'Packages' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'contact', label: 'Contact' },
];

const NAV_IDS = NAV_ITEMS.map((item) => item.id);

export function Header() {
  const { isAdmin, signOut } = useAdmin();
  const { openModal } = useModal();
  const active = useActiveSection(NAV_IDS);
  const reduced = useReducedMotion();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Slide the header out of the way when scrolling down, bring it back on the
  // way up — more screen for the work, nav always one flick away.
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (mobileOpen) return;
    setHidden(latest > previous && latest > 240);
  });

  return (
    <>
      <motion.header
        className="site-header"
        animate={{ y: hidden && !reduced ? '-180%' : '0%' }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <div className="container">
          <div
            className="brand"
            onClick={() => (isAdmin ? undefined : openModal('login'))}
            title={isAdmin ? 'Signed in as admin' : undefined}
          >
            <motion.span
              whileHover={reduced ? undefined : { rotate: -12, scale: 1.12 }}
              transition={SPRING}
              style={{ display: 'flex', color: 'var(--primary-color)' }}
            >
              <PlaySquare size={26} />
            </motion.span>
            <h1>
              Yassine<span className="text-gradient">Cuts</span>
            </h1>
          </div>

          <nav className="desktop-nav">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={active === item.id ? 'nav-link nav-link-active' : 'nav-link'}
              >
                {item.label}
                {active === item.id && (
                  <motion.span layoutId="nav-indicator" className="nav-indicator" transition={SPRING} />
                )}
              </a>
            ))}

            {isAdmin && (
              <>
                <MagneticButton
                  className="btn-primary btn-subtle"
                  onClick={() => openModal('video')}
                  strength={0.2}
                >
                  <Plus size={16} />
                  <span>Add Video</span>
                </MagneticButton>
                <button className="btn-icon" onClick={signOut} title="Sign out of admin">
                  <LogOut size={18} />
                </button>
              </>
            )}

            <MagneticButton
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #ec4899)' }}
              onClick={() => openModal('hire')}
            >
              <Briefcase size={18} />
              <span>Hire Me</span>
            </MagneticButton>
          </nav>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileOpen ? 'close' : 'open'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex' }}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-nav"
            initial={{ opacity: 0, y: -16, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -12, scaleY: 0.95 }}
            transition={{ ...SPRING, stiffness: 320, damping: 30 }}
          >
            {NAV_ITEMS.map((item, index) => (
              <motion.a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * index + 0.05, duration: 0.3, ease: EASE }}
              >
                {item.label}
              </motion.a>
            ))}

            <button
              className="btn-primary"
              onClick={() => {
                setMobileOpen(false);
                openModal('hire');
              }}
            >
              <Briefcase size={18} />
              <span>Hire Me</span>
            </button>

            {isAdmin && (
              <>
                <button
                  className="btn-primary btn-subtle"
                  onClick={() => {
                    setMobileOpen(false);
                    openModal('video');
                  }}
                >
                  <Plus size={16} />
                  <span>Add Video</span>
                </button>
                <button
                  className="btn-primary btn-subtle"
                  onClick={() => {
                    setMobileOpen(false);
                    signOut();
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
