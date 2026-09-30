import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'motion/react';

/**
 * Wraps a card so it drifts and racks into focus as it crosses the viewport —
 * a continuous scroll-linked "moving screen" effect, distinct from the
 * one-time fade/slide-up entrance the card itself still handles on first
 * reveal (via its own `variants`, on its own element).
 *
 * This has to live on its OWN element, separate from the card it wraps: the
 * card's root already carries `variants` (entrance) and `whileHover` (lift),
 * both targeting `y` and both resolved internally by Framer Motion's own
 * gesture/state system. Adding a second, *external* MotionValue for `y` via
 * `style` on that same element would silently become the sole driver for
 * that transform key and override both — the same failure mode fixed twice
 * already elsewhere in this codebase. Keeping it on a separate wrapper means
 * the two transforms simply compose as ordinary nested CSS transforms.
 */
export function ScrollFocus({ children, intensity = 1, className }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  // Progress across the card's own transit through the viewport: 0 as it
  // enters from the bottom, 1 as it exits the top. Each card tracks its own
  // position, so cards in a masonry grid naturally drift out of sync with
  // each other rather than moving as one rigid block.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });

  const y = useTransform(smooth, [0, 0.5, 1], [58 * intensity, 0, -30 * intensity]);
  const scale = useTransform(smooth, [0, 0.5, 1], [0.92, 1, 0.97]);

  return (
    <motion.div ref={ref} className={className} style={reduced ? undefined : { y, scale }}>
      {children}
    </motion.div>
  );
}
