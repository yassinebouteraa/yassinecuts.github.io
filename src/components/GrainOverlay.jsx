/**
 * A faint, page-wide film-grain texture so the whole site — not just the
 * hero — reads as cinematic rather than "dark website with a nice banner."
 * Fixed, pointer-events: none, and far too subtle to affect legibility.
 */
export function GrainOverlay() {
  return <div className="grain-overlay" aria-hidden="true" />;
}
