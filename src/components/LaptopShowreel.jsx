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

import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { useRestFit, useWatchMode } from '../hooks/useWatchMode.js';
import { VideoCard } from './VideoCard.jsx';
import { EASE } from './motion/variants.js';

// Scroll budget for the whole sequence, scaled by reel count and capped both
// ways so two reels don't feel instant and thirty don't drag forever.
const VH_PER_REEL = 150;
const MIN_TRACK_VH = 400;
const MAX_TRACK_VH = 1500;

// Same soft spring as the phone: irons out jumpy scroll-wheel steps.
const SMOOTH = { stiffness: 45, damping: 18, mass: 0.9, restDelta: 0.0001 };

// Lid angle, measured from upright: -90 is shut flat on the keyboard, 0 is
// straight up, positive leans back. Open sits a little past upright, like a
// laptop actually in use.
const LID_CLOSED = -90;
const LID_OPEN = 16;

// The resting viewpoint: from slightly above (so the keyboard shows) and
// turned to a three-quarter angle, like the reference product shot.
const REST = { rx: -20, ry: -24 };

// Thickness of the lid and the base, in slices (see the phone for why).
const LID_SLICES = 4;
const LID_DEPTH_PX = 9;
const BASE_SLICES = 6;
const BASE_DEPTH_PX = 16;

// Keyboard rows: each number is a key's relative width.
const KEY_ROWS = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.6],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.1],
  [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.8],
  [2.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.3],
  [1, 1, 1, 1.3, 5.6, 1.3, 1, 1, 1],
];

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Where the laptop is in its choreography.
 *
 * `approach` (0 → 1) covers the laptop scrolling up into view: it arrives
 * shut, turning toward the viewer, and the lid swings open over the second
 * half of the approach — so it's fully open by the time it pins in place.
 * `progress` (0 → 1) covers the pinned section, where it turns very slowly
 * so it never sits there as a flat picture.
 */
function computePose(approach, progress, turn = 1) {
  const a = clamp01(approach);
  const arrive = 1 - (1 - a) ** 3;
  const open = easeInOut(clamp01((a - 0.35) / 0.65));
  return {
    rx: lerp(-38, REST.rx, arrive),
    ry: (lerp(-60, REST.ry, arrive) + progress * 22) * turn,
    y: lerp(140, 0, arrive),
    scale: lerp(0.8, 1, arrive),
    lid: lerp(LID_CLOSED, LID_OPEN, open),
  };
}

