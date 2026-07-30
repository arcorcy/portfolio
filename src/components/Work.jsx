import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Headline, Reveal, EASE } from '../lib/motion.jsx'
import { work } from '../data/content.js'
import { projects } from '../data/projects.js'
import Placeholder from './Placeholder.jsx'

const SPRING = { type: 'spring', stiffness: 240, damping: 28 }

// How far the front card has to travel before the throw counts as "next".
const THROW = 110

/* Where each card sits depending on its depth in the deck. The front card is
   square to the grid; the ones behind it are nudged and tilted so the stack
   reads as loose paper. */
const SLOTS = [
  { x: 0, y: 0, rot: 0, scale: 1 },
  { x: 8, y: 10, rot: -2.4, scale: 0.985 },
  { x: -6, y: 20, rot: 5.6, scale: 0.97 },
  { x: 12, y: 28, rot: 3.2, scale: 0.955 },
]

function slotFor(pos) {
  return SLOTS[Math.min(pos, SLOTS.length - 1)]
}

function Arrow({ dir, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-cursor="link"
      className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d={dir === 'prev' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

function Card({ project, pos, total, isFront, reduce, onThrow, index }) {
  const slot = slotFor(pos)

  return (
    <motion.div
      className="absolute inset-0"
      style={{ zIndex: total - pos }}
      animate={{ x: slot.x, y: slot.y, rotate: slot.rot, scale: slot.scale }}
      transition={reduce ? { duration: 0 } : SPRING}
      drag={isFront && !reduce}
      dragElastic={0.7}
      dragMomentum={false}
      whileDrag={{ scale: 1.03, zIndex: 99 }}
      onDragEnd={(_, info) => {
        if (Math.hypot(info.offset.x, info.offset.y) > THROW) onThrow()
      }}
      aria-hidden={!isFront}
    >
      <div
        className={`h-full w-full overflow-hidden rounded-shot bg-white shadow-[0_18px_44px_-22px_rgba(1,1,2,0.35)] ${
          isFront && !reduce ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      >
        {project.cover ? (
          <img
            src={project.cover}
            alt={project.title}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <Placeholder seed={index} className="h-full w-full" />
        )}
      </div>
    </motion.div>
  )
}

export default function Work() {
  const reduce = useReducedMotion()
  const [order, setOrder] = useState(projects.map((p) => p.id))

  const next = () => setOrder(([first, ...rest]) => [...rest, first])
  const prev = () => setOrder((o) => [o[o.length - 1], ...o.slice(0, -1)])

  const front = projects.find((p) => p.id === order[0])

  return (
    <section
      id="work"
      // The bottom margin (not padding) keeps the content centred in a full
      // screen while pushing the dark section's edge further down.
      className="mb-[15svh] flex min-h-svh items-center px-5 py-24 sm:px-8 lg:px-12 lg:py-16"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <Headline lines={work.title} className="display-lg text-center" />

        <div className="mt-16 grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          {/* The deck keeps the mock's proportion (~515px card) rather than
              filling its column, so the whole section fits one screen. */}
          <Reveal className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-[32rem]">
            <div className="relative aspect-[515/381] w-full select-none">
              {projects.map((project, i) => {
                const pos = order.indexOf(project.id)
                return (
                  <Card
                    key={project.id}
                    project={project}
                    index={i}
                    pos={pos}
                    total={projects.length}
                    isFront={pos === 0}
                    reduce={reduce}
                    onThrow={next}
                  />
                )
              })}
            </div>
          </Reveal>

          <div className="flex flex-col">
            {/* Reserved, bottom-anchored zone: titles vary from one to three
                lines, so they grow upwards and the arrows below never move.
                Keyed and without AnimatePresence: the copy swaps the moment the
                deck does and fades in. Waiting on an exit animation made
                repeated arrow clicks feel stuck. */}
            <div className="flex flex-col lg:min-h-[15rem] lg:justify-end">
              <motion.div
                key={front.id}
                initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <h3 className="display-sm max-w-xl">{front.title}</h3>
                <p className="mt-3 text-base text-mute">{front.subtitle}</p>

                {front.link && (
                  <a
                    href={front.link}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor="link"
                    className="link-swipe mt-5 inline-block text-sm font-bold text-forest"
                  >
                    See the full case study
                  </a>
                )}
              </motion.div>
            </div>

            <div className="mt-8 flex shrink-0 gap-2">
              <Arrow dir="prev" onClick={prev} label="Previous project" />
              <Arrow dir="next" onClick={next} label="Next project" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
