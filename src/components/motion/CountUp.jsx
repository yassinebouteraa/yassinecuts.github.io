import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

/**
 * Counts from 0 to `value` the first time it scrolls into view.
 * `suffix` carries the "+", "M+" or "%" that the raw number can't.
 */
export function CountUp({ value, suffix = '', duration = 2, className, style }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView || reduced) return undefined;

    const controls = animate(0, value, {
      duration,
      ease: [0, 0.55, 0.45, 1],
      onUpdate: (latest) => setDisplay(Math.floor(latest)),
      onComplete: () => setDisplay(value),
    });

    return () => controls.stop();
  }, [inView, reduced, value, duration]);

  return (
    <span ref={ref} className={className} style={style}>
      {display}
      {suffix}
    </span>
  );
}
