/**
 * The window, shared by Works and Experiences.
 *
 * Both sections put things in draggable windows, and they have to behave the same
 * way rather than merely look alike, so the behaviour lives here once: the drag,
 * what it may not leave, how a throw decays, the lift on hover, and who sits on
 * top. Two copies of this drifted apart the first time.
 *
 * Nothing here rotates, floats or drifts with the scroll. A window is an object
 * on a desk, and a desk does not breathe.
 */
import { useRef, useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { EASE } from '../lib/motion.jsx'

/* Half the shot radius. A window frame at this size wants a tighter corner than a
   card does, and it is the same halving the case study cover uses. */
export const FRAME_RADIUS = 'rounded-[calc(var(--radius-shot)/2)]'

/* Framer's own drag momentum, at these sizes, carried a flick clear across the
   field. Lower power and a shorter time constant: a flick still glides, but only
   a little. */
const THROW = { power: 0.12, timeConstant: 200, bounceStiffness: 220, bounceDamping: 26 }

/* The slight lift under the pointer, and the one thing hover does to a window. */
const HOVER = { scale: 1.02 }
const LIFT = { duration: 0.4, ease: EASE }

/* ------------------------------------------------------------------
   The three buttons in the corner.

   None of them does anything, and that is the joke: they are there to be tried.
   All three are therefore the same switched-off colour. There used to be a lime
   one that opened the window full screen, and it earned the accent by being the
   only one that acted; now that nothing acts, a lime dot would only be one more
   place the accent turns up for nothing.
   ------------------------------------------------------------------ */
const DOTS = [
  { id: 'close', label: 'Close the window' },
  { id: 'minimize', label: 'Minimize the window' },
  { id: 'expand', label: 'Open the window full screen' },
]

export function Dots({ onRefuse, onRest, dark = false }) {
  return (
    /* self-center rather than the row's items-end: a tab strip is flush with the
       bottom of its own strip, and dots sitting on that line straddled the border
       under it. */
    <div className="flex shrink-0 items-center gap-1.5 self-center">
      {DOTS.map((dot) => (
        <button
          key={dot.id}
          type="button"
          aria-label={dot.label}
          /* aria-disabled rather than disabled: they stay reachable, so the tip
             can answer a keyboard too. */
          aria-disabled
          data-cursor="hover"
          onMouseEnter={onRefuse}
          onFocus={onRefuse}
          onMouseLeave={onRest}
          onBlur={onRest}
          className={`h-3 w-3 rounded-full transition-transform duration-300 hover:scale-110 ${
            dark ? 'bg-white/20' : 'bg-paper-deep'
          }`}
        />
      ))}
    </div>
  )
}

/* The tip is placed from the button's own box rather than guessed at. TIP_HEIGHT
   is not a guess either: it is this tip's own box, one line of text-sm at 20px on
   two lots of 0.5rem of padding, measured at 34px. EDGE is what it keeps off the
   viewport. */
const TIP_HEIGHT = 36
const TIP_GAP = 12
const EDGE = 8

export function Tip({ tip, children }) {
  const above = tip.side === 'above'

  return (
    <motion.p
      /* fixed, and outside the frame: a window clips its own corners, and above a
         button sitting in the chrome is above the window itself. */
      className="pointer-events-none fixed z-[110] whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm text-white"
      style={{
        left: tip.x,
        top: tip.y,
        x: above ? '-50%' : 0,
        y: above ? '-100%' : '-50%',
      }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      {children}
    </motion.p>
  )
}

/* Above the button where there is room, beside it where there is not. One of these
   serves a whole section: only one dot can be pointed at a time. */
export function useRefusalTip() {
  const [tip, setTip] = useState(null)

  function onRefuse(event) {
    const box = event.currentTarget.getBoundingClientRect()
    const above = box.top >= TIP_HEIGHT + TIP_GAP + EDGE

    setTip({
      side: above ? 'above' : 'beside',
      x: above ? box.left + box.width / 2 : box.right + TIP_GAP,
      y: above ? box.top - TIP_GAP : box.top + box.height / 2,
    })
  }

  return { tip, onRefuse, onRest: () => setTip(null) }
}

/* ------------------------------------------------------------------
   How far a window may be carried, as pixel offsets from where it sits.

   An object rather than the field ref. Given a ref, Framer measures the field's
   page box once and clamps against that, which goes wrong twice over: a pinned
   panel's page box moves when it pins, and a field that is display:none measures
   zero, at which point every window clamped into nothing lands on the same point
   and the arrangement comes back as a stack in the middle. offsetLeft and
   clientWidth, read after layout has settled, have neither problem.

   The Math.min / Math.max keep zero inside the interval whatever the field
   measures, so a viewport short enough for a window to be taller than the field
   cannot produce a range with its ends crossed, which Framer would answer by
   snapping the window off its own spot.
   ------------------------------------------------------------------ */
export function bounds(field, win) {
  return {
    left: Math.min(0, -win.offsetLeft),
    right: Math.max(0, field.clientWidth - win.offsetLeft - win.offsetWidth),
    top: Math.min(0, -win.offsetTop),
    bottom: Math.max(0, field.clientHeight - win.offsetTop - win.offsetHeight),
  }
}

/* ------------------------------------------------------------------
   The draggable shell.

   Positioned by the percentage point its centre sits at and pulled back by half
   its own size to land there, which keeps the arrangement independent of the
   field's size. x and y go through MotionValues the caller cannot see, on this
   layer alone: one owner of the transform per layer, or they fight.
   ------------------------------------------------------------------ */
export function Draggable({
  innerRef,
  left,
  top,
  width,
  height,
  zIndex,
  room,
  onFront,
  onDrag,
  onDragStart,
  onDragTransitionEnd,
  onEnter,
  onLeave,
  onClick,
  anchor = 'centre',
  cursor = 'hover',
  className = '',
  children,
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  return (
    <motion.div
      ref={innerRef}
      drag
      /* Only ever an object, and only while there is a field to measure: see
         bounds above for what a hidden or moving field does to a ref. */
      dragConstraints={room ?? false}
      dragElastic={0.16}
      dragMomentum
      dragTransition={THROW}
      onDragStart={onDragStart ?? onFront}
      onDrag={onDrag}
      onDragTransitionEnd={onDragTransitionEnd}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      whileHover={HOVER}
      transition={LIFT}
      data-cursor={cursor}
      style={{
        left,
        top,
        width,
        height,
        /* Centred on its point, which is what an experience window wants: it has
           a height in the data, so half of it can be given back. A works window
           takes its height from a shot that is never cropped, so there is no half
           to give and it is anchored by its top left corner instead. */
        marginLeft: anchor === 'centre' ? `calc(${width} * -0.5)` : undefined,
        marginTop: anchor === 'centre' && height ? `calc(${height} * -0.5)` : undefined,
        zIndex,
        x,
        y,
      }}
      className={`absolute cursor-grab shadow-[0_28px_60px_-28px_rgba(1,1,2,0.3)] active:cursor-grabbing ${FRAME_RADIUS} ${className}`}
    >
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------
   Which window sits on top.

   The resting order, and it persists: whichever window was last picked up stays
   above the others until another one is. A hover band on its own was not enough,
   since a fast drag leaves the pointer behind and the window fell back into the
   pile mid-throw.
   ------------------------------------------------------------------ */
export function useStack(initial) {
  const [order, setOrder] = useState(initial)
  const top = useRef(Math.max(...Object.values(initial)))

  function bringToFront(id) {
    top.current += 1
    setOrder((current) => ({ ...current, [id]: top.current }))
  }

  return { order, bringToFront }
}
