/**
 * The geometry and the timing behind the pinned sequence in Process.jsx.
 * Kept out of the component because none of it touches React: it is pure
 * arithmetic over the step data, which also makes it checkable on its own.
 */

/* Every icon lives in a wrapper this wide, as a percentage of the square
   composition box, and reaches its real size through `scale`. Animating scale
   rather than width keeps the sequence off the layout path entirely. */
export const BASE = 40

/* A card centre, given as a percentage of the composition box, restated as the
   translation that puts the wrapper there.

   A percentage translation resolves against the element's own box, and that
   box is BASE percent of the composition, so the conversion is a fixed ratio
   with no pixels in it. That is the point: the arrangement needs no measuring,
   survives any resize on its own, and never waits on an observer. */
export function offset(v) {
  return `${((v - BASE / 2) * 100) / BASE}%`
}

/* The drawn card fills 82.3% of its 512 viewBox, measured from the path data
   rather than guessed, so the link arcs stop at the ink and not at the
   invisible bounding box. GAP is the breathing room after that, in the same
   0 to 100 units as the composition. */
const INK = 0.823
const GAP = 2

/* The beats inside one step, as a fraction of its own screen of scroll: the
   text fades in, the words light up one by one, the step holds, the text
   leaves. Every step gets the same rhythm, including the first and the last. */
const FADE_IN = 0.1
const WORDS = [0.05, 0.62]
const FADE_OUT = 0.9

// How far a step's text travels as it comes and goes, in pixels.
const LIFT = 28

/* The composition starts rearranging slightly before the text it belongs to
   has finished leaving. That overlap is what keeps the two halves reading as
   one animation instead of two widgets taking turns. */
const LEAD = 0.12

/* Which step the composition should be showing at a given scroll progress. */
export function stepAt(progress, count) {
  return Math.max(0, Math.min(count - 1, Math.floor(progress * count + LEAD)))
}

/* One entry per icon per step.

   An icon that takes no part in a step keeps the position it had, or borrows
   the one it is about to have, and only fades out. Nothing ever slides in from
   a corner, and an icon that comes back finds itself where it was left. */
export function resolveTracks(steps) {
  const ids = [...new Set(steps.flatMap((step) => step.icons.map((icon) => icon.id)))]

  return ids.map((id) => {
    const own = steps.map((step) => step.icons.find((icon) => icon.id === id) ?? null)

    const frames = own.map((entry, i) => {
      if (entry) return { ...entry, visible: true }

      let near = null
      for (let d = 1; d < steps.length && !near; d += 1) {
        near = own[i - d] ?? own[i + d] ?? null
      }
      return { ...(near ?? { x: 50, y: 50, size: BASE, rot: 0 }), visible: false }
    })

    return { id, frames }
  })
}

/* A quadratic arc from the edge of one card to the edge of the other. For an
   axis-aligned square the distance from centre to edge along a direction is
   half the side divided by the larger of the two direction components, which
   is why the arc hugs the card whatever angle it leaves at. */
export function arcPath(a, b, bow) {
  if (!a || !b) return null

  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  if (!len) return null

  const ux = dx / len
  const uy = dy / len
  const reach = (card) =>
    (card.size * INK) / 2 / Math.max(Math.abs(ux), Math.abs(uy)) + GAP

  const from = reach(a)
  const to = reach(b)
  // Two cards close enough to touch get no arc rather than a backwards one.
  if (from + to >= len) return null

  const sx = a.x + ux * from
  const sy = a.y + uy * from
  const ex = b.x - ux * to
  const ey = b.y - uy * to

  /* The bend is a fraction of the arc that actually gets drawn, not of the
     distance between the two centres. Two cards can sit far apart and still
     leave a short gap between their edges, and scaling off the centres there
     would hook the line right back on itself. */
  const span = Math.hypot(ex - sx, ey - sy)
  const cx = (sx + ex) / 2 - uy * span * bow
  const cy = (sy + ey) / 2 + ux * span * bow

  return `M${sx.toFixed(2)} ${sy.toFixed(2)} Q${cx.toFixed(2)} ${cy.toFixed(2)} ${ex.toFixed(2)} ${ey.toFixed(2)}`
}

/* Where a step's text fades, and which slice of scroll lights each of its
   paragraphs. Returned in the 0 to 1 range of the whole sequence.

   The two ends of the sequence do not fade. The first step is already on screen
   when the section arrives, because the pinned panel is in view for a whole
   screen before it starts pinning and an empty column next to a composition is
   just a hole. The last step stays until the section leaves, for the same
   reason at the other end. */
export function stepTiming(index, count, paragraphs) {
  const band = 1 / count
  const start = index * band
  const end = start + band
  const at = (t) => start + t * band

  const first = index === 0
  const last = index === count - 1

  let fade
  let opacity
  let lift

  if (first && last) {
    fade = [start, end]
    opacity = [1, 1]
    lift = [0, 0]
  } else if (first) {
    fade = [start, at(FADE_OUT), end]
    opacity = [1, 1, 0]
    lift = [0, 0, -LIFT]
  } else if (last) {
    fade = [start, at(FADE_IN), end]
    opacity = [0, 1, 1]
    lift = [LIFT, 0, 0]
  } else {
    fade = [start, at(FADE_IN), at(FADE_OUT), end]
    opacity = [0, 1, 1, 0]
    lift = [LIFT, 0, 0, -LIFT]
  }

  const lengths = paragraphs.map((text) => text.split(' ').length)
  const total = lengths.reduce((a, b) => a + b, 0)
  // The first step's words start lighting the moment the section is scrolled
  // into, since its text never had an entrance to wait for.
  const from = first ? start : at(WORDS[0])
  const span = at(WORDS[1]) - from

  let used = 0
  const ranges = lengths.map((n) => {
    const head = from + (used / total) * span
    used += n
    return [head, from + (used / total) * span]
  })

  return { fade, opacity, lift, ranges }
}

/* Splits a 0 to 1 progress between the paragraphs of one step, by length, so
   the second starts lighting where the first finishes.

   Used by the flowed layout, where each step block owns its own progress rather
   than a slice of the whole sequence. The whole window is used by default: the
   window itself is already positioned so the writing starts and ends where it
   should on screen, so there is nothing left to trim here. */
export function paragraphRanges(paragraphs, lit = 1) {
  const lengths = paragraphs.map((text) => text.split(' ').length)
  const total = lengths.reduce((a, b) => a + b, 0)

  let used = 0
  return lengths.map((n) => {
    const head = (used / total) * lit
    used += n
    return [head, (used / total) * lit]
  })
}
