import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';

/**
 * A soft light that trails the cursor. Purely decorative, mouse-only,
 * and skipped entirely when the visitor prefers reduced motion.
 */
export function CursorGlow() {
  const reduced = useReducedMotion();
  const x = useMotionValue(-500);
  const y = useMotionValue(-500);
  const springX = useSpring(x, { stiffness: 60, damping: 20, mass: 1.2 });
  const springY = useSpring(y, { stiffness: 60, damping: 20, mass: 1.2 });

  useEffect(() => {
    if (reduced) return undefined;
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;

    const onMove = (event) => {
      x.set(event.clientX);
      y.set(event.clientY);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced, x, y]);

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="cursor-glow"
      style={{ x: springX, y: springY }}
    />
  );
}
