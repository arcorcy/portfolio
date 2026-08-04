import { Fragment, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion, useSpring } from 'framer-motion'
import { EASE, HIDDEN_Y } from '../lib/motion.jsx'
import { hero, profile } from '../data/content.js'
import profileImg from '../img/profil.jpg'

/* The lime block gets its height from the line height, not from padding on the
   span: the height is then the line box itself, so stacked blocks meet without a
   seam and a single one can never be taller than its line. 1.3 also spaces the
   lines the way the mock does. */
const CLAIM_LEADING = 'leading-[1.3]'

/* A line, which is only a line: no clipping here.

   The mask is per word, not per line. A mask on the line only holds while the
   line holds exactly one visual line, and the claim now wraps on a phone: its
   first words would park inside their own line's box, right on top of the words
   below, and be read before their turn. A word cannot wrap, so a mask on the
   word survives any wrap without knowing where it happens. */
function Line({ children, className = '' }) {
  return <span className={`block ${className}`}>{children}</span>
}

/* The window a word rises through.

   clip-path rather than overflow: overflow on an inline-block moves its baseline
   to the bottom margin edge, which would lift every word off the strut and take
   the line's spacing with it. The clip does the same job and leaves layout
   alone, which also means it can open as wide as it likes.

   0.22em under the box for the descenders, which fall 0.255em below a baseline
   that sits 0.14em inside the box. 1.5em over it because the portrait stands
   taller than the line it sits on, and the old mask was cutting its crown. */
const CLIP = 'inset(-1.5em -0.25em -0.22em -0.25em)'

