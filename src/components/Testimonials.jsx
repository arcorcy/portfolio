import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Headline, Reveal } from '../lib/motion.jsx'
import { testimonials as copy } from '../data/content.js'
import { testimonials } from '../data/testimonials.js'

function CardBody({ item }) {
  return (
    <div className="rounded-card bg-white p-7 ring-1 ring-ink/[0.07]">
      <p className="text-[1.125rem] font-extrabold leading-[1.4] tracking-[-0.025em]">
        {item.client}
      </p>
      <p className="mt-0.5 text-xs font-extrabold tracking-[0.1em] text-mute">{item.role}</p>
      <p className="mt-3 text-sm leading-[1.64] text-mute">{item.quote}</p>
    </div>
  )
}

/* A card the visitor can pick up and drop anywhere. dragConstraints keeps it
   inside the section, so a card can never be flung somewhere unreachable: pull
   it past the edge and it springs back into view. */
function LooseCard({ item, i, bounds, front, onGrab }) {
  return (
    <motion.div
      drag
      dragConstraints={bounds}
      dragElastic={0.18}
      dragMomentum={false}
      onPointerDown={onGrab}
      whileDrag={{ scale: 1.04 }}
      style={{ left: `${item.left}%`, top: `${item.top}%`, zIndex: front ? 40 : 10 + i }}
      className="absolute w-[min(28rem,34%)] cursor-grab active:cursor-grabbing"
      data-cursor="hover"
    >
      <motion.div
        animate={{ y: [0, -9, 0], rotate: [item.rot, item.rot + 1.1, item.rot] }}
        transition={{ duration: 7 + i * 1.3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <CardBody item={item} />
      </motion.div>
    </motion.div>
  )
}

export default function Testimonials() {
  const reduce = useReducedMotion()
  const bounds = useRef(null)
  const [frontId, setFrontId] = useState(null)

  return (
    <section className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <Headline lines={copy.title} className="display-lg text-center" />

        {/* desktop: loose, draggable, drifting */}
        <div
          ref={bounds}
          className="relative mt-20 hidden h-[clamp(26rem,31.9vw,27.625rem)] lg:block"
        >
          {!reduce &&
            testimonials.map((item, i) => (
              <LooseCard
                key={item.id}
                item={item}
                i={i}
                bounds={bounds}
                front={frontId === item.id}
                onGrab={() => setFrontId(item.id)}
              />
            ))}

          {/* reduced motion: same cards, placed but inert */}
          {reduce &&
            testimonials.map((item) => (
              <div
                key={item.id}
                style={{ left: `${item.left}%`, top: `${item.top}%` }}
                className="absolute w-[min(28rem,34%)]"
              >
                <CardBody item={item} />
              </div>
            ))}
        </div>

        {/* mobile / tablet: a plain readable list */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:hidden">
          {testimonials.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.06}>
              <CardBody item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
