// Shared motion language for the whole site.
// One easing curve and one set of distances keeps everything feeling related.

export const EASE = [0.22, 1, 0.36, 1];
export const EASE_OUT = [0.16, 1, 0.3, 1];

export const SPRING = { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 };
export const SOFT_SPRING = { type: 'spring', stiffness: 140, damping: 20, mass: 1 };

const OFFSETS = {
  up: { y: 60 },
  down: { y: -60 },
  left: { x: -60 },
  right: { x: 60 },
  fade: {},
  scale: { scale: 0.92 },
};

/**
 * Builds a hidden/visible variant pair for a given direction.
 * `distance` scales the travel so small elements move less than big ones.
 */
export function revealVariants(direction = 'up', { distance = 1, duration = 0.9 } = {}) {
  const offset = OFFSETS[direction] ?? OFFSETS.up;
  const hidden = { opacity: 0 };
  if (offset.y) hidden.y = offset.y * distance;
  if (offset.x) hidden.x = offset.x * distance;
  if (offset.scale) hidden.scale = offset.scale;

  return {
    hidden,
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration, ease: EASE },
    },
  };
}

/** Parent variant that hands its children a staggered entrance. */
export function staggerVariants({ stagger = 0.09, delayChildren = 0 } = {}) {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

/** Words sliding up out of a clipped line — used for the big headings. */
export const wordVariants = {
  hidden: { y: '110%' },
  visible: { y: '0%', transition: { duration: 0.8, ease: EASE } },
};

/** Modal backdrop + panel. */
export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const panelVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { ...SPRING, stiffness: 300, damping: 28 } },
  exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18, ease: 'easeIn' } },
};

/** Standard viewport config: fire once, a little before the element is fully in view. */
export const VIEWPORT = { once: true, amount: 0.2, margin: '0px 0px -80px 0px' };
