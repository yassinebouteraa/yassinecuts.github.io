import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, useMotionValue } from 'motion/react';

// The glide into / out of "watching" mode when a reel is played.
const FOCUS_SPRING = { type: 'spring', stiffness: 38, damping: 15, mass: 1.1 };

/**
 * "Watching mode" for the showreel devices (phone, TV).
 *
 * `focus` is a 0 → 1 MotionValue the device blends into its scroll-driven
 * pose: at 1 the device faces the viewer square-on at full size. `session`
 * bumps on exit so the VideoCard can be remounted — that's what actually
 * stops the YouTube player (and its audio) and brings the poster back.
 *
 * Leaves on Escape, or once the viewer has clearly scrolled on (more than
 * half a screen); small accidental scrolls are ignored.
 */
export function useWatchMode({ reduced, onExit }) {
  const focus = useMotionValue(0);
  const [playing, setPlaying] = useState(false);
  const [session, setSession] = useState(0);
  const playingRef = useRef(false);
  const startScroll = useRef(0);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  const transition = reduced ? { duration: 0 } : FOCUS_SPRING;

  function enter() {
    if (playingRef.current) return;
    playingRef.current = true;
    startScroll.current = window.scrollY;
    setPlaying(true);
    animate(focus, 1, transition);
  }

  function exit() {
    if (!playingRef.current) return;
    playingRef.current = false;
    setPlaying(false);
    setSession((n) => n + 1);
    onExitRef.current?.();
    animate(focus, 0, transition);
  }

  const exitRef = useRef(exit);
  exitRef.current = exit;

  useEffect(() => {
    if (!playing) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') exitRef.current();
    };
    const onScroll = () => {
      if (Math.abs(window.scrollY - startScroll.current) > window.innerHeight * 0.5) exitRef.current();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, [playing]);

  return { focus, playing, playingRef, session, enter, exit };
}

/**
 * The devices are laid out at their full watching size and shrunk down to
 * their resting size with a transform. That way round, the video is only
 * ever scaled DOWN (stays sharp) and YouTube sees a big player, so it serves
 * a high-quality stream — scaling a small player up was what made it blurry.
 *
 * Returns a MotionValue holding rest size ÷ full size, measured from an
 * invisible "sizer" element whose CSS size is the resting size.
 */
export function useRestFit(stageRef, sizerRef, axis = 'height') {
  const fit = useMotionValue(1);

  useLayoutEffect(() => {
    const measure = () => {
      const stage = stageRef.current;
      const sizer = sizerRef.current;
      if (!stage || !sizer) return;
      const full = axis === 'height' ? stage.offsetHeight : stage.offsetWidth;
      const rest = axis === 'height' ? sizer.offsetHeight : sizer.offsetWidth;
      if (full > 0) fit.set(Math.min(1, rest / full));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (stageRef.current) observer.observe(stageRef.current);
    if (sizerRef.current) observer.observe(sizerRef.current);
    return () => observer.disconnect();
  }, [stageRef, sizerRef, axis, fit]);

  return fit;
}
