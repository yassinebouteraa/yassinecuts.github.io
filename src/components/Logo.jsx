/**
 * The YassineCuts mark: a "Y" sliced through on a diagonal (a cut, like an
 * edit point) with an orange full stop. Traced from the 1080×1080 brand
 * file, so the geometry matches it exactly; the viewBox crops to the mark.
 *
 * The letter uses `currentColor` (cream by default via CSS), the dot is
 * always brand orange.
 */
export function Logo({ size = 28, className, title }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="210 240 640 640"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        fill="currentColor"
        d="M225 254H406L527 544H533L654 254H833L685 529L396 569Z"
      />
      <path fill="currentColor" d="M501 604L749 570L692 676V866H541V678Z" />
      <circle cx="786" cy="820" r="46" fill="var(--brand-orange, #FF5A1F)" />
    </svg>
  );
}
