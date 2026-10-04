import { useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';

import { X } from 'lucide-react';

import { useRestFit, useWatchMode } from '../hooks/useWatchMode.js';
import { VideoCard } from './VideoCard.jsx';
import { EASE } from './motion/variants.js';

// Scroll budget for the whole phone sequence, scaled by reel count and capped
// both ways — same idea as the TV track.
const VH_PER_REEL = 120;
const MIN_TRACK_VH = 260;
const MAX_TRACK_VH = 1200;

// The last 55% of each reel's scroll slice is the flip to the next one — a
// long stretch of scroll per turn, so the spin reads as slow and deliberate.
// The first 45% holds still so the reel can actually be watched / clicked.
const FLIP_SHARE = 0.55;

// Scroll wheels move in jumpy steps; running progress through a soft spring
// irons those steps out so the phone glides instead of ticking round.
const SMOOTH = { stiffness: 45, damping: 18, mass: 0.9, restDelta: 0.0001 };

// How thick the phone is, and how many metal slices build that thickness.
// Stacking thin rounded slices is what gives the rounded edges real volume
// in CSS 3D — flat side faces can't follow a rounded corner.
const DEPTH_PX = 22;
const SLICES = 9;

// The resting pose: turned slightly away and tipped, like a product shot,
// rather than dead-on (which would read as a flat rectangle).
const REST = { rx: 6, ry: -16, rz: -4 };

// Must match .phone-stage's `perspective`. The screen sits DEPTH_PX / 2 in
// front of the rig's centre, so perspective magnifies it slightly; watching
// mode scales by the inverse so the video lands exactly 1:1 on screen.
const PERSPECTIVE_PX = 1600;
const FULL_SCALE = (PERSPECTIVE_PX - DEPTH_PX / 2) / PERSPECTIVE_PX;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Works out where the phone is in its choreography for a given scroll state.
 *
 * `approach` (0 → 1) covers the phone scrolling up into view: it arrives
 * showing its back, spins round and settles into the rest pose.
 * `progress` (0 → 1) covers the pinned section: each reel gets an equal
 * slice; the tail of each slice is a full 360° spin, and the screen content
 * swaps at the halfway point, when the back of the phone faces the viewer and
 * the screen is hidden — so the change is never seen happening.
 */
function computePose(approach, progress, total) {
  const e = easeOut(clamp01(approach));
  const entry = {
    rx: lerp(28, REST.rx, e),
    ry: lerp(-200, REST.ry, e),
    rz: lerp(-22, REST.rz, e),
    scale: lerp(0.72, 1, e),
    y: lerp(90, 0, e),
  };

  const s = clamp01(progress) * total;
  const i = Math.min(total - 1, Math.floor(s));
  const f = s - i;
  const flipping = i < total - 1 && f > 1 - FLIP_SHARE;
  const t = flipping ? (f - (1 - FLIP_SHARE)) / FLIP_SHARE : 0;
  const k = easeInOut(t);
  const arc = Math.sin(Math.PI * k); // 0 → 1 → 0 across the flip

  return {
    rx: entry.rx + arc * 6,
    ry: entry.ry + (i + k) * 360,
    rz: entry.rz + arc * 5,
    scale: entry.scale * (1 - arc * 0.08),
    y: entry.y - arc * 24,
    index: t >= 0.5 ? i + 1 : i,
  };
}

export function PhoneShowreel({ videos }) {
  const total = videos.length;
  const trackRef = useRef(null);
  const reduced = useReducedMotion();

  const { scrollYProgress: rawApproach } = useScroll({
    target: trackRef,
    offset: ['start end', 'start start'],
  });
  const { scrollYProgress: rawProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });
  const approach = useSpring(rawApproach, SMOOTH);
  const progress = useSpring(rawProgress, SMOOTH);

  const stageRef = useRef(null);
  const sizerRef = useRef(null);
  // The phone is laid out at full watching size; `fit` shrinks it to its
  // resting size (see useRestFit for why it's done this way round).
  const fit = useRestFit(stageRef, sizerRef);

  const [scrollIndex, setScrollIndex] = useState(0);
  const syncIndex = (p) => {
    const next = computePose(1, p, total).index;
    setScrollIndex((current) => (current === next ? current : next));
  };

  const watch = useWatchMode({ reduced, onExit: () => syncIndex(progress.get()) });

  // While a reel is playing the channel is frozen: scrolling must not flip
  // away from (and kill) the video someone is watching.
  useMotionValueEvent(progress, 'change', (p) => {
    if (!watch.playingRef.current) syncIndex(p);
  });

  // Each transform key has exactly ONE driver — these combined values — and
  // nothing else animates them on .phone-rig. (An external MotionValue in
  // `style` silently overrides any animate/whileInView on the same key.)
  //
  // `focus` (0 -> 1) is watching mode: the phone straightens up, faces the
  // viewer square-on and grows to its full laid-out size (scale 1, where the
  // video is shown pixel-for-pixel). It's blended INTO that same single
  // driver rather than animated separately, for the reason above.
  const pose = (key) => ([a, p, f, k]) => {
    const base = reduced ? { ...REST, scale: 1, y: 0 } : computePose(a, p, total);
    const resting = { ...base, scale: base.scale * k };
    if (f <= 0) return resting[key];
    const upright = {
      rx: 0,
      // Nearest whole turn, so it straightens the short way round.
      ry: Math.round(base.ry / 360) * 360,
      rz: 0,
      scale: FULL_SCALE,
      y: 0,
    };
    return lerp(resting[key], upright[key], f);
  };
  const inputs = [approach, progress, watch.focus, fit];
  const rotateX = useTransform(inputs, pose('rx'));
  const rotateY = useTransform(inputs, pose('ry'));
  const rotateZ = useTransform(inputs, pose('rz'));
  const scale = useTransform(inputs, pose('scale'));
  const y = useTransform(inputs, pose('y'));

  // Floor shadow shrinks and fades as the phone lifts during a flip, and
  // disappears in watching mode (the phone covers it anyway).
  const shadowScale = useTransform(y, [-40, 0, 90], [0.7, 1, 0.6]);
  const shadowOpacity = useTransform([y, watch.focus], ([yy, f]) => {
    const base = yy < 0 ? lerp(0.7, 0.35, Math.min(1, -yy / 40)) : lerp(0.7, 0, Math.min(1, yy / 90));
    return base * (1 - f);
  });

  const { playing, session } = watch;
  const enterFocus = watch.enter;
  const exitFocus = watch.exit;

  // Clamped in case a video is deleted while the page hasn't scrolled since.
  const index = Math.min(scrollIndex, total - 1);
  const activeVideo = videos[index];

  const trackHeight = Math.min(MAX_TRACK_VH, Math.max(MIN_TRACK_VH, total * VH_PER_REEL));
  const sliceStep = DEPTH_PX / (SLICES + 1);

  return (
    <div ref={trackRef} className="phone-track" style={{ height: `${trackHeight}vh` }}>
      <div className={`phone-sticky${playing ? ' is-watching' : ''}`}>
        {/* Dims the page around the phone in watching mode; click to leave. */}
        <AnimatePresence>
          {playing && (
            <motion.div
              className="phone-backdrop"
              onClick={exitFocus}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {playing && (
            <motion.button
              className="btn-icon phone-close"
              onClick={exitFocus}
              aria-label="Close video"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.4, ease: EASE, delay: 0.3 } }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            >
              <X size={20} />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="phone-layout">
          <div className="phone-info">
            <span className="phone-format">Vertical · 9:16</span>
            <span className="phone-counter">
              {String(index + 1).padStart(2, '0')}
              <span className="section-kicker-total">/{String(total).padStart(2, '0')}</span>
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeVideo.id}
                className="phone-meta"
                initial={reduced ? undefined : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                {activeVideo.category && <span className="phone-chip">{activeVideo.category}</span>}
                <p className="phone-title">{activeVideo.title || 'Untitled reel'}</p>
              </motion.div>
            </AnimatePresence>
            <p className="phone-hint">{total > 1 ? 'Scroll to flip to the next reel' : 'Tap the screen to play'}</p>
          </div>

          <div ref={stageRef} className="phone-stage">
            <div ref={sizerRef} className="phone-sizer" aria-hidden="true" />
            <motion.div
              className="phone-floor-shadow"
              aria-hidden="true"
              style={{ scaleX: shadowScale, opacity: shadowOpacity }}
            />

            <div className="phone-float">
              <motion.div className="phone-rig" style={{ rotateX, rotateY, rotateZ, scale, y }}>
                {/* The metal frame: thin rounded slices stacked through the
                    phone's thickness. */}
                {Array.from({ length: SLICES }, (_, n) => (
                  <div
                    key={n}
                    className="phone-slice"
                    aria-hidden="true"
                    style={{ transform: `translateZ(${-DEPTH_PX / 2 + sliceStep * (n + 1)}px)` }}
                  />
                ))}

                {/* Side buttons sit on the frame edge, standing out from it. */}
                <span className="phone-btn phone-btn-action" aria-hidden="true" />
                <span className="phone-btn phone-btn-vol-up" aria-hidden="true" />
                <span className="phone-btn phone-btn-vol-down" aria-hidden="true" />
                <span className="phone-btn phone-btn-power" aria-hidden="true" />

                <div className="phone-back" aria-hidden="true" style={{ transform: `rotateY(180deg) translateZ(${DEPTH_PX / 2}px)` }}>
                  <div className="phone-camera">
                    <span />
                    <span />
                    <span className="phone-flash" />
                  </div>
                  <span className="phone-back-mark">YC</span>
                </div>

                <div className="phone-front" style={{ transform: `translateZ(${DEPTH_PX / 2}px)` }}>
                  <div className="phone-screen">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${activeVideo.id}-${session}`}
                        className="phone-channel"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <VideoCard video={activeVideo} flat onPlay={enterFocus} />
                      </motion.div>
                    </AnimatePresence>
                    <div className="phone-notch" aria-hidden="true" />
                    <div className="phone-glare" aria-hidden="true" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="phone-dots" aria-hidden="true">
            {videos.map((video, n) => (
              <span key={video.id} className={n === index ? 'is-active' : undefined} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
