import { Suspense, lazy } from 'react';

// vgpu is a large WebGPU/WebGL runtime, so the shard field is code-split out of
// the main bundle and streams in after the hero text has already painted.
const AeroShards = lazy(() => import('./backgrounds/AeroShards.jsx'));

/**
 * Animated shard field sitting behind the hero. It is decorative only:
 * aria-hidden, pointer-events none, self-pausing when scrolled out of view, and
 * it falls back to a flat backgroundColor if the GPU context cannot start.
 */
export function HeroBackground() {
  return (
    <div className="hero-shards">
      <Suspense fallback={null}>
        <AeroShards
          backgroundColor="#120F17"
          shardColor="#896ABD"
          accentColor="#A855F7"
          placement="full"
          flow="stream"
          material="pearl"
          detail="balanced"
          effect="none"
          scale={1}
          spread={1}
          depth={1}
          speed={1}
          spin={1}
          interaction="repel"
          density={1.5}
          shardSize={1.1}
          stretch={1}
          turbulence={1}
          glow={1}
          edgeSoftness={2}
          bloom={0.5}
          grain={0.05}
          chromaticAberration={0.0075}
          transitionDuration={1}
          interactionRadius={1.5}
          interactionStrength={0.5}
          rippleIntensity={1}
          holdToGather
          onError={(error) => {
            console.warn('AeroShards could not start; falling back to a flat hero background.', error);
          }}
        />
      </Suspense>
    </div>
  );
}
