import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';

/**
 * Subtle 3D tilt that tracks the cursor across the card.
 * Rotation is small on purpose — the video is the subject, not the effect.
 *
 * Pointer handlers passed in are chained with the tilt's own, so a parent can
 * still track hover without knocking out the reset-on-leave.
 */
export function TiltCard({
  children,
  className,
  style,
  max = 7,
  lift = -8,
  onPointerMove,
  onPointerLeave,
  ...rest
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  // -0.5 .. 0.5 relative to the card's centre
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const config = { stiffness: 200, damping: 22, mass: 0.7 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [max, -max]), config);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-max, max]), config);

  function handlePointerMove(event) {
    onPointerMove?.(event);
    if (reduced || event.pointerType !== 'mouse') return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handlePointerLeave(event) {
    onPointerLeave?.(event);
    px.set(0);
    py.set(0);
  }

  const tiltStyle = reduced
    ? style
    : { ...style, rotateX, rotateY, transformPerspective: 1000, transformStyle: 'preserve-3d' };

  return (
    <motion.div
      ref={ref}
      className={className}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={tiltStyle}
      whileHover={reduced ? undefined : { y: lift }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
