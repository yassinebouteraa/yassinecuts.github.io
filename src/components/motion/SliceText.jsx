import { motion, useTransform } from 'motion/react';

/**
 * Big display text cut in two along a diagonal, the same rising slice as
 * the YassineCuts logo. The two halves are separate layers, so they can
 * slide apart along the cut, and an orange "razor" line can be drawn along
 * the cut itself.
 *
 * Driven entirely by MotionValues from the parent:
 *   sep      -1..1  how far apart the halves are (0 = joined). Negative and
 *                    positive move the halves in opposite directions, so a
 *                    title can arrive from one side and leave through the other.
 *   slitDraw  0..1  how much of the orange cut line is drawn.
 *   slitFade  0..1  opacity of the cut line.
 */
export function SliceText({ text, sep, slitDraw, slitFade, opacity, className = '' }) {
  const topX = useTransform(sep, (v) => `${v * 14}vw`);
  const topY = useTransform(sep, (v) => `${v * -1.4}vw`);
  const bottomX = useTransform(sep, (v) => `${v * -14}vw`);
  const bottomY = useTransform(sep, (v) => `${v * 1.4}vw`);
  const slitClip = useTransform(slitDraw, (v) => `inset(-50% ${(1 - v) * 100}% -50% 0%)`);

  return (
    <motion.div className={`slice-text ${className}`} style={{ opacity }}>
      <motion.span className="slice-half slice-half-top" style={{ x: topX, y: topY }}>
        {text}
      </motion.span>
      <motion.span className="slice-half slice-half-bottom" style={{ x: bottomX, y: bottomY }} aria-hidden="true">
        {text}
      </motion.span>
      {/* The cut line is revealed with a moving clip rather than a dash
          offset: dashes and a non-scaling stroke on a stretched viewBox
          break up into segments in Chrome. */}
      <motion.svg
        className="slice-slit"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ clipPath: slitClip, opacity: slitFade }}
        aria-hidden="true"
      >
        <line x1="-2" y1="61" x2="102" y2="43" vectorEffect="non-scaling-stroke" />
      </motion.svg>
    </motion.div>
  );
}
