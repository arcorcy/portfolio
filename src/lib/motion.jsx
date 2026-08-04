import { Fragment, useRef } from 'react'
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from 'framer-motion'

export const EASE = [0.16, 1, 0.3, 1]

/* ------------------------------------------------------------------
   Headline — word-by-word mask reveal.
   Input: array of lines, one entry per visual line. No emphasis: the
   titles carry the information on their own.
   ------------------------------------------------------------------ */
/* The display sizes run a line-height near 1, tighter than the font's own
   glyph box, so descenders sit below the line box by roughly 0.17em. The mask
   has to reach that far down or it cuts the tail off every g, p and y. The
   padding opens the clip, the equal negative margin gives the space straight
   back so the layout height does not move, and the words start below the
   enlarged clip rather than below the line box. */
const MASK_ROOM = '0.22em'

/* Exported because the hero animates its own title on mount rather than on
   scroll, so it cannot use Headline, but it must not reinvent these two
   numbers: getting them wrong is how the descenders got cut. */
export const HIDDEN_Y = '128%'
export const maskStyle = { paddingBottom: MASK_ROOM, marginBottom: `-${MASK_ROOM}` }

/* Where the reveal is clipped, chosen by the `clip` prop.

   'line', the default, puts one mask on each declared line. That is right for as
   long as the line does not wrap: the mask cuts at the container box, so a word
   parked under its own line on a narrow screen stays inside the mask, lands on
   the next line's band, and is seen before its turn.

   'word' clips each word to its own box instead. A word cannot wrap, so a mask
   sitting on the word survives any wrapping without having to know where it
   falls. It is the hero's technique, there for the same reason, and it is what
   the two long sentences of the contact heading need, since those wrap on a
   laptop rather than only on a phone.

   clip-path and not overflow, again for the hero's reason: overflow on an
   inline-block moves its baseline to the bottom margin edge, which would drop
   every word off the strut. 0.22em below the box for the descenders, the same
   number MASK_ROOM uses, and 0.4em above it for the ascenders and for the accent
   Manrope puts over a capital. */
const WORD_CLIP = 'inset(-0.4em -0.25em -0.22em -0.25em)'

/* ------------------------------------------------------------------
   A title leaving the top of the screen.

   Measured on the title's own travel, never on its section's. Hung on the
   section, the exit lands at the end of that section, and a title sitting at the
   top of one is off screen long before: at 0.84 of the section's progress the
   heading had been gone for most of a screen, so nothing was ever seen to leave.

   0 is the title still comfortably in view, 1 is its last line crossing the top
   edge. On a 900px screen with a 68px heading that is about 250px of scrolling,
   which puts the fade exactly where the title tucks under the nav.

   Scroll driven rather than played once on a threshold, which is the whole reason
   scrolling back up brings it back instead of leaving it gone.
   ------------------------------------------------------------------ */
const EXIT_OFFSET = ['start 0.2', 'end 0']
const OUT_LIFT = -44

/* The box that is measured is not the box that moves: the wrapper keeps its
   layout position whatever the heading does, so the transform cannot feed back
   into the measurement it is derived from. */
function Leaving({ children }) {
  const box = useRef(null)
  const { scrollYProgress } = useScroll({ target: box, offset: EXIT_OFFSET })
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const y = useTransform(scrollYProgress, [0, 1], [0, OUT_LIFT])

  return (
    <div ref={box}>
      <motion.div style={{ opacity, y }}>{children}</motion.div>
    </div>
  )
}

