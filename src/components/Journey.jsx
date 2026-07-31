import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Headline } from '../lib/motion.jsx'
import { cardSlot, deckIndexes, deckOrder } from '../lib/journey.js'
import { stepAt } from '../lib/sequence.js'
import { journey } from '../data/journey.js'

const { timeline, quotes } = journey
const ORDER = deckOrder(timeline)
const AT = deckIndexes(timeline, ORDER)

// Scroll length of one entry, in percent of the viewport height.
const PER_ENTRY = 60

const SPRING = { type: 'spring', stiffness: 110, damping: 18, mass: 0.9 }

/* ------------------------------------------------------------------
   The ruler. Two tick sizes from two tiled gradients, so the whole
   thing is one element with nothing to measure: a short tick every
   26px, a long one every fifth. It slides against the scroll, which is
   what makes the years feel like they are running past.
   ------------------------------------------------------------------ */
const TICKS = {
  backgroundImage: [
    'linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)',
    'linear-gradient(to bottom, var(--color-line) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: '14px 26px, 34px 130px',
  backgroundRepeat: 'repeat-y, repeat-y',
}

function Ruler({ progress, reduce }) {
  // The strip is twice the panel, so half of it is travel.
  const y = useTransform(progress, [0, 1], ['0%', '-50%'])

  return (
    <div aria-hidden="true" className="relative h-full w-[34px] overflow-hidden">
      <motion.div
        className="absolute inset-x-0 top-0 h-[200%]"
        style={reduce ? TICKS : { ...TICKS, y }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------
   The list. The active entry grows and the others give way, which is a
   reflow on purpose: seven lines is cheap, and a scale would have left
   the neighbours overlapping instead of making room.
   ------------------------------------------------------------------ */
function Entries({ active }) {
  return (
    <ol className="flex flex-col gap-7">
      {timeline.map((entry, i) => {
        const on = i === active
        return (
          <li key={entry.id}>
            <p
              className={`font-bold leading-tight transition-all duration-500 ${
                on ? 'display-md text-ink' : 'text-[1.0625rem] text-ink/25'
              }`}
              style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
            >
              {entry.place}
            </p>
            <p
              className={`transition-all duration-500 ${
                on ? 'mt-3 text-base text-mute' : 'text-base text-ink/20'
              }`}
              style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
            >
              {entry.role}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

/* ------------------------------------------------------------------
   The cards
   ------------------------------------------------------------------ */
function Logo({ logo, company }) {
  if (logo) {
    return (
      <img src={logo} alt={company} className="h-10 w-10 rounded-[10px] object-contain" />
    )
  }
  // The slot, waiting for the real mark.
  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-line bg-paper text-[11px] font-bold text-ink/25"
    >
      {company.slice(0, 2).toUpperCase()}
    </div>
  )
}

function Card({ quote }) {
  const job = timeline.find((entry) => entry.id === quote.at)

  return (
    <figure className="flex h-full w-full flex-col justify-between rounded-panel border border-line bg-white p-8">
      <blockquote className="text-[1.0625rem] leading-[1.55] text-ink/80">{quote.text}</blockquote>

      <figcaption className="mt-8 flex items-center gap-3 border-t border-line pt-6">
        <Logo logo={quote.logo} company={quote.company} />
        <span className="min-w-0">
          <span className="block truncate text-[0.9375rem] font-bold text-ink">
            {quote.client}
          </span>
          <span className="block truncate text-sm text-mute">
            {quote.company}
            {job ? ` · ${job.role}` : ''}
          </span>
        </span>
      </figcaption>
    </figure>
  )
}

function Deck({ active, reduce }) {
  return (
    <div className="relative aspect-[5/4] w-full">
      {ORDER.map((id, i) => {
        const slot = cardSlot(i - active)
        return (
          <motion.div
            key={id}
            className="absolute inset-0"
            style={{ zIndex: ORDER.length - Math.abs(i - active) }}
            initial={false}
            animate={{
              x: `${slot.x}%`,
              y: `${slot.y}%`,
              rotate: slot.rot,
              scale: slot.scale,
              opacity: slot.opacity,
            }}
            transition={reduce ? { duration: 0 } : SPRING}
          >
            <Card quote={quotes[id]} />
          </motion.div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
export default function Journey() {
  const reduce = useReducedMotion()
  const track = useRef(null)
  const [active, setActive] = useState(0)

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    setActive(stepAt(p, timeline.length))
  })

  return (
    <section id="experience" className="relative">
      {/* Pinned, one entry per screen of scroll, same shape as the dark
          section: the title rides inside the panel rather than above it. */}
      <div
        ref={track}
        style={{ height: `calc(100svh + ${timeline.length * PER_ENTRY}svh)` }}
        className={`relative ${reduce ? 'hidden' : 'hidden lg:block'}`}
      >
        <div className="gutter sticky top-0 flex h-svh flex-col justify-center gap-10 overflow-hidden">
          <Headline
            lines={journey.title}
            className="display-lg mx-auto w-full max-w-[1400px] text-center"
          />

          <div className="mx-auto grid w-full max-w-[1400px] grid-cols-[34px_1fr_minmax(0,26rem)] items-center gap-x-10">
            <Ruler progress={scrollYProgress} reduce={reduce} />
            <Entries active={active} />
            <Deck active={AT[active]} reduce={reduce} />
          </div>
        </div>
      </div>

      {/* Below lg, and whenever motion is turned down: the run reads as a list,
          each entry followed by the card that belongs to it. A deck needs room
          to shuffle that a phone does not have. */}
      <div
        className={`gutter relative mx-auto w-full max-w-[1400px] py-24 sm:py-32 ${
          reduce ? '' : 'lg:hidden'
        }`}
      >
        <Headline lines={journey.title} className="display-lg mb-16 text-center" />

        <ol className="flex flex-col gap-12">
          {timeline.map((entry) => (
            <li key={entry.id}>
              <p className="display-md font-bold leading-tight">{entry.place}</p>
              <p className="mt-2 text-base text-mute">{entry.role}</p>

              {entry.quote && (
                <div className="mt-6 max-w-[34rem]">
                  <Card quote={quotes[entry.quote]} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
