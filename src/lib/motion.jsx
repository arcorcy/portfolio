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

export function Headline({
  lines,
  className = 'display-lg',
  delay = 0,
  stagger = 0.055,
  as: Tag = 'h2',
  shown,
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
  let i = -1

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, li) => (
        <span key={li} className="block overflow-hidden" style={maskStyle}>
          {line.split(' ').map((word, wi) => {
            if (word === '') return null
            i += 1
            return (
              <motion.span
                key={`${li}-${wi}`}
                className="inline-block whitespace-pre"
                initial={false}
                animate={
                  reduce
                    ? { y: 0, opacity: lit ? 1 : 0 }
                    : { y: lit ? '0%' : HIDDEN_Y, opacity: 1 }
                }
                transition={{ duration: 1, delay: delay + i * stagger, ease: EASE }}
              >
                {word}{' '}
              </motion.span>
            )
          })}
        </span>
      ))}
    </Tag>
  )
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

export function ScrollWords({ text, lines, className = '', progress, range, as: Tag = 'p' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const own = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.45'],
  })

  /* One entry per declared line, so a caller can keep a two-sentence heading on
     its two lines. The word index runs across the lines rather than restarting
     in each, which is what makes the light sweep through in reading order
     instead of both lines filling at once. A plain string is the single-line
     case of the same thing, and stays the common one. */
  const rows = (lines ?? [text]).map(parseAccents)
  const total = rows.reduce((n, row) => n + row.length, 0)
  const perLine = lines != null

  // A pinned section drives the words from its own progress and hands over the
  // slice of it that belongs to this paragraph, because the paragraph itself
  // never moves and so has no travel of its own to measure.
  const driven = progress != null
  const source = driven ? progress : own.scrollYProgress
  const [from, to] = driven ? range : [0, LIT_AT]
  const span = to - from
  let i = -1

  return (
    <Tag ref={ref} className={className}>
      {rows.map((row, ri) => {
        const line = row.map(({ word, accent }, wi) => {
          i += 1
          if (reduce) {
            return (
              <span key={wi} className={accent ? 'text-lime' : undefined}>
                {word}{' '}
              </span>
            )
          }

          const at = i
          return (
            <Word
              key={wi}
              progress={source}
              accent={accent}
              range={[from + (at / total) * span, from + ((at + 1) / total) * span]}
            >
              {word}
            </Word>
          )
        })

        return perLine ? (
          <span key={ri} className="block">
            {line}
          </span>
        ) : (
          <Fragment key={ri}>{line}</Fragment>
        )
      })}
    </Tag>
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
