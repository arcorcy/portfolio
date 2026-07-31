/**
 * The grid. Two behaviours, because the two sections it crosses scroll in
 * completely different ways, and one element cannot do both.
 *
 * `Mesh` wraps the Works run: the grid is absolute inside the wrapper, so it
 * travels with the cards and starts exactly where the run starts. It fades in
 * down its own top edge rather than on scroll, which is what softens the join
 * with the hero.
 *
 * `MeshLocked` goes in the pinned dark section: the grid is sticky, so it holds
 * still in the viewport while the section scrolls past it. Sticky and not fixed,
 * because a fixed layer would keep painting over whatever else is on screen,
 * while a sticky one cannot leave the section it belongs to.
 *
 * Both paint above their section's own background, so any content inside has to
 * carry `relative z-10`.
 */

/* A fifteenth of the viewport, so there are fifteen columns at any desktop
   width, with a floor that stops the squares turning into a weave on a phone. */
const CELL = 'max(48px, 6.6667vw)'

const LINES = [
  'linear-gradient(to right, var(--color-mesh) 1px, transparent 1px)',
  'linear-gradient(to bottom, var(--color-mesh) 1px, transparent 1px)',
].join(', ')

const PAPER = {
  backgroundImage: LINES,
  backgroundSize: `${CELL} ${CELL}`,
}

// Nothing at the very top, full strength a quarter of the way down.
const TOP_FADE = 'linear-gradient(to bottom, transparent 0%, #000 26%)'

export default function Mesh({ children }) {
  return (
    /* The gap before the dark section is padding here rather than a margin on
       the section itself, so the grid covers it: a margin would fall outside
       the wrapper and leave a bare band above the black. */
    <div className="relative pb-[15svh]">
      {children}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{ ...PAPER, maskImage: TOP_FADE, WebkitMaskImage: TOP_FADE }}
      />
    </div>
  )
}

export function MeshLocked() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      <div className="sticky top-0 h-svh w-full" style={PAPER} />
    </div>
  )
}