function Word({ children, delay, reduce, className = '', maskRef }) {
  return (
    <span ref={maskRef} className="inline-block" style={{ clipPath: CLIP }}>
      <motion.span
        className={`inline-block whitespace-pre ${className}`}
        initial={{ y: reduce ? 0 : HIDDEN_Y, opacity: reduce ? 0 : 1 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{ duration: 1, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  )
}

/* ------------------------------------------------------------------
   The portrait, and the tag that rides its rim.

   The tag is fixed and portalled out to the body rather than placed beside the
   image, and it has to be: the word this portrait sits in carries a clip-path,
   and a clip-path on an ancestor clips a fixed descendant exactly as it clips an
   ordinary one. Out at the body nothing can cut it. Experience's refusal tip is
   out for the same reason.

   It follows the pointer only around the rim. The angle from the centre of the
   circle to the pointer decides where on the edge it sits, so it never covers the
   face and never wanders off over the claim underneath.

   Upright, always, with the anchor swapping sides across the vertical axis so the
   tag grows away from the portrait instead of back over it. Laid along the radius
   or along the tangent it would stand on its end at the top and the bottom of the
   circle, which is a label nobody can read: what it does instead is lean a few
   degrees with the rim, which is enough to read as orienting itself.

   The portrait is the link, not the tag. The tag sits outside the circle, so a
   pointer on the photo is never on the tag and never could be: it is the
   affordance, and the thing under the pointer is what takes the click.
   ------------------------------------------------------------------ */
const RIM_GAP = 10 // px between the circle's edge and the tag
const TILT_MAX = 9 // degrees of lean, kept well short of unreadable
const RIDE = { stiffness: 320, damping: 26, mass: 0.55 }

function pin(v, limit) {
  return Math.max(-limit, Math.min(limit, v))
}

/* Where the tag goes for a pointer at px, py: the point on the rim in that
   direction, which side it should grow towards, and how much it leans. */
function onRim(rect, px, py) {
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const radius = rect.width / 2
  const dx = px - cx
  const dy = py - cy
  // A pointer exactly on the centre has no direction: park it at three o'clock
  // rather than divide by nothing.
  const reach = Math.hypot(dx, dy) || 1
  const out = radius + RIM_GAP

  return {
    x: cx + (dx / reach) * out,
    y: cy + (dy / reach) * out,
    left: dx < 0,
    tilt: pin((dy / radius) * TILT_MAX, TILT_MAX),
  }
}

function PhotoTag({ reduce }) {
  const photo = useRef(null)
  const [live, setLive] = useState(false)
  const [left, setLeft] = useState(false)

  const x = useSpring(0, RIDE)
  const y = useSpring(0, RIDE)
  const tilt = useSpring(0, RIDE)

  /* Placed from the rect read at the moment of the move, never from one measured
     once: the page scrolls under this portrait, so a cached centre would be wrong
     by however far it has travelled. */
  function put(px, py, jump = false) {
    const el = photo.current
    if (!el) return
    const spot = onRim(el.getBoundingClientRect(), px, py)
    const lean = reduce ? 0 : spot.tilt

    if (jump) {
      x.jump(spot.x)
      y.jump(spot.y)
      tilt.jump(lean)
    } else {
      x.set(spot.x)
      y.set(spot.y)
      tilt.set(lean)
    }
    setLeft(spot.left)
  }

  // Focus has no pointer, so the tag takes the rim at three o'clock.
  function park() {
    const el = photo.current
    if (!el) return
    const r = el.getBoundingClientRect()
    put(r.right + r.width, r.top + r.height / 2, true)
  }

  return (
    <>
      <a
        ref={photo}
        href={profile.linkedin}
        target="_blank"
        rel="noreferrer"
        aria-label={hero.photoTag}
        data-cursor="link"
        /* The em box is unchanged from when this was a bare image: the alignment
           and the leading margin move up to the anchor and the image fills it, so
           the circle is still exactly 1.2em and still one of the four terms the
           type's size divisor is measured from. */
        className="ml-[0.1em] inline-block rounded-full align-[-0.17em]"
        onPointerEnter={(e) => {
          setLive(true)
          put(e.clientX, e.clientY, true)
        }}
        onPointerMove={(e) => live && put(e.clientX, e.clientY)}
        onPointerLeave={() => setLive(false)}
        onFocus={() => {
          setLive(true)
          park()
        }}
        onBlur={() => setLive(false)}
      >
        <img
          src={profileImg}
          alt=""
          className="block h-[1.2em] w-[1.2em] rounded-full object-cover"
        />
      </a>

      {createPortal(
        <AnimatePresence>
          {live && (
            <motion.div
              className="pointer-events-none fixed left-0 top-0 z-[80]"
              style={{ x, y }}
            >
              <div className={`-translate-y-1/2 ${left ? '-translate-x-full' : ''}`}>
                <motion.span
                  className="block whitespace-nowrap rounded-full bg-lime px-4 py-2 text-sm font-bold text-ink"
                  style={{ rotate: tilt }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  {hero.photoTag}
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}

/* The lime rides on each word rather than on the run as a whole, so a wrapped
   accent puts a block behind each of its lines instead of one rectangle with
   empty corners.

   The spaces stay outside the words, where they collapse at a line break and so
   cannot leave a lime tail hanging past the end of a line. Inside a line they are
   pulled to nothing by word-spacing, which is the only thing that can close the
   seam: the side padding cannot, since padding sits inside the box while the space
   is the distance between two boxes, measured at 0.164em here. Anything past
   -0.164em lands on the same result, the advance of a space being clamped at zero,
   so the value only has to clear the measurement.

   The known cost: the words end up 0.28em apart on their own padding instead of
   the 0.164em they had as a single run. Closing that would mean halving the
   padding, and the block would lose the 0.14em it sits past the first and last
   glyph, which is the more visible of the two.

   Side padding in em, so it holds its proportion at every step of the size. */
function Accent({ reduce, endRef }) {
  const words = hero.claim.accent.split(' ')

  return (
    <span className="[word-spacing:-0.2em]">
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <Word
            delay={0.52 + i * 0.06}
            reduce={reduce}
            className="bg-lime px-[0.14em] text-ink"
            maskRef={i === words.length - 1 ? endRef : undefined}
          >
            {word}
          </Word>
        </Fragment>
      ))}
    </span>
  )
}

/* The note hangs off the end of the accent rather than off the column, so its
   right edge and the asterisk it answers line up.

   That end is a text advance, which no CSS length knows, so it is measured. The
   mask box is the thing to measure: it is the word's own box and, unlike the span
   inside it, nothing ever transforms it, so the reveal cannot pollute the reading.
   One trigger on the column covers both terms, the type being sized off the
   column. fonts.ready catches the reflow when Manrope lands, since until then the
   width is the fallback's. The plain resize listener is not redundant with the
   observer: the observer only delivers at the end of a frame, so it is the one
   that reports a column that changed without the window doing so, while the
   listener is the one that fires where frames do not. */
function useAccentInset(column, end) {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const col = column.current
    if (!col || !end.current) return undefined

    const measure = () => {
      if (!col.isConnected || !end.current) return
      setInset(col.getBoundingClientRect().right - end.current.getBoundingClientRect().right)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(col)
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [column, end])

  return inset
}

export default function Hero() {
  const reduce = useReducedMotion()
  const greeting = hero.greeting.split(' ')
  const column = useRef(null)
  const accentEnd = useRef(null)
  const inset = useAccentInset(column, accentEnd)

  return (
    <section id="top" className="gutter relative flex min-h-svh flex-col justify-center py-28">
      {/* No 1400px cap here, unlike the other sections: that cap is what made the
          claim wrap on a wide screen, since the column stopped growing while the
          type carried on. */}
      {/* @container so the type can be sized off the column rather than off the
          viewport: below lg the size is the measure divided by the greeting's own
          width, and cqw is the one unit that already has the gutter and any
          scrollbar taken out of it. Its own width does not depend on the type. */}
      <div ref={column} className="@container relative z-10 w-full">
        <h1 className="display-xl">
          <Line>
            {greeting.map((word, i) => (
              <Word key={i} delay={0.25 + i * 0.06} reduce={reduce}>
                {word}{' '}
              </Word>
            ))}
            <Word delay={0.25 + greeting.length * 0.06} reduce={reduce}>
              <PhotoTag reduce={reduce} />
            </Word>
          </Line>

          {/* One declared line at every width, and it wraps where the measure
              says. There is no second copy for a phone any more: the lead used to
              be given a line of its own so the accent could start at the margin,
              which left "I'm an" alone on a line and broke the accent in two. The
              size below lg is set so the wrap falls after "product" instead, so
              the lead keeps company. */}
          <Line className={CLAIM_LEADING}>
            <Word delay={0.45} reduce={reduce}>
              {hero.claim.lead}{' '}
            </Word>
            <Accent reduce={reduce} endRef={accentEnd} />
          </Line>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, delay: 0.9, ease: EASE }}
          // marginRight rather than a width: the paragraph keeps its own measure
          // and simply stops where the accent stops.
          style={{ marginRight: inset }}
          className="ml-auto mt-10 max-w-[26rem] text-right text-[0.9375rem] leading-[1.6] text-ink lg:mt-14"
        >
          {hero.note}
        </motion.p>
      </div>
    </section>
  )
}
