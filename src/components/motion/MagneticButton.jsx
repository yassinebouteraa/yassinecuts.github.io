import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';

/**
 * Button that leans toward the cursor and springs back on leave.
 * Falls back to a plain button when the pointer is coarse or motion is reduced.
 */
export function MagneticButton({
  children,
  strength = 0.35,
  className,
  style,
  as = 'button',
  ...rest
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });

  const Tag = motion[as] ?? motion.button;

  function handlePointerMove(event) {
    if (reduced || event.pointerType !== 'mouse') return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ ...style, x: springX, y: springY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onBlur={reset}
      whileHover={reduced ? undefined : { scale: 1.04 }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
