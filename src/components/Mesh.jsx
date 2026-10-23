/**
 * The grid. Two behaviours, because the two sections it crosses scroll in
 * completely different ways, and one element cannot do both.
 *
 * `Mesh` wraps the Works run. Works pins its row now, so the grid holds still
 * in the viewport the way the locked one does, sticky inside a layer the size
 * of the wrapper: a grid scrolling past cards that are not moving read as the
 * page sliding under them. It still starts exactly where the run starts, and
 * fades in down the wrapper's top edge rather than on scroll, which is what
 * softens the join with the hero. The fade is in svh and not in percent, the
 * wrapper being several screens tall now: a quarter of it would have kept the
 * grid faded through most of the pin.
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

// Nothing at the very top of the wrapper, full strength a third of a screen down.
const TOP_FADE = 'linear-gradient(to bottom, transparent 0, #000 35svh)'

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
        style={{ maskImage: TOP_FADE, WebkitMaskImage: TOP_FADE }}
      >
        <div className="sticky top-0 h-svh w-full" style={PAPER} />
      </div>
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
