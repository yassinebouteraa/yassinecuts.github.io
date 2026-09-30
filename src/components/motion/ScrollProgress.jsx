import { motion, useScroll, useSpring } from 'motion/react';

/** Thin gradient bar across the top that tracks how far down the page you are. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      style={{
        scaleX,
        transformOrigin: '0% 50%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 200,
        background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))',
      }}
    />
  );
}