export function LaptopShowreel({ videos }) {
  const total = videos.length;
  const trackRef = useRef(null);
  const reduced = useReducedMotion();
  // On phones the three-quarter turn swings the deck's front corner off the
  // edge of the screen, so the laptop turns half as far there.
  const narrow = useMediaQuery('(max-width: 640px)');

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
  // Laid out at full watching size, shrunk to the resting size by `fit` —
  // see useRestFit for why (it's what keeps the picture sharp).
  const fit = useRestFit(stageRef, sizerRef, 'width');

  const [scrollIndex, setScrollIndex] = useState(0);
  const syncIndex = (p) => {
    const next = Math.min(total - 1, Math.max(0, Math.floor(p * total)));
    setScrollIndex((current) => (current === next ? current : next));
  };
  const watch = useWatchMode({ reduced, onExit: () => syncIndex(rawProgress.get()) });

  // Frozen while a video is playing, so scrolling can't swap the video out
  // from under someone who's watching. Reads the raw (unsmoothed) progress
  // so the swap lands exactly where the reel's scroll slice begins.
  useMotionValueEvent(rawProgress, 'change', (p) => {
    if (!watch.playingRef.current) syncIndex(p);
  });

  // One driver per transform key, per element (an external MotionValue in
  // `style` silently overrides any other animation of that key):
  //   .laptop-rig   → scale + y        (origin: centre of the screen)
  //   .laptop-pivot → rotateX/rotateY  (origin: the hinge)
  //   .laptop-lid   → rotateX          (origin: the hinge)
  // Rig and pivot are split because watching mode needs to scale around
  // the screen's centre but rotate around the hinge.
  //
  // Watching mode (`focus` → 1): the pivot tips back by exactly the lid's
  // angle, cancelling it out, so the screen faces the viewer perfectly flat
  // at scale 1 — the video lands pixel-for-pixel, no blur.
  const inputs = [approach, progress, watch.focus, fit];
  const pose = (a, p) =>
    reduced
      ? { rx: REST.rx, ry: REST.ry * (narrow ? 0.5 : 1), y: 0, scale: 1, lid: LID_OPEN }
      : computePose(a, p, narrow ? 0.5 : 1);

  const rotateX = useTransform(inputs, ([a, p, f]) => lerp(pose(a, p).rx, -LID_OPEN, f));
  const rotateY = useTransform(inputs, ([a, p, f]) => lerp(pose(a, p).ry, 0, f));
  const lidAngle = useTransform(inputs, ([a, p, f]) => lerp(pose(a, p).lid, LID_OPEN, f));
  // At rest the laptop is lifted by a share of its resting width, so the
  // screen + keyboard together sit centred rather than the screen alone.
  const y = useTransform(inputs, ([a, p, f, k]) => {
    const lift = -(stageRef.current?.offsetWidth ?? 0) * k * 0.16;
    return lerp(pose(a, p).y + lift, 0, f);
  });
  const scale = useTransform(inputs, ([a, p, f, k]) => lerp(pose(a, p).scale * k, 1, f));

  // The screen wakes up once the lid is most of the way open.
  const screenOn = useTransform(lidAngle, [-25, LID_OPEN], [0, 1]);

  const index = Math.min(scrollIndex, total - 1);
  const activeVideo = videos[index];

  const trackHeight = Math.min(MAX_TRACK_VH, Math.max(MIN_TRACK_VH, total * VH_PER_REEL));
  const lidStep = LID_DEPTH_PX / (LID_SLICES + 1);
  const baseStep = BASE_DEPTH_PX / (BASE_SLICES + 1);

  return (
    <div ref={trackRef} className="laptop-track" style={{ height: `${trackHeight}vh` }}>
      <div className={`laptop-sticky${watch.playing ? ' is-watching' : ''}`}>
        {/* Dims the page around the laptop in watching mode; click to leave. */}
        <AnimatePresence>
          {watch.playing && (
            <motion.div
              className="phone-backdrop"
              onClick={watch.exit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {watch.playing && (
            <motion.button
              className="btn-icon phone-close"
              onClick={watch.exit}
              aria-label="Close video"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.4, ease: EASE, delay: 0.3 } }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            >
              <X size={20} />
            </motion.button>
          )}
        </AnimatePresence>

        <div ref={stageRef} className="laptop-stage">
          <div ref={sizerRef} className="laptop-sizer" aria-hidden="true" />

          <motion.div className="laptop-rig" style={{ scale, y }}>
            <motion.div className="laptop-pivot" style={{ rotateX, rotateY }}>
              {/* The base: a horizontal slab hinged at the back edge of the
                  screen, reaching toward the viewer. */}
              <div className="laptop-base">
                {Array.from({ length: BASE_SLICES }, (_, n) => (
                  <div
                    key={n}
                    className="laptop-base-slice"
                    aria-hidden="true"
                    style={{ transform: `translateZ(${-baseStep * (n + 1)}px)` }}
                  />
                ))}
                <div
                  className="laptop-base-bottom"
                  aria-hidden="true"
                  style={{ transform: `rotateY(180deg) translateZ(${BASE_DEPTH_PX}px)` }}
                />
                <div className="laptop-deck" aria-hidden="true">
                  <div className="laptop-keyboard">
                    {KEY_ROWS.map((row, r) => (
                      <div key={r} className="laptop-key-row">
                        {row.map((width, k) => (
                          <span key={k} style={{ flexGrow: width }} />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="laptop-trackpad" />
                </div>
              </div>

              {/* The lid, hinged at its bottom edge. */}
              <motion.div className="laptop-lid" style={{ rotateX: lidAngle }}>
                {Array.from({ length: LID_SLICES }, (_, n) => (
                  <div
                    key={n}
                    className="laptop-lid-slice"
                    aria-hidden="true"
                    style={{ transform: `translateZ(${-lidStep * (n + 1)}px)` }}
                  />
                ))}
                <div
                  className="laptop-lid-back"
                  aria-hidden="true"
                  style={{ transform: `rotateY(180deg) translateZ(${LID_DEPTH_PX}px)` }}
                >
                  <span>YC</span>
                </div>

                <div className="laptop-display">
                  <span className="laptop-camera" aria-hidden="true" />
                  <div className="laptop-screen">
                    <motion.div className="laptop-power" style={{ opacity: screenOn }}>
                      {/* A plain crossfade between reels — no glitch. */}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${activeVideo.id}-${watch.session}`}
                          className="laptop-channel"
                          initial={reduced ? undefined : { opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={reduced ? undefined : { opacity: 0 }}
                          transition={{ duration: 0.35, ease: EASE }}
                        >
                          <VideoCard video={activeVideo} flat onPlay={watch.enter} />
                        </motion.div>
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        <div className="laptop-footer">
          <span className="phone-format">Horizontal · 16:9</span>
          <span className="laptop-counter">
            {String(index + 1).padStart(2, '0')}
            <span className="section-kicker-total">/{String(total).padStart(2, '0')}</span>
          </span>
          <p className="laptop-hint">{total > 1 ? 'Scroll for the next edit · click to play' : 'Click to play'}</p>
        </div>
      </div>
    </div>
  );
}
