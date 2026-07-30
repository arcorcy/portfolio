import { useRef } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from 'framer-motion'

export const EASE = [0.16, 1, 0.3, 1]

/* ------------------------------------------------------------------
   Reveal — fades and lifts a block into view once.
   ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  blur = true,
  once = true,
  amount = 0.35,
  className = '',
  as = 'div',
}) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] ?? motion.div

  return (
    <MotionTag
      className={className}
      initial={{
        opacity: 0,
        y: reduce ? 0 : y,
        filter: blur && !reduce ? 'blur(8px)' : 'blur(0px)',
      }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, amount }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  )
}

/* ------------------------------------------------------------------
   Headline — word-by-word mask reveal.
   Input: array of lines, one entry per visual line. No emphasis: the
   titles carry the information on their own.
   ------------------------------------------------------------------ */
export function Headline({
  lines,
  className = 'display-lg',
  delay = 0,
  stagger = 0.055,
  as: Tag = 'h2',
}) {
  const reduce = useReducedMotion()
  let i = -1

  return (
    <Tag className={className}>
      {lines.map((line, li) => (
        <span key={li} className="block overflow-hidden pb-[0.06em]">
          {line.split(' ').map((word, wi) => {
            if (word === '') return null
            i += 1
            return (
              <motion.span
                key={`${li}-${wi}`}
                className="inline-block whitespace-pre"
                initial={{ y: reduce ? 0 : '105%', opacity: reduce ? 0 : 1 }}
                whileInView={{ y: '0%', opacity: 1 }}
                // amount 0: the words are masked, so a strict threshold could
                // leave a heading hidden if it was scrolled past quickly.
                viewport={{ once: true, amount: 0 }}
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

function Word({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.16, 1])
  return (
    <motion.span style={{ opacity }} className="inline-block whitespace-pre">
      {children}{' '}
    </motion.span>
  )
}

export function ScrollWords({ text, className = '' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.45'],
  })

  if (reduce) {
    return (
      <p ref={ref} className={className}>
        {text}
      </p>
    )
  }

  const words = text.split(' ')

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <Word
          key={i}
          progress={scrollYProgress}
          range={[(i / words.length) * LIT_AT, ((i + 1) / words.length) * LIT_AT]}
        >
          {word}
        </Word>
      ))}
    </p>
  )
}

/* ------------------------------------------------------------------
   Parallax — subtle vertical drift tied to scroll.
   ------------------------------------------------------------------ */
export function Parallax({ children, distance = 60, className = '' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const raw = useTransform(scrollYProgress, [0, 1], [distance, -distance])
  const y = useSpring(raw, { stiffness: 90, damping: 30, mass: 0.4 })

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y: reduce ? 0 : y }}>{children}</motion.div>
    </div>
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