export function Headline({
  lines,
  className = 'display-lg',
  delay = 0,
  stagger = 0.055,
  as: Tag = 'h2',
  shown,
  clip = 'line',
  exit = false,
}) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  /* The observer watches the heading, never the words. A word waiting to be
     revealed sits below the mask, and an element clipped out by an ancestor's
     overflow reports no intersection at all, so hanging whileInView on the
     words meant a heading that scrolled into view and never animated. It only
     ever worked because the words used to peek a hundredth of an em past the
     mask; widening the mask for the descenders took that sliver away. */
  const inView = useInView(ref, { once: true, amount: 0 })
  /* A caller can own the trigger instead of the observer: the Works title is
     first shown as a teaser inside the hero, on a timer rather than on the
     moment it enters view, and it is the same element either way. */
  const lit = shown ?? inView
  const perWord = clip === 'word'
  let i = -1

  const heading = (
    <Tag ref={ref} className={className}>
      {lines.map((line, li) => (
        <span
          key={li}
          className={perWord ? 'block' : 'block overflow-hidden'}
          style={perWord ? undefined : maskStyle}
        >
          {line.split(' ').map((word, wi) => {
            if (word === '') return null
            i += 1

            const travel = (
              <motion.span
                className="inline-block whitespace-pre"
                initial={false}
                animate={
                  reduce
                    ? { y: 0, opacity: lit ? 1 : 0 }
                    : { y: lit ? '0%' : HIDDEN_Y, opacity: 1 }
                }
                transition={{ duration: 1, delay: delay + i * stagger, ease: EASE }}
              >
                {/* The space rides inside the word when the mask is the line's,
                    and outside it when the mask is the word's: there it has to
                    sit between two clipped boxes, which is the only break
                    opportunity a row of inline-blocks has. */}
                {perWord ? word : `${word} `}
              </motion.span>
            )

            if (!perWord) return <Fragment key={`${li}-${wi}`}>{travel}</Fragment>

            return (
              <Fragment key={`${li}-${wi}`}>
                <span className="inline-block" style={{ clipPath: WORD_CLIP }}>
                  {travel}
                </span>{' '}
              </Fragment>
            )
          })}
        </span>
      ))}
    </Tag>
  )

  /* The exit is a wrapper and not a style on the heading, so it cannot fight what
     a caller already animates on its own layers: the Works title has an opacity
     of its own for the teaser's arrival. */
  if (!exit || reduce) return heading
  return <Leaving>{heading}</Leaving>
}

/* ------------------------------------------------------------------
   ScrollWords — a paragraph that lights up word by word as it crosses
   the viewport. Scroll position drives it directly, so scrubbing back
   up dims the words again.
   ------------------------------------------------------------------ */
// Words finish lighting at 90% of the travel, so the paragraph is fully
// readable before it starts leaving the screen.
const LIT_AT = 0.9

/* Words wrapped in braces in the copy are the accented ones. A brace can span
   several words, so the flag carries across tokens rather than being decided
   token by token, and the braces are stripped wherever they sit: that way a
   closing brace can follow the punctuation without swallowing it. */
function parseAccents(text) {
  let inside = false

  return text.split(' ').map((token) => {
    const opens = token.includes('{')
    const closes = token.includes('}')
    const accent = inside || opens

    if (opens && !closes) inside = true
    if (closes) inside = false

    return { word: token.replace(/[{}]/g, ''), accent }
  })
}

function Word({ children, progress, range, accent }) {
  const opacity = useTransform(progress, range, [0.16, 1])
  return (
    <motion.span
      style={{ opacity }}
      className={`inline-block whitespace-pre${accent ? ' text-lime' : ''}`}
    >
      {children}{' '}
    </motion.span>
  )
}

export function ScrollWords({ text, className = '', progress, range }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const own = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.45'],
  })

  const words = parseAccents(text)

  if (reduce) {
    return (
      <p ref={ref} className={className}>
        {words.map(({ word, accent }, i) => (
          <span key={i} className={accent ? 'text-lime' : undefined}>
            {word}{' '}
          </span>
        ))}
      </p>
    )
  }

  // A pinned section drives the words from its own progress and hands over the
  // slice of it that belongs to this paragraph, because the paragraph itself
  // never moves and so has no travel of its own to measure.
  const driven = progress != null
  const source = driven ? progress : own.scrollYProgress
  const [from, to] = driven ? range : [0, LIT_AT]
  const span = to - from

  return (
    <p ref={ref} className={className}>
      {words.map(({ word, accent }, i) => (
        <Word
          key={i}
          progress={source}
          accent={accent}
          range={[from + (i / words.length) * span, from + ((i + 1) / words.length) * span]}
        >
          {word}
        </Word>
      ))}
    </p>
  )
}

/* ------------------------------------------------------------------
   Magnetic — element leans towards the cursor.
   ------------------------------------------------------------------ */
export function Magnetic({ children, strength = 0.28, className = '' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const x = useSpring(0, { stiffness: 220, damping: 18 })
  const y = useSpring(0, { stiffness: 220, damping: 18 })

  function onMove(e) {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }

  function onLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x, y }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
